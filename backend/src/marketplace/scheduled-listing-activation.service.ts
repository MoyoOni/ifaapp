import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

// VENDOR_BACKLOG.md VND-008: "Scheduled listing" -- a product saved as DRAFT
// with a future `scheduledAt` flips to ACTIVE once that time passes. Hourly
// is granular enough for a launch-date feature (a vendor timing a festival
// release doesn't need minute-level precision) without polling constantly.
@Injectable()
export class ScheduledListingActivationService {
  private readonly logger = new Logger(ScheduledListingActivationService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async run() {
    const result = await this.prisma.product.updateMany({
      where: { status: 'DRAFT', scheduledAt: { lte: new Date() } },
      data: { status: 'ACTIVE' },
    });
    if (result.count > 0) {
      this.logger.log(`Activated ${result.count} scheduled product listing(s)`);
    }
  }
}
