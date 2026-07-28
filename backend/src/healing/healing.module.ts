import { Module } from '@nestjs/common';
import { HealingService } from './healing.service';
import { HealingController } from './healing.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [HealingController],
  providers: [HealingService],
  exports: [HealingService],
})
export class HealingModule {}
