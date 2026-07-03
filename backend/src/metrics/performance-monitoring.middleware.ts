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
    const userAgent = req.get('User-Agent') || 'unknown';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    // Record the start of the request
    this.metricsService.recordRequestStart(method, url);

    // Capture metrics when response finishes
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Record various metrics
      this.metricsService.recordRequest({
        method,
        url,
        statusCode,
        duration,
        userAgent,
        ip,
      });

      // Record duration histogram
      this.metricsService.recordResponseTime(method, url, duration);

      // Record status code count
      this.metricsService.recordStatusCode(statusCode);
    });

    next();
  }
}