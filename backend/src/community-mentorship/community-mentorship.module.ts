import { Module } from '@nestjs/common';
import { CommunityMentorshipService } from './community-mentorship.service';
import { CommunityMentorshipController } from './community-mentorship.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [CommunityMentorshipController],
  providers: [CommunityMentorshipService],
  exports: [CommunityMentorshipService],
})
export class CommunityMentorshipModule {}
