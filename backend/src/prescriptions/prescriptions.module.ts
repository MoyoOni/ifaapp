import { Module } from '@nestjs/common';
import { GuidancePlansService } from './prescriptions.service';
import { GuidancePlansController } from './prescriptions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, WalletModule, NotificationsModule],
  providers: [GuidancePlansService],
  controllers: [GuidancePlansController],
  exports: [GuidancePlansService],
})
export class GuidancePlansModule {}
