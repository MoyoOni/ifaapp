import { Controller, Get, HttpCode, HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService, DetailedHealthResult } from './health.service';

/**
 * Health check endpoints for monitoring (UptimeRobot, Pingdom, load balancers).
 * GET /health — 200 when operational, 503 when unhealthy
 * GET /health/detailed — Per-service status and latency (always 200)
 * HC-202.3: Skip rate limiting so monitoring can poll freely.
 */
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getHealth(): Promise<{ status: string }> {
    const detailed = await this.health.getDetailed();
    if (detailed.status === 'unhealthy') {
      throw new ServiceUnavailableException({
        status: 'unhealthy',
        timestamp: detailed.timestamp,
        services: detailed.services,
      });
    }
    return {
      status: detailed.status === 'degraded' ? 'degraded' : 'healthy',
    };
  }

  @Get('detailed')
  @HttpCode(HttpStatus.OK)
  async getDetailed(): Promise<DetailedHealthResult> {
    return this.health.getDetailed();
  }
}
