import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';

/**
 * ADM-030: enforces PlatformSettings.maintenanceMode. Deliberately
 * conservative -- always lets /admin (so admins can keep working),
 * /auth (so admins can still log in), /health, and /metrics (so ALB
 * health checks and Prometheus scraping never false-alarm) through
 * regardless of the flag. Everything else 503s while maintenance mode
 * is on. The setting is cached briefly to avoid a DB read on every
 * single request -- this app is live in production, and the common
 * case (maintenance mode off) should stay effectively free.
 */
@Injectable()
export class MaintenanceModeMiddleware implements NestMiddleware {
  private static readonly CACHE_TTL_MS = 15000;
  private static readonly ALWAYS_ALLOWED_PREFIXES = ['/admin', '/auth', '/health', '/metrics'];

  private cached: { value: boolean; expiresAt: number } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const path = req.path.startsWith('/api') ? req.path.slice(4) : req.path;
    if (MaintenanceModeMiddleware.ALWAYS_ALLOWED_PREFIXES.some((p) => path.startsWith(p))) {
      next();
      return;
    }

    const active = await this.isMaintenanceModeActive();
    if (!active) {
      next();
      return;
    }

    res.status(503).json({
      statusCode: 503,
      message: 'Ìlú Àṣẹ is currently undergoing maintenance. Please check back shortly.',
    });
  }

  private async isMaintenanceModeActive(): Promise<boolean> {
    const now = Date.now();
    if (this.cached && this.cached.expiresAt > now) {
      return this.cached.value;
    }
    const settings = await this.prisma.platformSettings.findUnique({ where: { id: 'singleton' } });
    const value = settings?.maintenanceMode ?? false;
    this.cached = { value, expiresAt: now + MaintenanceModeMiddleware.CACHE_TTL_MS };
    return value;
  }
}
