import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: TypeOrmHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    const healthCheckResult = await this.health.check([
      () => this.db.pingCheck('database'),
      () => this.http.pingCheck('google', 'https://google.com'),
    ]);

    return {
      ...healthCheckResult,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      // Full Prometheus metrics are exposed separately at GET /metrics
      // (metrics.controller.ts) -- not embedded here since raw
      // exposition-format text doesn't belong in a JSON health response.
      metricsEndpoint: '/metrics',
    };
  }
}
