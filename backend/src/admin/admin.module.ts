import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuditService as AdminAuditService } from './audit.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { SharedModule } from '@/shared/shared.module';
import { UserModule } from '@/modules/user/user.module';
import { VerificationModule } from '../verification/verification.module';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentsModule } from '../payments/payments.module';
import { CirclesModule } from '../circles/circles.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FeatureFlagController } from './feature-flag.controller';

@Module({
  imports: [
    PrismaModule,
    SharedModule,
    UserModule,
    VerificationModule,
    WalletModule,
    PaymentsModule,
    CirclesModule,
    NotificationsModule,
  ],
  controllers: [AdminController, FeatureFlagController],
  providers: [AdminService, AdminAuditService],
  exports: [AdminService],
})
export class AdminModule {}
