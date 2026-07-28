import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { ResolveUserReportDto } from './dto/resolve-user-report.dto';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';
import { AdminUsersService } from './admin-users.service';

@Injectable()
export class AdminUserReportsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private adminUsersService: AdminUsersService
  ) {}

  async getReports(currentUser: CurrentUserPayload, status?: string, page = 1, limit = 20) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view user reports');
    }

    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status.toUpperCase();

    const reports = await this.prisma.userReport.findMany({
      where,
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        reportedUser: { select: { id: true, name: true, email: true, role: true } },
        resolvedBy: { select: { id: true, name: true } },
      },
      orderBy: [{ flaggedByKeywordRule: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    });

    return reports.map((r) => ({ ...r, status: this.mapStatus(r.status) }));
  }

  async resolveReport(id: string, dto: ResolveUserReportDto, admin: CurrentUserPayload) {
    const report = await this.prisma.userReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    if (report.status === 'RESOLVED' || report.status === 'DISMISSED') {
      throw new BadRequestException('This report has already been resolved');
    }

    const status = dto.action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED';

    switch (dto.action) {
      case 'WARN':
        await this.notificationService.createNotification({
          userId: report.reportedUserId,
          type: NotificationType.SYSTEM,
          category: NotificationCategory.WARNING,
          title: 'A concern was raised about your conduct',
          message: dto.resolutionNotes,
          sendEmail: true,
        });
        break;
      case 'SUSPEND':
        // Reuses ADM-003's existing suspension mechanism, same as
        // PractitionerComplaint's SUSPEND_BOOKINGS action.
        await this.adminUsersService.suspendUser(admin, report.reportedUserId, {
          durationDays: 30,
          reason: `User report upheld: ${dto.resolutionNotes}`,
        });
        break;
      case 'DISMISS':
        break;
    }

    const resolved = await this.prisma.userReport.update({
      where: { id },
      data: {
        status,
        resolvedAt: new Date(),
        resolvedById: admin.id,
        resolutionNotes: dto.resolutionNotes,
      },
    });

    await this.notificationService.createNotification({
      userId: report.reporterId,
      type: NotificationType.SYSTEM,
      category: NotificationCategory.INFO,
      title: 'Update on your report',
      message: `Your report has been reviewed. ${dto.resolutionNotes}`,
      data: { reportId: report.id },
      sendEmail: true,
    });

    return resolved;
  }

  private mapStatus(dbStatus: string): string {
    if (dbStatus === 'OPEN' || dbStatus === 'UNDER_REVIEW') return 'PENDING';
    return dbStatus;
  }
}
