import { Module } from '@nestjs/common';
import { MemorialService } from './memorial.service';
import { MemorialController } from './memorial.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [MemorialController],
  providers: [MemorialService],
  exports: [MemorialService],
})
export class MemorialModule {}
