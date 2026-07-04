import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';

@Injectable()
export class RebookingNudgeService {
  private readonly logger = new Logger(RebookingNudgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService
  ) {}

  @Cron(CronExpression.EVERY_WEEK)
  async sendRebookingNudges() {
    this.logger.log('Running weekly rebooking nudge check');

    const threeWeeksAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
    const today = new Date().toISOString().split('T')[0];

    // Clients whose last completed appointment was > 3 weeks ago
    // and have no upcoming confirmed/pending appointment
    const candidates = await this.prisma.user.findMany({
      where: {
        role: 'CLIENT',
        appointmentsAsClient: {
          some: {
            status: 'COMPLETED',
            date: { lt: threeWeeksAgo.toISOString().split('T')[0] },
          },
          none: {
            status: { in: ['CONFIRMED', 'PENDING_CONFIRMATION'] },
            date: { gte: today },
          },
        },
      },
      select: {
        id: true,
        appointmentsAsClient: {
          where: { status: 'COMPLETED' },
          orderBy: { date: 'desc' },
          take: 1,
          select: { babalawoId: true, babalawo: { select: { name: true } } },
        },
      },
    });

    let nudged = 0;
    for (const client of candidates) {
      const last = client.appointmentsAsClient[0];
      if (!last) continue;

      // Avoid duplicate nudges within the last 7 days
      const recentNudge = await this.prisma.notification.findFirst({
        where: {
          userId: client.id,
          data: { path: ['action'], equals: 'rebooking_nudge' },
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      });
      if (recentNudge) continue;

      await this.notificationService.createNotification({
        userId: client.id,
        type: NotificationType.APPOINTMENT,
        category: NotificationCategory.INFO,
        title: 'Time for a check-in?',
        message: `It's been a while since your last session with ${last.babalawo.name}. Ready to reconnect?`,
        data: { action: 'rebooking_nudge', babalawoId: last.babalawoId },
        sendEmail: false,
        sendPush: true,
      });
      nudged++;
    }

    this.logger.log(`Sent ${nudged} rebooking nudge(s)`);
  }
}
