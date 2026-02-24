import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { SharedModule } from '@/shared/shared.module';
import { UserModule } from '@/modules/user/user.module';
import { FeatureFlagController } from './feature-flag.controller';

@Module({
  imports: [
    PrismaModule,
    SharedModule,
    UserModule,
  ],
  controllers: [
    AdminController,
    FeatureFlagController,
  ],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}