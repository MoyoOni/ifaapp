import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';

const DAY_MS = 24 * 60 * 60 * 1000;

// COMMUNITY_BACKLOG.md FOR-007: an event is "in season" from 3 days before it
// starts until it ends (or, with no endDate, for the day it falls on). Shared
// by the gathering-thread cron below and ForumService.getSeasonalHighlights,
// so what gets a thread and what gets highlighted can't drift apart.
export function inSeasonEventWhere(now: Date): Prisma.SacredCalendarEventWhereInput {
  return {
    isActive: true,
    date: { lte: new Date(now.getTime() + 3 * DAY_MS) },
    OR: [{ endDate: { gte: now } }, { endDate: null, date: { gte: new Date(now.getTime() - DAY_MS) } }],
  };
}

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

  // FOR-007: daily, so a gathering thread exists before a short event starts
  // (the weekly run above could otherwise miss one entirely).
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async createGatheringThreads() {
    const events = await this.prisma.sacredCalendarEvent.findMany({
      where: { ...inSeasonEventWhere(new Date()), gatheringThreadId: null },
    });
    if (events.length === 0) return 0;

    const category = await this.prisma.forumCategory.findUnique({
      where: { slug: 'temple-connections-events' },
    });
    if (!category) return 0;

    let created = 0;
    for (const event of events) {
      const name = event.yorubaName ? `${event.yorubaName} (${event.title})` : event.title;
      const thread = await this.prisma.forumThread.create({
        data: {
          categoryId: category.id,
          authorId: event.createdBy,
          title: `${name} — Gathering`,
          content: `${event.title} begins ${event.date.toLocaleDateString()}. Share how you are preparing, ask about the observance, and walk through it alongside others honouring it.`,
          tags: ['gathering', 'sacred-calendar'],
        },
      });
      await this.prisma.sacredCalendarEvent.update({
        where: { id: event.id },
        data: { gatheringThreadId: thread.id },
      });
      await this.prisma.forumCategory.update({
        where: { id: category.id },
        data: { threadCount: { increment: 1 } },
      });
      created++;
    }
    if (created > 0) this.logger.log(`Created ${created} seasonal gathering thread(s)`);
    return created;
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
