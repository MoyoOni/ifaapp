/**
 * The strict "auth" throttler must only limit auth routes.
 *
 * Every named throttler is evaluated on every route unless it opts out, and
 * counters are per endpoint per IP, so the auth limit (10/min in production)
 * used to cap EVERY endpoint -- GET /users/:id, analytics, onboarding. This
 * uses a deliberately tiny auth limit so the behaviour is visible in a few
 * requests, and a unique X-Forwarded-For per test so counters (which live in
 * Redis and are shared across suites) can't collide.
 *
 * Run: npm run test:integration
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

describe('Throttler scoping', () => {
  let app: INestApplication;
  const ORIGINAL_ENV = process.env;

  beforeAll(async () => {
    process.env = { ...ORIGINAL_ENV, THROTTLE_AUTH_LIMIT: '3', THROTTLE_DEFAULT_LIMIT: '1000', THROTTLE_API_LIMIT: '1000' };
    // required lazily so the module reads the env above
    const { AppModule } = await import('../src/app.module');
    const { GlobalExceptionFilter } = await import('../src/common/filters/global-exception.filter');

    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.getHttpAdapter().getInstance().set('trust proxy', true); // main.ts does this in production
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    process.env = ORIGINAL_ENV;
    await app.close();
  });

  const ip = () => `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

  it('does not apply the auth limit to a non-auth endpoint: many requests all succeed', async () => {
    const client = ip();
    for (let i = 0; i < 8; i++) {
      await request(app.getHttpServer()).get('/temples').set('X-Forwarded-For', client).expect(200);
    }
  });

  it('still applies the auth limit to auth endpoints: the 4th login attempt is rate limited', async () => {
    const client = ip();
    const login = () =>
      request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Forwarded-For', client)
        .send({ emailOrPhone: 'nobody@example.com', password: 'wrong-password' });

    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) statuses.push((await login()).status);

    expect(statuses.slice(0, 3)).not.toContain(429);
    expect(statuses.slice(3)).toEqual([429, 429]);
  });
});
