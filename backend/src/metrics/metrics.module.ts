import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { EnhancedMetricsService } from './enhanced-metrics.service';
import { MetricsController } from './metrics.controller';
import { PerformanceMonitoringMiddleware } from './performance-monitoring.middleware';

@Module({
  controllers: [MetricsController],
  providers: [EnhancedMetricsService],
  exports: [EnhancedMetricsService],
})
export class MetricsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PerformanceMonitoringMiddleware)
      .exclude(
        { path: 'metrics', method: RequestMethod.ALL },
        { path: 'health', method: RequestMethod.ALL },
        { path: 'api-docs', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}
