import { Module } from '@nestjs/common';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { OrderNotificationService } from './order-notification.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

/**
 * Marketplace Module
 * Vendor verification, product listings, orders, and reviews
 */
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MarketplaceController],
  providers: [MarketplaceService, OrderNotificationService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
