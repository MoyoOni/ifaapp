import { Module } from '@nestjs/common';
import { GdprService } from './gdpr.service';
import { GdprController } from './gdpr.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [GdprController],
  providers: [GdprService, PrismaService],
  exports: [GdprService],
})
export class GdprModule {}