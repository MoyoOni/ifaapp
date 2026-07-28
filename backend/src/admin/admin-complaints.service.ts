import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { ResolveComplaintDto } from './dto/resolve-complaint.dto';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';
import { AdminUsersService } from './admin-users.service';
import { DisputesService } from '../disputes/disputes.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminComplaintsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private adminUsersService: AdminUsersService,
    private disputesService: DisputesService,
    private usersService: UsersService
  ) {}

  async getComplaints(
    currentUser: CurrentUserPayload,
    status?: string,
    page: number = 1,
    limit: number = 20
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view complaints');
    }

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status.toUpperCase();
    }

    const complaints = await this.prisma.practitionerComplaint.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, email: true } },
        practitioner: { select: { id: true, name: true, email: true, verified: true } },
      },
      // COMMUNITY_BACKLOG.md FOR-016: keyword-flagged complaints surface
      // first -- "into the existing review queue", not a separate one.
      orderBy: [{ flaggedByKeywordRule: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    });

    // Map status: 'OPEN'/'UNDER_REVIEW' -> 'PENDING'; others as is
    return complaints.map((c) => ({
      ...c,
      status: this.mapStatus(c.status),
    }));
  }

  // COMMUNITY_BACKLOG.md FOR-016: this used to be `dto.action === 'resolve'
  // ? 'RESOLVED' : 'DISMISSED'` -- the frontend never sends the literal
  // string 'resolve' (it sends WARN/SUSPEND_BOOKINGS/REVOKE_VERIFICATION/
  // ESCALATE), so every resolution silently became DISMISSED and none of
  // the four actions the admin UI offers ever did anything to the
  // practitioner's account. `clientNotification` was captured by a real
  // frontend form but discarded server-side ("skip for now" comment) --
  // now actually sent. Each action also notifies the practitioner, which
  // never happened before either.
  async resolveComplaint(id: string, dto: ResolveComplaintDto, admin: CurrentUserPayload) {
    const complaint = await this.prisma.practitionerComplaint.findUnique({
      where: { id },
    });
    if (!complaint) throw new NotFoundException('Complaint not found');
    if (complaint.status === 'RESOLVED' || complaint.status === 'DISMISSED') {
      throw new BadRequestException('This complaint has already been resolved');
    }

    const status = dto.action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED';

    switch (dto.action) {
      case 'WARN':
        await this.notificationService.createNotification({
          userId: complaint.practitionerId,
          type: NotificationType.SYSTEM,
          category: NotificationCategory.WARNING,
          title: 'A concern was raised about your conduct',
          message: dto.resolutionNotes,
          sendEmail: true,
        });
        break;
      case 'SUSPEND_BOOKINGS':
        // Reuses ADM-003's existing suspension mechanism rather than a
        // second, parallel one -- same suspendedUntil field the admin
        // "Suspend User" action already sets.
        await this.adminUsersService.suspendUser(admin, complaint.practitionerId, {
          durationDays: 30,
          reason: `Practitioner complaint upheld: ${dto.resolutionNotes}`,
        });
        break;
      case 'REVOKE_VERIFICATION':
        await this.prisma.user.update({
          where: { id: complaint.practitionerId },
          data: { verified: false },
        });
        await this.notificationService.createNotification({
          userId: complaint.practitionerId,
          type: NotificationType.VERIFICATION,
          category: NotificationCategory.URGENT,
          title: 'Your verification has been revoked',
          message: dto.resolutionNotes,
          sendEmail: true,
        });
        break;
      case 'ESCALATE':
        // Reuses the existing SPIRITUAL/SPIRITUAL_MISCONDUCT Dispute routing
        // (-> Cultural Advisory Board, URGENT priority) rather than
        // inventing a parallel escalation path.
        await this.disputesService.createFromComplaint(
          complaint.clientId,
          complaint.practitionerId,
          `Escalated practitioner complaint (${complaint.reason})`,
          complaint.description
        );
        break;
      case 'DISMISS':
        break;
    }

    const resolved = await this.prisma.practitionerComplaint.update({
      where: { id },
      data: {
        status,
        resolvedAt: new Date(),
        resolvedById: admin.id,
        resolutionNotes: dto.resolutionNotes,
      },
    });

    // Recompute immediately so an upheld complaint's -15 trust score signal
    // (users.service.ts's recomputeTrustScore) is reflected right away
    // rather than depending on some other unrelated trigger firing later.
    if (status === 'RESOLVED') {
      await this.usersService.recomputeTrustScore(complaint.practitionerId);
    }

    // Finally use the clientNotification field the frontend form has
    // always collected -- also names the Healing & Reconciliation space
    // (FOR-018) so this isn't punitive-only from the complainant's side.
    await this.notificationService.createNotification({
      userId: complaint.clientId,
      type: NotificationType.SYSTEM,
      category: NotificationCategory.INFO,
      title: 'Update on your complaint',
      message: `${dto.clientNotification} If you'd like support processing this, our Healing & Reconciliation space is here for you.`,
      data: { complaintId: complaint.id, healingPath: '/healing' },
      sendEmail: true,
    });

    return resolved;
  }

  private mapStatus(dbStatus: string): string {
    if (dbStatus === 'OPEN' || dbStatus === 'UNDER_REVIEW') {
      return 'PENDING';
    }
    return dbStatus; // RESOLVED, DISMISSED
  }
}
