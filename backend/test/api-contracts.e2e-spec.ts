/**
 * HC-201.5: API Contract Tests
 * Verifies request/response shapes and status codes for key endpoints.
 *
 * Run: npm run test:e2e
 * Requires: Postgres at DATABASE_URL (e.g. localhost:5432), JWT_SECRET in .env.
 * E2E setup mocks Sentry and sets ENCRYPTION_KEY for test.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { z } from 'zod';
import { AppModule } from '../src/app.module';

// ---- Response schemas (contracts) ----
const HealthResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
});

const ServiceHealthSchema = z.object({
  status: z.enum(['up', 'down', 'degraded', 'disabled']),
  latencyMs: z.number().optional(),
  message: z.string().optional(),
});

const DetailedHealthResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string(),
  services: z.record(z.string(), ServiceHealthSchema),
});

/** PB-202.5: Standard error response shape */
const StandardErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.union([z.string(), z.array(z.string())]),
    userMessage: z.string(),
    statusCode: z.number(),
    timestamp: z.string(),
    requestId: z.string().optional(),
    details: z.record(z.unknown()).optional(),
  }),
});

const EventItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).passthrough();

const DemoHealthResponseSchema = z.object({
  status: z.literal('ok'),
  message: z.string(),
  timestamp: z.string(),
});

function expectMatchesSchema<T>(data: unknown, schema: z.ZodType<T>): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Contract violation: ${JSON.stringify(result.error.flatten())}`);
  }
  return result.data;
}

describe('API Contracts (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('GET /api/health', () => {
    it('returns 200 and { status: "healthy" | "degraded" | "unhealthy" }', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect((res: { status: number }) => {
          if (res.status !== 200 && res.status !== 503) {
            throw new Error(`Expected 200 or 503, got ${res.status}`);
          }
        });

      if (response.status === 200) {
        expectMatchesSchema(response.body, HealthResponseSchema);
        expect(['healthy', 'degraded']).toContain(response.body.status);
      }
      if (response.status === 503) {
        expect(response.body.status).toBe('unhealthy');
      }
    });
  });

  describe('GET /api/health/detailed', () => {
    it('returns 200 and DetailedHealthResult shape', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health/detailed')
        .expect(200);

      expectMatchesSchema(response.body, DetailedHealthResponseSchema);
      expect(typeof response.body.timestamp).toBe('string');
      expect(response.body.services).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.status);
    });
  });

  describe('GET /api/demo/health', () => {
    it('returns 200 and demo health shape', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/demo/health')
        .expect(200);

      expectMatchesSchema(response.body, DemoHealthResponseSchema);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('GET /api/events', () => {
    it('returns 200 and array of event-shaped objects', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/events')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      for (const item of response.body.slice(0, 3)) {
        expectMatchesSchema(item, EventItemSchema);
      }
    });

    it('accepts query params without breaking contract', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/events?published=true&upcoming=true')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    it('with invalid body returns 400 or 401 and standard error shape', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({})
        .expect((res: { status: number }) => {
          if (res.status !== 400 && res.status !== 401) {
            throw new Error(`Expected 400 or 401, got ${res.status}`);
          }
        });

      expectMatchesSchema(response.body, StandardErrorResponseSchema);
      expect(response.body.error.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('with wrong credentials returns 401 and error shape', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ email: 'nonexistent@test.com', password: 'wrong' })
        .expect(401);

      expectMatchesSchema(response.body, StandardErrorResponseSchema);
      expect(response.body.error.statusCode).toBe(401);
    });
  });

  describe('Protected routes return 401 without token', () => {
    it('GET /api/appointments/client/:id returns 401', async () => {
      await request(app.getHttpServer())
        .get('/api/appointments/client/test-client-id')
        .expect(401);
    });

    it('POST /api/appointments returns 401', async () => {
      await request(app.getHttpServer())
        .post('/api/appointments')
        .set('Content-Type', 'application/json')
        .send({
          babalawoId: 'b1',
          date: '2025-12-20',
          time: '14:00',
          topic: 'Test',
          preferredMethod: 'VIDEO',
          duration: 60,
          price: 5000,
          paymentMethod: 'WALLET',
        })
        .expect(401);
    });
  });

  describe('Validation error response shape', () => {
    it('POST /api/auth/register with invalid DTO returns 400 with message', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send({ email: 'not-an-email', password: 'short' })
        .expect(400);

      expectMatchesSchema(response.body, StandardErrorResponseSchema);
      expect(response.body.error.statusCode).toBe(400);
    });
  });

  describe('GET /api/metrics (PB-202.4)', () => {
    it('returns 200 and Prometheus text with http_requests_total', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/metrics')
        .expect(200);

      expect(response.text).toContain('http_requests_total');
      expect(response.text).toContain('http_request_duration_seconds');
    });
  });

  describe('Protected routes return standard error shape', () => {
    it('GET /api/temples returns 401 without token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/temples')
        .expect(401);

      expectMatchesSchema(response.body, StandardErrorResponseSchema);
      expect(response.body.error.statusCode).toBe(401);
      expect(response.body.error.code).toBeDefined();
    });

    it('GET /api/wallet/:userId/balance returns 401 without token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/wallet/user-123/balance')
        .expect(401);

      expectMatchesSchema(response.body, StandardErrorResponseSchema);
    });
  });
});
