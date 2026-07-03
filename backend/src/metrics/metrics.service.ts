/**
 * Prometheus metrics for monitoring dashboards (PB-202.4).
 * Exposes request count and latency for scraping by Prometheus/Grafana.
 */
import { Injectable } from '@nestjs/common';
import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const SHORT_ID_REGEX = /[a-z0-9]{20,}/gi;
const NUMERIC_ID_REGEX = /\/\d+(?=\/|$)/g;

/** Normalize path to limit cardinality: replace IDs with placeholders. */
export function normalizePath(path: string): string {
  if (!path || path === '/') return path;
  return path
    .replace(UUID_REGEX, ':id')
    .replace(SHORT_ID_REGEX, ':id')
    .replace(NUMERIC_ID_REGEX, '/:id')
    .split('?')[0];
}

@Injectable()
export class MetricsService {
  private readonly register: Registry;
  private readonly httpRequestsTotal: Counter;
  private readonly httpRequestDurationSeconds: Histogram;

  constructor() {
    this.register = new Registry();
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });
    this.httpRequestDurationSeconds = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.register],
    });
    collectDefaultMetrics({ register: this.register, prefix: 'ile_ase_' });
  }

  recordRequest(method: string, path: string, statusCode: number, durationMs: number): void {
    const route = normalizePath(path);
    const status = String(statusCode);
    this.httpRequestsTotal.inc({ method, route, status_code: status });
    this.httpRequestDurationSeconds.observe(
      { method, route, status_code: status },
      durationMs / 1000
    );
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  getContentType(): string {
    return this.register.contentType;
  }
}
