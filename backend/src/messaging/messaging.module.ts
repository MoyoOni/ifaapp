import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { MessageCleanupService } from './message-cleanup.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MessagingGateway } from './messaging.gateway';

@Module({
  imports: [PrismaModule, ScheduleModule, forwardRef(() => AuthModule)],
  controllers: [MessagingController],
  providers: [MessagingService, MessageCleanupService, MessagingGateway],
  exports: [MessagingService],
})
export class MessagingModule {}
