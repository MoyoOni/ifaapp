import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';

// VENDOR_BACKLOG.md VND-004: "Low stock alert (stock < configurable
// threshold) -> daily digest or immediate." Daily digest, one notification
// per vendor per day (not one per product), deduped the same way
// marketplace/seasonal-event-reminder.service.ts dedupes -- checking for an
// existing Notification whose `data.action` already covers today.
@Injectable()
export class LowStockAlertService {
  private readonly logger = new Logger(LowStockAlertService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async run() {
    const products = await this.prisma.product.findMany({
      where: { status: 'ACTIVE', isMadeToOrder: false, stock: { not: null } },
      select: {
        id: true,
        name: true,
        stock: true,
        lowStockThreshold: true,
        vendor: { select: { userId: true } },
      },
    });
    const lowStock = products.filter((p) => p.stock !== null && p.stock < p.lowStockThreshold);
    if (lowStock.length === 0) return;

    const byVendor = new Map<string, typeof lowStock>();
    for (const p of lowStock) {
      const list = byVendor.get(p.vendor.userId) ?? [];
      list.push(p);
      byVendor.set(p.vendor.userId, list);
    }

    const today = new Date().toISOString().slice(0, 10);
    let sent = 0;
    for (const [vendorUserId, vendorProducts] of byVendor) {
      const action = `low_stock_digest_${today}`;
      const alreadySentToday = await this.prisma.notification.findFirst({
        where: { userId: vendorUserId, data: { path: ['action'], equals: action } },
      });
      if (alreadySentToday) continue;

      const summary = vendorProducts
        .map((p) => `${p.name} (${p.stock === 0 ? 'out of stock' : `${p.stock} left`})`)
        .join(', ');

      await this.notificationService
        .createNotification({
          userId: vendorUserId,
          type: NotificationType.LOW_STOCK,
          category: NotificationCategory.WARNING,
          title: `${vendorProducts.length} product${vendorProducts.length > 1 ? 's' : ''} running low on stock`,
          message: summary,
          data: { action, productIds: vendorProducts.map((p) => p.id) },
          sendEmail: true,
        })
        .catch((err) => this.logger.error(`Failed to send low-stock digest to ${vendorUserId}: ${err.message}`));
      sent++;
    }

    if (sent > 0) {
      this.logger.log(`Sent ${sent} low-stock digest(s)`);
    }
  }
}
