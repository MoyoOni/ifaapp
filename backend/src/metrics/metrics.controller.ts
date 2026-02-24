import { Controller, Get, Header, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Response } from 'express';
import { MetricsService } from './metrics.service';

/**
 * Prometheus metrics endpoint for monitoring (PB-202.4).
 * GET /api/metrics — scrape target for Prometheus; skip rate limit.
 */
@SkipThrottle()
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; charset=utf-8')
  async getMetrics(@Res() res: Response): Promise<void> {
    const output = await this.metrics.getMetrics();
    res.send(output);
  }
}
