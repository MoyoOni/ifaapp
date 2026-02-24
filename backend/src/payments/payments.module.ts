import { Module, forwardRef } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { LocationService } from './location.service';
import { CurrencyService } from './currency.service';
import { WebhookMonitorService } from './webhook-monitor.service';
import { PaystackApiService } from './paystack-api.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, forwardRef(() => WalletModule), NotificationsModule],
  providers: [
    PaymentsService,
    PaystackApiService,
    LocationService,
    CurrencyService,
    WebhookMonitorService,
  ],
  controllers: [PaymentsController],
  exports: [PaymentsService, CurrencyService],
})
export class PaymentsModule {}
