import { Module } from '@nestjs/common';
import { VendorCommunityService } from './vendor-community.service';
import { VendorCommunityController } from './vendor-community.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [VendorCommunityController],
  providers: [VendorCommunityService],
  exports: [VendorCommunityService],
})
export class VendorCommunityModule {}
