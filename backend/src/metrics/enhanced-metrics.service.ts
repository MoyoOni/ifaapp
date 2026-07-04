import { Injectable, Logger } from '@nestjs/common';
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { normalizePath } from './metrics.service';

const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const SHORT_ID_REGEX = /[a-z0-9]{20,}/gi;
const NUMERIC_ID_REGEX = /\/\d+(?=\/|$)/g;

/** Normalize path to limit cardinality: replace IDs with placeholders. */
export function normalizePathWithAdditionalMetrics(path: string): string {
  if (!path || path === '/') return path;
  return path
    .replace(UUID_REGEX, ':id')
    .replace(SHORT_ID_REGEX, ':id')
    .replace(NUMERIC_ID_REGEX, '/:id')
    .split('?')[0];
}

@Injectable()
export class EnhancedMetricsService {
  private readonly logger = new Logger(EnhancedMetricsService.name);
  private readonly register: Registry;

  // HTTP metrics (existing)
  private readonly httpRequestsTotal: Counter;
  private readonly httpRequestDurationSeconds: Histogram;
  private readonly httpRequestInFlight: Gauge;
  private readonly httpResponseStatusCodesTotal: Counter;

  // Business metrics
  private readonly userRegistrationsTotal: Counter;
  private readonly consultationsBookedTotal: Counter;
  private readonly paymentsProcessedTotal: Counter;
  private readonly messagesSentTotal: Counter;

  // Performance metrics
  private readonly databaseQueryDurationSeconds: Histogram;
  private readonly cacheHitRatio: Gauge;
  private readonly serviceDurationSeconds: Histogram;

  // Cultural metrics
  private readonly culturalContentViews: Counter;
  private readonly yorubaLanguageUsage: Counter;

  constructor() {
    this.register = new Registry();

    // HTTP metrics (existing)
    this.httpRequestsTotal = new Counter({
      name: 'ile_ase_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'user_role'],
      registers: [this.register],
    });

    this.httpRequestDurationSeconds = new Histogram({
      name: 'ile_ase_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code', 'user_role'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.register],
    });

    this.httpRequestInFlight = new Gauge({
      name: 'ile_ase_http_requests_in_flight',
      help: 'Current number of HTTP requests in flight',
      labelNames: ['method', 'route'],
      registers: [this.register],
    });

    this.httpResponseStatusCodesTotal = new Counter({
      name: 'ile_ase_http_response_status_codes_total',
      help: 'Total number of HTTP responses by status code',
      labelNames: ['status_code'],
      registers: [this.register],
    });

    this.serviceDurationSeconds = new Histogram({
      name: 'ile_ase_service_duration_seconds',
      help: 'Duration of service operations in seconds',
      labelNames: ['service', 'operation'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.register],
    });

    // Business metrics
    this.userRegistrationsTotal = new Counter({
      name: 'ile_ase_user_registrations_total',
      help: 'Total number of user registrations',
      labelNames: ['role'],
      registers: [this.register],
    });

    this.consultationsBookedTotal = new Counter({
      name: 'ile_ase_consultations_booked_total',
      help: 'Total number of consultations booked',
      labelNames: ['type', 'duration'],
      registers: [this.register],
    });

    this.paymentsProcessedTotal = new Counter({
      name: 'ile_ase_payments_processed_total',
      help: 'Total number of payments processed',
      labelNames: ['status', 'method'],
      registers: [this.register],
    });

    this.messagesSentTotal = new Counter({
      name: 'ile_ase_messages_sent_total',
      help: 'Total number of messages sent',
      labelNames: ['type', 'encryption_enabled'],
      registers: [this.register],
    });

    // Performance metrics
    this.databaseQueryDurationSeconds = new Histogram({
      name: 'ile_ase_database_query_duration_seconds',
      help: 'Database query duration in seconds',
      labelNames: ['operation', 'entity'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.register],
    });

    this.cacheHitRatio = new Gauge({
      name: 'ile_ase_cache_hit_ratio',
      help: 'Cache hit ratio gauge',
      labelNames: ['cache_type'],
      registers: [this.register],
    });

    // Cultural metrics
    this.culturalContentViews = new Counter({
      name: 'ile_ase_cultural_content_views_total',
      help: 'Total views of cultural content',
      labelNames: ['content_type', 'language'],
      registers: [this.register],
    });

    this.yorubaLanguageUsage = new Counter({
      name: 'ile_ase_yoruba_language_usage_total',
      help: 'Usage of Yoruba language features',
      labelNames: ['feature', 'diacritics_used'],
      registers: [this.register],
    });

    // Collect default Node.js metrics
    collectDefaultMetrics({
      register: this.register,
      prefix: 'ile_ase_nodejs_',
    });

    this.logger.log('Enhanced metrics service initialized');
  }

  // HTTP metrics
  recordHttpRequest(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    userRole?: string
  ): void {
    try {
      const route = normalizePathWithAdditionalMetrics(path);
      const status = String(statusCode);
      const role = userRole || 'anonymous';

      // Record metrics
      this.httpRequestsTotal.inc({ method, route, status_code: status, user_role: role });
      this.httpRequestDurationSeconds.observe(
        { method, route, status_code: status, user_role: role },
        durationMs / 1000
      );
      this.httpResponseStatusCodesTotal.inc({ status_code: status });

      this.logger.debug(`Recorded HTTP request: ${method} ${path} -> ${status} (${durationMs}ms)`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to record HTTP request metrics: ${err.message}`, err.stack);
    }
  }

  /**
   * Start tracking an in-flight request
   */
  recordRequestStart(method: string, path: string): void {
    try {
      const route = normalizePathWithAdditionalMetrics(path);
      this.httpRequestInFlight.inc({ method, route });
      this.logger.debug(`Started request: ${method} ${path}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to record request start: ${err.message}`, err.stack);
    }
  }

  /**
   * End tracking an in-flight request
   */
  recordRequestEnd(method: string, path: string): void {
    try {
      const route = normalizePathWithAdditionalMetrics(path);
      this.httpRequestInFlight.dec({ method, route });
      this.logger.debug(`Finished request: ${method} ${path}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to record request end: ${err.message}`, err.stack);
    }
  }

  /**
   * Record duration of a service operation
   */
  recordServiceDuration(service: string, operation: string, durationMs: number): void {
    try {
      this.serviceDurationSeconds.observe({ service, operation }, durationMs / 1000);
      this.logger.debug(`Recorded service duration: ${service}.${operation} (${durationMs}ms)`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to record service duration: ${err.message}`, err.stack);
    }
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clearMetrics(): void {
    try {
      this.register.resetMetrics();
      this.logger.log('All metrics have been reset');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to clear metrics: ${err.message}`, err.stack);
    }
  }

  // Business metrics
  recordUserRegistration(role: string): void {
    this.userRegistrationsTotal.inc({ role });
  }

  recordConsultationBooking(type: string, duration: string): void {
    this.consultationsBookedTotal.inc({ type, duration });
  }

  recordPaymentProcessed(status: string, method: string): void {
    this.paymentsProcessedTotal.inc({ status, method });
  }

  recordMessageSent(type: string, encryptionEnabled: boolean): void {
    this.messagesSentTotal.inc({ type, encryption_enabled: String(encryptionEnabled) });
  }

  // Performance metrics
  recordDatabaseQuery(operation: string, entity: string, durationMs: number): void {
    this.databaseQueryDurationSeconds.observe({ operation, entity }, durationMs / 1000);
  }

  updateCacheHitRatio(cacheType: string, ratio: number): void {
    this.cacheHitRatio.set({ cache_type: cacheType }, ratio);
  }

  // Cultural metrics
  recordCulturalContentView(contentType: string, language: string): void {
    this.culturalContentViews.inc({ content_type: contentType, language });
  }

  recordYorubaLanguageUsage(feature: string, diacriticsUsed: boolean): void {
    this.yorubaLanguageUsage.inc({ feature, diacritics_used: String(diacriticsUsed) });
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  getContentType(): string {
    return this.register.contentType;
  }
}
