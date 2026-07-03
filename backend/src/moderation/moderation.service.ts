import { Injectable, Logger, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportViolationDto, ReportCategory, ReportPriority } from '../forum/dto/report-violation.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@common/enums/user-role.enum';
import { NotificationService, NotificationType, NotificationCategory } from '../notifications/notification.service';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private emailService: EmailService,
  ) {}

  /**
   * Create a new content report
   */
  async createReport(
    targetId: string,
    targetType: 'post' | 'comment' | 'product' | 'profile' | 'thread' | 'user',
    dto: ReportViolationDto,
    reporter: CurrentUserPayload,
  ) {
    // Check if user is trying to report their own content
    if (targetType === 'user' && targetId === reporter.id) {
      throw new BadRequestException('You cannot report your own profile');
    }

    // Validate target exists
    let targetData;
    switch (targetType) {
      case 'post':
        targetData = await this.prisma.forumPost.findUnique({ where: { id: targetId } });
        break;
      case 'comment':
        targetData = await this.prisma.comment.findUnique({ where: { id: targetId } });
        break;
      case 'product':
        targetData = await this.prisma.marketplaceProduct.findUnique({ where: { id: targetId } });
        break;
      case 'profile':
        targetData = await this.prisma.user.findUnique({ where: { id: targetId } });
        break;
      case 'thread':
        targetData = await this.prisma.forumThread.findUnique({ where: { id: targetId } });
        break;
      case 'user':
        targetData = await this.prisma.user.findUnique({ where: { id: targetId } });
        break;
      default:
        throw new BadRequestException('Invalid target type');
    }

    if (!targetData) {
      throw new NotFoundException(`${targetType} not found`);
    }

    // Check if report already exists for this target by this user
    const existingReport = await this.prisma.contentReport.findFirst({
      where: {
        reporterId: reporter.id,
        targetId,
        targetType,
      },
    });

    if (existingReport) {
      throw new BadRequestException('You have already reported this content');
    }

    // Determine priority based on category
    const priority = dto.priority || this.determinePriorityFromCategory(dto.category);

    // Create the report
    const report = await this.prisma.contentReport.create({
      data: {
        reporterId: reporter.id,
        targetId,
        targetType,
        category: dto.category,
        description: dto.description,
        additionalContext: dto.additionalContext,
        evidenceUrl: dto.evidenceUrl,
        priority,
        status: 'PENDING',
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    });

    // Notify moderators about the new report
    await this.notifyModerators(report);

    // For crisis signals, also notify immediately
    if (dto.category === ReportCategory.CRISIS_SIGNAL) {
      await this.handleCrisisSignal(report);
    }

    this.logger.log(`New report created: ${report.id} for ${targetType} ${targetId}`);

    return report;
  }

  /**
   * Get reports for a user to review
   */
  async getReports(
    currentUser: CurrentUserPayload,
    status?: string,
    category?: string,
    priority?: string,
  ) {
    // Check permissions
    if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MODERATOR) {
      throw new ForbiddenException('Only moderators can view reports');
    }

    const whereClause: any = {};
    
    if (status) whereClause.status = status;
    if (category) whereClause.category = category;
    if (priority) whereClause.priority = priority;

    return this.prisma.contentReport.findMany({
      where: whereClause,
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            role: true,
          }
        },
        targetPost: {
          select: {
            id: true,
            content: true,
            author: {
              select: { id: true, name: true, role: true }
            }
          }
        },
        targetThread: {
          select: {
            id: true,
            title: true,
            author: {
              select: { id: true, name: true, role: true }
            }
          }
        },
        targetUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  /**
   * Review a report and take action
   */
  async reviewReport(
    reportId: string,
    action: 'approve' | 'dismiss' | 'escalate',
    moderator: CurrentUserPayload,
    notes?: string,
  ) {
    // Check permissions
    if (moderator.role !== UserRole.ADMIN && moderator.role !== UserRole.MODERATOR) {
      throw new ForbiddenException('Only moderators can review reports');
    }

    const report = await this.prisma.contentReport.findUnique({
      where: { id: reportId },
      include: {
        targetPost: true,
        targetThread: true,
        targetUser: true,
      }
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Update the report status
    const updatedReport = await this.prisma.contentReport.update({
      where: { id: reportId },
      data: {
        status: action === 'approve' ? 'RESOLVED' : action === 'dismiss' ? 'DISMISSED' : 'ESCALATED',
        reviewedById: moderator.id,
        reviewedAt: new Date(),
        moderationNotes: notes,
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        targetUser: {
          select: {
            id: true,
            email: true,
          }
        }
      }
    });

    // Take action based on the review
    if (action === 'approve') {
      await this.takeModerationAction(report, moderator);
    } else if (action === 'escalate') {
      // For escalated reports, notify higher-level moderators
      await this.notifySeniorModerators(updatedReport);
    }

    // Notify the reporter of the outcome
    await this.notificationService.createNotification({
      userId: updatedReport.reporterId,
      type: NotificationType.MODERATION,
      category: NotificationCategory.REPORT_RESOLUTION,
      title: `Report ${action === 'approve' ? 'approved' : 'dismissed'}`,
      message: `Your report on ${report.targetType} has been ${action === 'approve' ? 'approved and action taken' : 'dismissed'}.`,
      data: {
        reportId: updatedReport.id,
        action,
        targetId: report.targetId,
        targetType: report.targetType,
      },
    });

    return updatedReport;
  }

  /**
   * Take appropriate moderation action based on report category
   */
  private async takeModerationAction(report: any, moderator: CurrentUserPayload) {
    switch (report.targetType) {
      case 'post':
        if (report.category === ReportCategory.CRISIS_SIGNAL) {
          // For crisis signals, don't just hide - ensure proper intervention
          await this.handleCrisisSignal(report);
        } else {
          // For other violations, hide the post
          await this.prisma.forumPost.update({
            where: { id: report.targetId },
            data: { status: 'HIDDEN' },
          });
        }
        break;
      case 'thread':
        // Hide the thread
        await this.prisma.forumThread.update({
          where: { id: report.targetId },
          data: { status: 'HIDDEN' },
        });
        break;
      case 'user':
        // Based on severity, might need to suspend account
        if (report.priority === ReportPriority.CRITICAL) {
          await this.prisma.user.update({
            where: { id: report.targetId },
            data: { isSuspended: true },
          });
        }
        break;
      default:
        // For other types, consider what action is appropriate
        break;
    }

    // Log the action
    this.logger.log(`Moderation action taken on ${report.targetType} ${report.targetId} by ${moderator.id}`);
  }

  /**
   * Handle crisis signals with special protocols
   */
  private async handleCrisisSignal(report: any) {
    // Send immediate notification to crisis response team
    await this.emailService.sendCrisisAlert({
      subject: 'URGENT: Crisis Signal Detected',
      content: `A user has posted content that may indicate a mental health crisis.\n\nReport ID: ${report.id}\nContent: ${report.description}\nPosted by: ${report.targetUserId || 'Unknown'}`,
      recipients: [process.env.CRISIS_ALERT_EMAIL || 'admin@example.com'],
    });

    // Also notify senior moderators directly
    await this.notifySeniorModerators(report);
  }

  /**
   * Determine priority based on category
   */
  private determinePriorityFromCategory(category: ReportCategory): ReportPriority {
    switch (category) {
      case ReportCategory.CRISIS_SIGNAL:
      case ReportCategory.HATE_SPEECH:
        return ReportPriority.CRITICAL;
      case ReportCategory.HARASSMENT:
      case ReportCategory.FRAUD:
        return ReportPriority.HIGH;
      case ReportCategory.SACRED_KNOWLEDGE_MISUSE:
      case ReportCategory.PRIVACY_VIOLATION:
        return ReportPriority.MEDIUM;
      default:
        return ReportPriority.LOW;
    }
  }

  /**
   * Notify moderators about a new report
   */
  private async notifyModerators(report: any) {
    // Find all moderators
    const moderators = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.ADMIN, UserRole.MODERATOR] },
        isSuspended: false,
      },
      select: {
        id: true,
      }
    });

    // Create notifications for each moderator
    for (const mod of moderators) {
      await this.notificationService.createNotification({
        userId: mod.id,
        type: NotificationType.MODERATION,
        category: NotificationCategory.CONTENT_REPORT,
        title: 'New Content Report',
        message: `A new ${report.category} report requires review.`,
        data: {
          reportId: report.id,
          category: report.category,
          priority: report.priority,
          targetId: report.targetId,
          targetType: report.targetType,
        },
      });
    }
  }

  /**
   * Notify senior moderators about escalated reports
   */
  private async notifySeniorModerators(report: any) {
    // Find all admins
    const admins = await this.prisma.user.findMany({
      where: {
        role: UserRole.ADMIN,
        isSuspended: false,
      },
      select: {
        id: true,
      }
    });

    // Create notifications for each admin
    for (const admin of admins) {
      await this.notificationService.createNotification({
        userId: admin.id,
        type: NotificationType.MODERATION,
        category: NotificationCategory.ESCALATED_REPORT,
        title: 'Escalated Content Report',
        message: `A report has been escalated and requires immediate attention.`,
        data: {
          reportId: report.id,
          category: report.category,
          priority: report.priority,
          targetId: report.targetId,
          targetType: report.targetType,
        },
      });
    }
  }
}