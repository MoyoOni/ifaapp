import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Assigns a unique request ID to each request for tracing and log correlation.
 * Uses existing X-Request-Id header if present (e.g. from a load balancer), otherwise generates one.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const existing = req.headers[REQUEST_ID_HEADER] as string | undefined;
    const id = (existing?.trim() || randomUUID()) as string;
    (req as any).requestId = id;
    res.setHeader(REQUEST_ID_HEADER, id);
    next();
  }
}
