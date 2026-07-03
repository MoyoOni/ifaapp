import { Module } from '@nestjs/common';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { YorubaWordService } from './yoruba-word.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Recommendations Module
 * Personalized content recommendations and daily Yoruba word
 */
@Module({
  imports: [PrismaModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService, YorubaWordService],
  exports: [RecommendationsService, YorubaWordService],
})
export class RecommendationsModule {}
