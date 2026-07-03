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
    this.structuredLogger.logRequest({
      level: 'info',
      message: 'Incoming request',
      timestamp: new Date().toISOString(),
      requestId,
      method,
      url: originalUrl,
      userAgent: headers['user-agent'],
      ip,
    });

    // Capture response status and time when response finishes
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      this.structuredLogger.logRequest({
        level: res.statusCode >= 400 ? 'warn' : 'info',
        message: 'Request completed',
        timestamp: new Date().toISOString(),
        requestId,
        method,
        url: originalUrl,
        statusCode: res.statusCode,
        durationMs: duration,
        userAgent: headers['user-agent'],
        ip,
      });
    });

    next();
  }

  private generateRequestId(): string {
    return (
      Date.now().toString(36) +
      Math.random()
        .toString(36)
        .substr(2, 5)
    ).toUpperCase();
  }
}