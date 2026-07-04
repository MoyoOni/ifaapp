import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { StructuredLoggerService } from './structured-logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly structuredLogger: StructuredLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, ip, headers } = req;

    // Generate a unique request ID for tracing
    const requestId = this.generateRequestId();
    req.headers['x-request-id'] = requestId;

    // Log the incoming request
    this.structuredLogger.log('Incoming request', {
      requestId,
      method,
      path: originalUrl,
      userAgent: Array.isArray(headers['user-agent'])
        ? headers['user-agent'][0]
        : headers['user-agent'],
      ip,
    });

    // Capture response status and time when response finishes
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logContext = {
        requestId,
        method,
        path: originalUrl,
        statusCode: res.statusCode,
        durationMs: duration,
        userAgent: Array.isArray(headers['user-agent'])
          ? headers['user-agent'][0]
          : headers['user-agent'],
        ip,
      };

      if (res.statusCode >= 400) {
        this.structuredLogger.warn('Request completed', logContext);
      } else {
        this.structuredLogger.log('Request completed', logContext);
      }
    });

    next();
  }

  private generateRequestId(): string {
    return (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase();
  }
}
