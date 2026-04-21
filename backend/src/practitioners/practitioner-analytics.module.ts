import { Module } from '@nestjs/common';
import { PractitionerAnalyticsService } from './practitioner-analytics.service';
import { PractitionerAnalyticsController } from './practitioner-analytics.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [PractitionerAnalyticsService, PrismaService],
  controllers: [PractitionerAnalyticsController],
})
export class PractitionerAnalyticsModule {}