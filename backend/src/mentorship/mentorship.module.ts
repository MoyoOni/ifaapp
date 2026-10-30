import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MentorshipController } from './mentorship.controller';
import { MentorshipService } from './mentorship.service';

@Module({
  imports: [PrismaModule, forwardRef(() => WalletModule), NotificationsModule],
  controllers: [MentorshipController],
  providers: [MentorshipService],
  exports: [MentorshipService],
})
export class MentorshipModule {}
