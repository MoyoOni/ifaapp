import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { EscrowExpiryService } from './escrow-expiry.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, ScheduleModule, forwardRef(() => PaymentsModule), NotificationsModule],
  providers: [WalletService, EscrowExpiryService],
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule {}
