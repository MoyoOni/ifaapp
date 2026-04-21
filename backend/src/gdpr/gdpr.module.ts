import { Module } from '@nestjs/common';
import { GdprService } from './gdpr.service';
import { GdprController } from './gdpr.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ConsentModule } from './consent.module'; // Import the consent module

@Module({
  imports: [ConsentModule], // Include the consent module
  controllers: [GdprController],
  providers: [GdprService, PrismaService],
  exports: [GdprService],
})
export class GdprModule {}