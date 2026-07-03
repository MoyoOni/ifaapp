import { Module } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { ModerationController } from './moderation.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { EmailService } from '../notifications/email.service';

@Module({
  controllers: [ModerationController],
  providers: [ModerationService, PrismaService, NotificationService, EmailService],
  exports: [ModerationService],
})
export class ModerationModule {}