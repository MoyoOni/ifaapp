import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';
import { ReportHealingCaseDto, ResolveHealingCaseDto, UpdateElderNotesDto } from './dto/healing.dto';

// COMMUNITY_BACKLOG.md FOR-018: Community Healing & Reconciliation.
// Restorative, elder-mediated -- not the same system as PractitionerComplaint
// (admin-adjudicated formal complaints) or ElderFlag (content-accuracy).
// A case is never visible outside reporter/respondent/assigned elder/admin.
@Injectable()
export class HealingService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationService: NotificationService
  ) {}

  private canView(caseRecord: any, userId: string, role: string): boolean {
    return (
      role === 'ADMIN' ||
      caseRecord.reporterId === userId ||
      caseRecord.respondentId === userId ||
      caseRecord.assignedElderId === userId
    );
  }

  async report(dto: ReportHealingCaseDto, reporterId: string) {
    let respondentId: string | undefined;
    if (dto.respondentEmail) {
      const respondent = await this.prisma.user.findUnique({
        where: { email: dto.respondentEmail },
        select: { id: true },
      });
      respondentId = respondent?.id;
    }

    const healingCase = await this.prisma.healingCase.create({
      data: {
        reporterId,
        respondentId,
        category: dto.category,
        description: dto.description,
      },
    });

    // Notify designated elders/admins that a case awaits assignment --
    // mirrors the same non-blocking notify-on-report pattern used for
    // wellbeing check-ins (FOR-017) and crisis signals (FOR-002/FOR-015).
    const elders = await this.prisma.user.findMany({
      where: { OR: [{ role: 'BABALAWO' }, { role: 'ADMIN' }] },
      select: { id: true },
      take: 10,
    });
    elders.forEach(({ id }) => {
      this.notificationService
        .createNotification({
          userId: id,
          type: NotificationType.SYSTEM,
          category: NotificationCategory.INFO,
          title: 'A community healing case awaits an elder',
          message:
            'Someone has asked for help resolving a conflict. Open Healing & Reconciliation to review.',
          data: { healingCaseId: healingCase.id },
        })
        .catch(() => undefined);
    });

    return healingCase;
  }

  async findMine(userId: string) {
    const cases = await this.prisma.healingCase.findMany({
      where: { OR: [{ reporterId: userId }, { respondentId: userId }] },
      orderBy: { createdAt: 'desc' },
      include: {
        assignedElder: { select: { id: true, name: true, yorubaName: true } },
      },
    });
    // The reporter/respondent must never see the elder's private notes.
    return cases.map(({ elderPrivateNotes, ...rest }) => rest);
  }

  private async assertElder(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user || (user.role !== 'BABALAWO' && user.role !== 'ADMIN')) {
      throw new ForbiddenException('Only Babalawos or admins can access the healing case queue');
    }
  }

  async findQueue(elderId: string) {
    await this.assertElder(elderId);
    return this.prisma.healingCase.findMany({
      where: { status: { in: ['OPEN', 'IN_MEDIATION'] } },
      orderBy: { createdAt: 'asc' },
      include: {
        reporter: { select: { id: true, name: true, yorubaName: true } },
        respondent: { select: { id: true, name: true, yorubaName: true } },
        assignedElder: { select: { id: true, name: true } },
      },
    });
  }

  async assign(caseId: string, elderId: string) {
    await this.assertElder(elderId);
    const healingCase = await this.prisma.healingCase.findUnique({ where: { id: caseId } });
    if (!healingCase) throw new NotFoundException('Healing case not found');
    if (healingCase.assignedElderId) {
      throw new BadRequestException('This case has already been claimed by an elder');
    }
    return this.prisma.healingCase.update({
      where: { id: caseId },
      data: { assignedElderId: elderId, assignedAt: new Date(), status: 'IN_MEDIATION' },
    });
  }

  async resolve(caseId: string, dto: ResolveHealingCaseDto, elderId: string, isAdmin: boolean) {
    const healingCase = await this.prisma.healingCase.findUnique({ where: { id: caseId } });
    if (!healingCase) throw new NotFoundException('Healing case not found');
    if (healingCase.assignedElderId !== elderId && !isAdmin) {
      throw new ForbiddenException('Only the assigned elder or an admin can resolve this case');
    }
    return this.prisma.healingCase.update({
      where: { id: caseId },
      data: { status: 'RESOLVED', resolutionNotes: dto.resolutionNotes, resolvedAt: new Date() },
    });
  }

  async findOne(caseId: string, userId: string, role: string) {
    const healingCase = await this.prisma.healingCase.findUnique({
      where: { id: caseId },
      include: {
        reporter: { select: { id: true, name: true, yorubaName: true } },
        respondent: { select: { id: true, name: true, yorubaName: true } },
        assignedElder: { select: { id: true, name: true, yorubaName: true } },
      },
    });
    if (!healingCase) throw new NotFoundException('Healing case not found');
    if (!this.canView(healingCase, userId, role)) {
      throw new ForbiddenException('You do not have access to this healing case');
    }
    // Only the assigned elder or an admin gets to see elderPrivateNotes --
    // the reporter/respondent, even though they can view the rest of the case, cannot.
    const canSeePrivateNotes = role === 'ADMIN' || healingCase.assignedElderId === userId;
    if (!canSeePrivateNotes) {
      const { elderPrivateNotes, ...rest } = healingCase;
      return rest;
    }
    return healingCase;
  }

  async updateElderNotes(
    caseId: string,
    userId: string,
    isAdmin: boolean,
    dto: UpdateElderNotesDto
  ) {
    const healingCase = await this.prisma.healingCase.findUnique({ where: { id: caseId } });
    if (!healingCase) throw new NotFoundException('Healing case not found');
    if (healingCase.assignedElderId !== userId && !isAdmin) {
      throw new ForbiddenException('Only the assigned elder or an admin can add private notes');
    }
    return this.prisma.healingCase.update({
      where: { id: caseId },
      data: { elderPrivateNotes: dto.elderPrivateNotes },
    });
  }
}
