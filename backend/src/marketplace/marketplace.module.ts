import { Module, forwardRef } from '@nestjs/common';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { OrderNotificationService } from './order-notification.service';
import { SeasonalEventReminderService } from './seasonal-event-reminder.service';
import { ScheduledListingActivationService } from './scheduled-listing-activation.service';
import { LowStockAlertService } from './low-stock-alert.service';
import { VendorPerformanceTierService } from './vendor-performance-tier.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { SearchModule } from '../search/search.module';
import { WhatsAppModule } from '../whatsapp';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DisputesModule } from '../disputes/disputes.module';
import { DocumentsModule } from '../documents/documents.module';
import { SecurityModule } from '../security/security.module';

/**
 * Marketplace Module
 * Vendor verification, product listings, orders, and reviews
 */
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    SearchModule,
    WhatsAppModule,
    forwardRef(() => WalletModule),
    NotificationsModule,
    DisputesModule,
    DocumentsModule,
    SecurityModule,
  ],
  controllers: [MarketplaceController],
  providers: [
    MarketplaceService,
    OrderNotificationService,
    SeasonalEventReminderService,
    ScheduledListingActivationService,
    LowStockAlertService,
    VendorPerformanceTierService,
  ],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
