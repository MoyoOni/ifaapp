import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: { check: jest.Mock };
  let mockPrisma: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    healthCheckService = {
      // Mirrors @nestjs/terminus's real behaviour closely enough for this test:
      // run every indicator function and merge the results.
      check: jest.fn(async (indicators: Array<() => Promise<any>>) => {
        const results = await Promise.all(indicators.map((fn) => fn()));
        return { status: 'ok', info: Object.assign({}, ...results), details: {} };
      }),
    };
    mockPrisma = { $queryRaw: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: healthCheckService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('only checks the database — no outbound ping to a third party (regression guard)', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await controller.check();

    // Before the fix, this array had a second indicator that pinged
    // https://google.com — a self-inflicted outage risk (see PRE_DEPLOYMENT.md
    // C4): an unrelated third party being unreachable could fail liveness for
    // an otherwise-healthy app/DB.
    const indicatorsPassed = healthCheckService.check.mock.calls[0][0];
    expect(indicatorsPassed).toHaveLength(1);
  });

  it('reports the database as up when reachable', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const result = await controller.check();

    expect(result.info).toMatchObject({ database: { status: 'up' } });
  });

  it('propagates a database failure as an unhealthy check', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('connection refused'));

    await expect(controller.check()).rejects.toThrow();
  });

  it('is exempt from rate limiting (@SkipThrottle) — a liveness probe must never itself be throttled', () => {
    // Regression guard for the Route53-health-check-triggered outage: the
    // "auth" throttle bucket is shared globally, and Route53 probes this
    // route from many source IPs concurrently by design -- without this
    // exemption, the health check itself gets rate-limited, which is
    // exactly backwards for a liveness signal.
    const metadataKeys = Reflect.getMetadataKeys(HealthController.prototype.check);
    const hasSkipThrottleMetadata = metadataKeys.some((key) => String(key).startsWith('THROTTLER:SKIP'));
    expect(hasSkipThrottleMetadata).toBe(true);
  });
});
