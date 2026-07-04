import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { EnhancedMetricsService } from './enhanced-metrics.service';

@Injectable()
export class PerformanceMonitoringMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: EnhancedMetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const method = req.method;
    const url = req.url;

    // Record the start of the request
    this.metricsService.recordRequestStart(method, url);

    // Capture metrics when response finishes
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // recordHttpRequest covers the requests-total counter, the duration
      // histogram, and the status-code counter in one call — the three
      // separate methods this used to call (recordRequest/recordResponseTime/
      // recordStatusCode) never existed on EnhancedMetricsService.
      this.metricsService.recordHttpRequest(method, url, statusCode, duration);
      this.metricsService.recordRequestEnd(method, url);
    });

    next();
  }
}
