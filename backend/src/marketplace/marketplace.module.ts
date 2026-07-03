import { Module, forwardRef } from '@nestjs/common';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { OrderNotificationService } from './order-notification.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { SearchModule } from '../search/search.module';
import { WhatsAppModule } from '../whatsapp';
import { WalletModule } from '../wallet/wallet.module';

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
  ],
  controllers: [MarketplaceController],
  providers: [MarketplaceService, OrderNotificationService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
