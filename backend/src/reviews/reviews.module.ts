import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { ReviewRequestNudgeService } from './review-request-nudge.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewRequestNudgeService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
