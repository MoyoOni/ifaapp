import { Module } from '@nestjs/common';
import { GuidancePlansService } from './prescriptions.service';
import { GuidancePlansController } from './prescriptions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationService } from '../notifications/notification.service';
import { NotificationPreferencesService } from '../notifications/notification-preferences.service';

// NotificationService/NotificationPreferencesService provided directly here
// for the same reason as WalletModule/AppointmentsModule/etc — see wallet.module.ts.
@Module({
  imports: [PrismaModule, WalletModule, NotificationsModule],
  providers: [GuidancePlansService, NotificationService, NotificationPreferencesService],
  controllers: [GuidancePlansController],
  exports: [GuidancePlansService],
})
export class GuidancePlansModule {}
