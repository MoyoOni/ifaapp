import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HttpHealthIndicator, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { EnhancedMetricsService } from '../metrics/enhanced-metrics.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: TypeOrmHealthIndicator,
    private metricsService: EnhancedMetricsService,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    const healthCheckResult = await this.health.check([
      () => this.db.pingCheck('database'),
      () => this.http.pingCheck('google', 'https://google.com'),
    ]);

    // Add custom metrics to the health check
    const metrics = await this.metricsService.getMetrics();
    
    return {
      ...healthCheckResult,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      metricsEndpoint: '/metrics',
    };
  }
}
