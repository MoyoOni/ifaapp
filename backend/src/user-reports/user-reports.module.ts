import { Module } from '@nestjs/common';
import { UserReportsService } from './user-reports.service';
import { UserReportsController } from './user-reports.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [UserReportsController],
  providers: [UserReportsService],
  exports: [UserReportsService],
})
export class UserReportsModule {}
