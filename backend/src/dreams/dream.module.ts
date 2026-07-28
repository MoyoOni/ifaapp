import { Module } from '@nestjs/common';
import { DreamService } from './dream.service';
import { DreamController } from './dream.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DreamController],
  providers: [DreamService],
  exports: [DreamService],
})
export class DreamModule {}
