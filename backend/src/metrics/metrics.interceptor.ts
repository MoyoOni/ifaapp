import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const method = req.method;
    const path = req.url?.split('?')[0] ?? req.path ?? '';
    const start = Date.now();

    const result = (next.handle() as any).pipe(
      tap({
        next: () => {
          const status = http.getResponse().statusCode;
          this.metrics.recordRequest(method, path, status, Date.now() - start);
        },
        error: (err: { status?: number }) => {
          const status = err?.status ?? 500;
          this.metrics.recordRequest(method, path, status, Date.now() - start);
        },
      })
    );

    return result;
  }
}
