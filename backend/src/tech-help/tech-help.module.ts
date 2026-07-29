import { Module } from '@nestjs/common';
import { TechHelpService } from './tech-help.service';
import { TechHelpController } from './tech-help.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [TechHelpController],
  providers: [TechHelpService],
  exports: [TechHelpService],
})
export class TechHelpModule {}
