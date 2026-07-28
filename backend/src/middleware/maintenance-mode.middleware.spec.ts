import { MaintenanceModeMiddleware } from './maintenance-mode.middleware';
import { PrismaService } from '../prisma/prisma.service';

describe('MaintenanceModeMiddleware', () => {
  let middleware: MaintenanceModeMiddleware;
  let prisma: { platformSettings: { findUnique: jest.Mock } };

  beforeEach(() => {
    prisma = { platformSettings: { findUnique: jest.fn() } };
    middleware = new MaintenanceModeMiddleware(prisma as unknown as PrismaService);
  });

  function makeReqRes(path: string) {
    const req: any = { path, headers: {} };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    return { req, res, next };
  }

  it('passes every request through when maintenanceMode is false', async () => {
    prisma.platformSettings.findUnique.mockResolvedValue({ maintenanceMode: false });
    const { req, res, next } = makeReqRes('/api/marketplace/products');

    await middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('blocks a regular API request with 503 when maintenanceMode is true', async () => {
    prisma.platformSettings.findUnique.mockResolvedValue({ maintenanceMode: true });
    const { req, res, next } = makeReqRes('/api/marketplace/products');

    await middleware.use(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 503, message: expect.stringContaining('maintenance') })
    );
  });

  it.each([
    ['/api/admin/users', 'admin dashboard traffic'],
    ['/api/auth/login', 'so admins can still log in'],
    ['/api/health', 'so ALB health checks never false-alarm'],
    ['/api/metrics', 'so Prometheus scraping never false-alarm'],
  ])('always lets %s through even when maintenanceMode is true (%s)', async (path) => {
    prisma.platformSettings.findUnique.mockResolvedValue({ maintenanceMode: true });
    const { req, res, next } = makeReqRes(path);

    await middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    // The whole point of these exemptions is to never touch the DB check for
    // them, so an outage in PlatformSettings itself can't take down /health.
    expect(prisma.platformSettings.findUnique).not.toHaveBeenCalled();
  });

  it('matches allowed prefixes even without the /api global prefix present', async () => {
    prisma.platformSettings.findUnique.mockResolvedValue({ maintenanceMode: true });
    const { req, res, next } = makeReqRes('/admin/users');

    await middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('does not block on a path that merely contains "/admin" mid-segment', async () => {
    prisma.platformSettings.findUnique.mockResolvedValue({ maintenanceMode: true });
    const { req, res, next } = makeReqRes('/api/vendor-administration/products');

    await middleware.use(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it('treats a missing PlatformSettings row as maintenance mode off', async () => {
    prisma.platformSettings.findUnique.mockResolvedValue(null);
    const { req, res, next } = makeReqRes('/api/marketplace/products');

    await middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('caches the setting so repeated requests within the TTL window only hit the DB once', async () => {
    prisma.platformSettings.findUnique.mockResolvedValue({ maintenanceMode: false });
    const { req: req1, res: res1, next: next1 } = makeReqRes('/api/marketplace/products');
    const { req: req2, res: res2, next: next2 } = makeReqRes('/api/marketplace/orders');

    await middleware.use(req1, res1, next1);
    await middleware.use(req2, res2, next2);

    expect(prisma.platformSettings.findUnique).toHaveBeenCalledTimes(1);
    expect(next1).toHaveBeenCalledTimes(1);
    expect(next2).toHaveBeenCalledTimes(1);
  });

  it('re-reads the setting once the cache TTL expires, so flipping the flag takes effect without a restart', async () => {
    jest.useFakeTimers();
    try {
      prisma.platformSettings.findUnique.mockResolvedValueOnce({ maintenanceMode: false });
      const { req: req1, res: res1, next: next1 } = makeReqRes('/api/marketplace/products');
      await middleware.use(req1, res1, next1);
      expect(next1).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(16000); // past the 15s cache TTL

      prisma.platformSettings.findUnique.mockResolvedValueOnce({ maintenanceMode: true });
      const { req: req2, res: res2, next: next2 } = makeReqRes('/api/marketplace/products');
      await middleware.use(req2, res2, next2);

      expect(next2).not.toHaveBeenCalled();
      expect(res2.status).toHaveBeenCalledWith(503);
      expect(prisma.platformSettings.findUnique).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });
});
