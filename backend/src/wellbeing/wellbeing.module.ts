import { Module } from '@nestjs/common';
import { WellbeingService } from './wellbeing.service';
import { WellbeingController } from './wellbeing.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [WellbeingController],
  providers: [WellbeingService],
  exports: [WellbeingService],
})
export class WellbeingModule {}
