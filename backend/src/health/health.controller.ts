import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckError,
  HealthCheckService,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaService
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    // This endpoint gates ECS/ALB/Docker liveness -- it must only fail for
    // things that mean *this app* is unhealthy. It used to also ping
    // https://google.com, which meant a NAT/outbound-internet hiccup with
    // zero impact on the app or DB could still get a perfectly healthy
    // container cycled by the orchestrator. Removed rather than made
    // non-fatal, since there's no real liveness signal an unrelated third
    // party can give us anyway.
    const healthCheckResult = await this.health.check([() => this.checkDatabase()]);

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
