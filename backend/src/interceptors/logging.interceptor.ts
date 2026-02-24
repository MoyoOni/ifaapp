import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  // Duplicate rxjs (backend vs root) causes Observable type mismatch; runtime is correct
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const requestId = (req as any).requestId as string | undefined;
    const method = req.method;
    const url = req.url;
    const userAgent = req.get('user-agent') || 'unknown';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const start = Date.now();

    // Extract user context if available
    const user = (req as any).user;
    const userId = user?.id;
    const userRole = user?.role;

    return next.handle().pipe(
      tap({
        next: () => {
          const status = http.getResponse().statusCode;
          const duration = Date.now() - start;

          // Structured log format
          const logData = {
            timestamp: new Date().toISOString(),
            level: 'info',
            requestId,
            method,
            url,
            status,
            durationMs: duration,
            userAgent,
            ip,
            userId,
            userRole,
          };

          this.logger.log(JSON.stringify(logData));
        },
        error: (error) => {
          const duration = Date.now() - start;

          // Structured error log
          const errorLogData = {
            timestamp: new Date().toISOString(),
            level: 'warn',
            requestId,
            method,
            url,
            status: error?.status || 500,
            durationMs: duration,
            userAgent,
            ip,
            userId,
            userRole,
            error: error?.message || 'Unknown error',
            stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
          };

          this.logger.warn(JSON.stringify(errorLogData));
        },
      })
    ) as any;
  }
}
