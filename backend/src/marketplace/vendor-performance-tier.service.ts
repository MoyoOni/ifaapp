import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MarketplaceService } from './marketplace.service';

// VENDOR_BACKLOG.md VND-026: "tier calculation service (runs nightly)."
// Same recurring-cron shape as low-stock-alert.service.ts and
// seasonal-event-reminder.service.ts in this module -- recomputes and
// persists every APPROVED vendor's performanceTier so product-listing reads
// can use it as a cheap sort tiebreaker without recomputing metrics live.
@Injectable()
export class VendorPerformanceTierService {
  private readonly logger = new Logger(VendorPerformanceTierService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly marketplaceService: MarketplaceService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async run() {
    const vendors = await this.prisma.vendor.findMany({ where: { status: 'APPROVED' }, select: { id: true } });
    let changed = 0;
    for (const vendor of vendors) {
      try {
        const previous = await this.prisma.vendor.findUnique({ where: { id: vendor.id }, select: { performanceTier: true } });
        const newTier = await this.marketplaceService.recalculateVendorPerformanceTier(vendor.id);
        if (previous?.performanceTier !== newTier) changed++;
      } catch (err) {
        this.logger.error(`Failed to recalculate performance tier for vendor ${vendor.id}: ${(err as Error).message}`);
      }
    }
    this.logger.log(`Recalculated performance tiers for ${vendors.length} vendor(s), ${changed} tier change(s)`);
  }
}
