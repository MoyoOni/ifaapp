import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';

// VENDOR_BACKLOG.md VND-022: "7 days after order delivered -> auto-send
// 'please leave a review' notification". Same daily-cron-plus-guard pattern
// as appointments/rebooking-nudge.service.ts and
// marketplace/seasonal-event-reminder.service.ts, except the dedupe guard
// here is a dedicated `Order.reviewRequestSentAt` column rather than
// scanning notification history, since it's also shared with the vendor's
// manual "request a review" trigger (ReviewsService.requestReviewForOrder).
@Injectable()
export class ReviewRequestNudgeService {
  private readonly logger = new Logger(ReviewRequestNudgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async run() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    // A day-wide window (7-8 days ago), not "<= 7 days ago" -- an unbounded
    // lower edge would re-scan every delivered order ever once its
    // reviewRequestSentAt guard is in place, so this is just an efficiency
    // bound, not a correctness one (the real guard is reviewRequestSentAt).
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: ['COMPLETED', 'DELIVERED'] },
        deliveredAt: { gte: eightDaysAgo, lte: sevenDaysAgo },
        reviewRequestSentAt: null,
      },
      include: { items: { take: 1, select: { productId: true } } },
    });

    let sent = 0;
    for (const order of orders) {
      await this.notificationService
        .createNotification({
          userId: order.customerId,
          type: NotificationType.SYSTEM,
          category: NotificationCategory.INFO,
          title: 'How was your order?',
          message: 'It has been a week since your order was delivered -- please leave a review to help other seekers.',
          data: { action: 'review_request', orderId: order.id, productId: order.items[0]?.productId },
          sendEmail: true,
        })
        .catch((err) => this.logger.error(`Failed to send review request for order ${order.id}: ${err.message}`));

      await this.prisma.order.update({
        where: { id: order.id },
        data: { reviewRequestSentAt: now },
      });
      sent++;
    }

    if (sent > 0) {
      this.logger.log(`Sent ${sent} review request notification(s)`);
    }
  }
}
