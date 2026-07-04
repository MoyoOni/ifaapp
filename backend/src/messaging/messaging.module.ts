import { Module, forwardRef } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { MessageCleanupService } from './message-cleanup.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MessagingGateway } from './messaging.gateway';

// MessageCleanupService's @Cron job doesn't need ScheduleModule imported here
// — see the same note in wallet.module.ts. ScheduleModule.forRoot() is
// registered once, globally, in app.module.ts (P1-01); this @Cron job (like
// EscrowExpiryService's) was silently inert before that fix.
@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [MessagingController],
  providers: [MessagingService, MessageCleanupService, MessagingGateway],
  exports: [MessagingService, MessagingGateway],
})
export class MessagingModule {}
