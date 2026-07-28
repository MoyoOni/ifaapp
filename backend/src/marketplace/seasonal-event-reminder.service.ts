import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';

// SHOP_BACKLOG.md MSP-008: "Client reminders tied to calendar entries" and
// "Post-ceremony/post-season community reflection tied to Forum". Same
// weekly-cron-plus-dedupe pattern as appointments/rebooking-nudge.service.ts.
@Injectable()
export class SeasonalEventReminderService {
  private readonly logger = new Logger(SeasonalEventReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService
  ) {}

  @Cron(CronExpression.EVERY_WEEK)
  async run() {
    this.logger.log('Running weekly seasonal event reminder + reflection check');
    const reminded = await this.sendClientReminders();
    const reflected = await this.createPostEventReflectionThreads();
    this.logger.log(
      `Sent ${reminded} event reminder(s), created ${reflected} reflection thread(s)`
    );
  }

  private async sendClientReminders() {
    const now = new Date();
    const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const events = await this.prisma.sacredCalendarEvent.findMany({
      where: { isActive: true, date: { gte: now, lte: soon } },
      include: { participations: { select: { userId: true } } },
    });

    let sent = 0;
    for (const event of events) {
      const action = `seasonal_event_reminder_${event.id}`;
      for (const participation of event.participations) {
        const recent = await this.prisma.notification.findFirst({
          where: {
            userId: participation.userId,
            data: { path: ['action'], equals: action },
            createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
          },
        });
        if (recent) continue;

        await this.notificationService
          .createNotification({
            userId: participation.userId,
            type: NotificationType.SYSTEM,
            category: NotificationCategory.INFO,
            title: `${event.title} is coming up`,
            message: `You RSVP'd to ${event.title} on ${event.date.toLocaleDateString()}. A gentle reminder to prepare.`,
            data: { action, eventId: event.id },
          })
          .catch(() => undefined);
        sent++;
      }
    }
    return sent;
  }

  private async createPostEventReflectionThreads() {
    const now = new Date();
    const recentPast = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const events = await this.prisma.sacredCalendarEvent.findMany({
      where: {
        isActive: true,
        reflectionThreadId: null,
        OR: [
          { endDate: { gte: recentPast, lt: now } },
          { endDate: null, date: { gte: recentPast, lt: now } },
        ],
      },
    });
    if (events.length === 0) return 0;

    const category = await this.prisma.forumCategory.findUnique({
      where: { slug: 'temple-connections-events' },
    });
    if (!category) return 0;

    let created = 0;
    for (const event of events) {
      const thread = await this.prisma.forumThread.create({
        data: {
          categoryId: category.id,
          authorId: event.createdBy,
          title: `${event.title} — Reflections`,
          content: `${event.title} has passed. How did it go for you? Share your reflections, what you learned, and how you're carrying it forward.`,
          tags: ['reflection', 'sacred-calendar'],
        },
      });
      await this.prisma.sacredCalendarEvent.update({
        where: { id: event.id },
        data: { reflectionThreadId: thread.id },
      });
      await this.prisma.forumCategory.update({
        where: { id: category.id },
        data: { threadCount: { increment: 1 } },
      });
      created++;
    }
    return created;
  }
}
