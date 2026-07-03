/**
 * PB-202.4: MetricsService unit tests.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService, normalizePath } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();
    service = module.get(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('recordRequest does not throw', () => {
    expect(() => {
      service.recordRequest('GET', '/api/health', 200, 12);
      service.recordRequest('POST', '/api/auth/login', 401, 50);
    }).not.toThrow();
  });

  it('getMetrics returns Prometheus text with expected metric names', async () => {
    service.recordRequest('GET', '/api/health', 200, 5);
    const out = await service.getMetrics();
    expect(out).toContain('http_requests_total');
    expect(out).toContain('http_request_duration_seconds');
    expect(out).toContain('method="GET"');
    expect(out).toContain('route="/api/health"');
    expect(out).toContain('status_code="200"');
  });

  it('getContentType returns Prometheus content type', () => {
    expect(service.getContentType()).toContain('text/plain');
  });
});

describe('normalizePath', () => {
  it('replaces UUID with :id', () => {
    expect(normalizePath('/api/appointments/550e8400-e29b-41d4-a716-446655440000')).toBe(
      '/api/appointments/:id',
    );
  });

  it('replaces numeric id with :id', () => {
    expect(normalizePath('/api/users/12345')).toBe('/api/users/:id');
  });

  it('strips query string', () => {
    expect(normalizePath('/api/events?published=true')).toBe('/api/events');
  });

  it('returns path as-is when no ids', () => {
    expect(normalizePath('/api/health')).toBe('/api/health');
  });
});
