import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from '../prisma/prisma.module';
import { PerformanceOptimizationService } from './performance-optimization.service';
import { PerformanceOptimizationController } from './performance-optimization.controller';
import { DbOptimizationService } from './db-optimization.service';
import { DbOptimizationController } from './db-optimization.controller';
import { CdnOptimizationService } from './cdn-optimization.service';
import { CdnOptimizationController } from './cdn-optimization.controller';
import { CachingStrategyService } from './caching-strategy.service';
import { CachingStrategyController } from './caching-strategy.controller';

@Module({
  imports: [
    PrismaModule,
    CacheModule.register({ ttl: 60000, max: 1000 }), // Default cache configuration
  ],
  providers: [
    PerformanceOptimizationService,
    DbOptimizationService,
    CdnOptimizationService,
    CachingStrategyService,
  ],
  controllers: [
    PerformanceOptimizationController,
    DbOptimizationController,
    CdnOptimizationController,
    CachingStrategyController,
  ],
  exports: [
    PerformanceOptimizationService,
    DbOptimizationService,
    CdnOptimizationService,
    CachingStrategyService,
  ],
})
export class PerformanceModule {}