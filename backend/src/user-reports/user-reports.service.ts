import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';
import { FileUserReportDto } from './dto/file-user-report.dto';
import { isSafeguardingReason, isUrgentReason, safeguardingAdminsWhere } from '../safeguarding/safeguarding';
import { SafeguardingCasesService } from '../safeguarding/cases.service';

// Whole-app audit loose end: generic version of complaints.service.ts's
// PractitionerComplaint flow, for reporting any user (not just a babalawo).
// The profile "Report" button for non-babalawo users had no backend at all
// before this -- it was hidden rather than left as a fake no-op.
@Injectable()
export class UserReportsService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly cases: SafeguardingCasesService
  ) {}

  async file(dto: FileUserReportDto, reporterId: string) {
    if (dto.reportedUserId === reporterId) {
      throw new BadRequestException('You cannot report yourself');
    }

    const reportedUser = await this.prisma.user.findUnique({
      where: { id: dto.reportedUserId },
      select: { id: true },
    });
    if (!reportedUser) {
      throw new NotFoundException('User not found');
    }

    const matchedKeywords = await this.matchKeywordFlagRules(dto.description);
    const urgent = matchedKeywords.length > 0 || isUrgentReason(dto.reason);
    const safeguarding = isSafeguardingReason(dto.reason);

    const report = await this.prisma.userReport.create({
      data: {
        reporterId,
        reportedUserId: dto.reportedUserId,
        reason: dto.reason,
        description: dto.description,
        flaggedByKeywordRule: matchedKeywords.length > 0,
        matchedKeywords,
        urgent,
      },
    });
    if (safeguarding) {
      await this.cases.openQuietly({
        source: 'USER_REPORT',
        sourceId: report.id,
        subjectId: dto.reportedUserId,
        reporterId,
        category: dto.reason,
        summary: dto.description,
        priority: urgent ? 1 : 2,
      });
    }

    // A safeguarding report goes only to the admins who may read it
    // (SAFE-03); spam, impersonation and the like stay with moderators.
    const admins = await this.prisma.user.findMany({
      where: safeguarding
        ? safeguardingAdminsWhere
        : { role: 'ADMIN', adminSubRole: { in: ['MODERATOR', 'SUPER'] } },
      select: { id: true },
      take: 10,
    });
    admins.forEach(({ id }) => {
      this.notificationService
        .createNotification({
          userId: id,
          type: NotificationType.SYSTEM,
          category: urgent ? NotificationCategory.URGENT : NotificationCategory.WARNING,
          title: urgent
            ? 'An urgent safeguarding concern needs review'
            : safeguarding
              ? 'A safeguarding concern awaits review'
              : 'A user report awaits review',
          message: urgent
            ? 'A report about a member was marked urgent. Open the User Reports tab now.'
            : 'A community member has reported another user. Open the User Reports tab to review.',
          data: { reportId: report.id },
        })
        .catch(() => undefined);
    });

    return report;
  }

  private async matchKeywordFlagRules(description: string): Promise<string[]> {
    const rules = await this.prisma.contentFlagRule.findMany({
      where: { type: 'KEYWORD', isActive: true },
      select: { value: true },
    });
    const lowerDescription = description.toLowerCase();
    return rules
      .map((r) => r.value)
      .filter((keyword) => lowerDescription.includes(keyword.toLowerCase()));
  }

  async findMine(reporterId: string) {
    return this.prisma.userReport.findMany({
      where: { reporterId },
      orderBy: { createdAt: 'desc' },
      include: {
        reportedUser: { select: { id: true, name: true, role: true } },
      },
    });
  }
}
