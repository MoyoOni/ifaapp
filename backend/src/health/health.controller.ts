import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckError,
  HealthCheckService,
  HealthIndicatorResult,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private prisma: PrismaService
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    const healthCheckResult = await this.health.check([
      () => this.checkDatabase(),
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

  // This app uses Prisma, not TypeORM -- @nestjs/terminus's
  // TypeOrmHealthIndicator requires the typeorm package, which isn't
  // installed, and crashes app bootstrap the moment this module is
  // instantiated (not just when the route is called).
  private async checkDatabase(): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { database: { status: 'up' } };
    } catch (error) {
      throw new HealthCheckError('database check failed', {
        database: { status: 'down', message: (error as Error).message },
      });
    }
  }
}
