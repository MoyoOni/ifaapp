import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SentryService } from '../../sentry/sentry.service';

@Injectable()
export class SentryMiddleware implements NestMiddleware {
  constructor(private readonly sentryService: SentryService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Set user context if authenticated
    if ((req as any).user) {
      this.sentryService.setUser({
        id: (req as any).user.id,
        email: (req as any).user.email,
        role: (req as any).user.role,
      });
    }

    // Add breadcrumb for request
    this.sentryService.addBreadcrumb({
      category: 'http',
      message: `${req.method} ${req.url}`,
      level: 'info',
      data: {
        method: req.method,
        url: req.url,
        query: req.query,
      },
    });

    next();
  }
}
