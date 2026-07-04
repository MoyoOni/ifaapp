import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { EnhancedMetricsService } from './enhanced-metrics.service';

/**
 * Prometheus metrics endpoint for monitoring (PB-202.4).
 * GET /api/metrics — scrape target for Prometheus; skip rate limit.
 */
@SkipThrottle()
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: EnhancedMetricsService) {}

  @Get()
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
