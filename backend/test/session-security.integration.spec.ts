/**
 * Session security (November 26, 2026), against a real Postgres and Redis through the HTTP API:
 *  1. revocation fails CLOSED when Redis cannot answer (503, never "token accepted" or "logged out");
 *  2. logout reports failure when it could not revoke;
 *  3. refresh rotation is atomic (concurrent refreshes of one token mint one session);
 *  4. refresh distinguishes a dead session (401) from an outage (503);
 *
 * Run: npm run test:integration -- session-security
 * Requires: Postgres at DATABASE_URL, Redis at REDIS_URL, JWT secrets. Set THROTTLE_AUTH_LIMIT high for the run.
 * Accounts use the reserved `.test` domain, so no email is sent.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisCacheService } from '../src/cache/redis-cache.service';

describe('Session security (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cache: RedisCacheService;
  const run = Date.now();
  const PASSWORD = 'SessionTest123!x';

  const register = async (tag: string) => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: `sess-${tag}-${run}@verify.test`, name: 'Ọmọ Ìdánwò', password: PASSWORD, role: 'CLIENT' })
      .expect(201);
    return { id: res.body.user.id as string, accessToken: res.body.accessToken as string, refreshToken: res.body.refreshToken as string };
  };
  const me = (accessToken: string) => request(app.getHttpServer()).get('/subscriptions/me').set('Authorization', `Bearer ${accessToken}`);
  const refresh = (refreshToken: string) => request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken });

  /** Simulates a Redis outage on the app's own client, then restores it. */
  const withRedisDown = async (fn: () => Promise<void>) => {
    const client = (cache as any).client;
    await client.disconnect();
    try {
      await fn();
    } finally {
      await client.connect();
      (cache as any).isConnected = true;
    }
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    cache = app.get(RedisCacheService);
    expect(cache.isAvailable()).toBe(true);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: `-${run}@verify.test` } } });
    await app.close();
  });

  it('concurrent refreshes of one token mint ONE new session, shared by all of them', async () => {
    const s = await register('concurrent');
    const replies = await Promise.all([1, 2, 3, 4, 5].map(() => refresh(s.refreshToken)));

    replies.forEach((r) => expect(r.status).toBe(200));
    const pairs = new Set(replies.map((r) => `${r.body.accessToken}|${r.body.refreshToken}`));
    expect(pairs.size).toBe(1);

    const { accessToken } = replies[0].body;
    await me(accessToken).expect(200);
    await me(s.accessToken).expect(401); // the spent pair's access token is revoked with it
  });

  it('a rotated refresh token is refused once the grace window has passed', async () => {
    const s = await register('replay');
    await refresh(s.refreshToken).expect(200);
    await new Promise((r) => setTimeout(r, 11_000));
    await refresh(s.refreshToken).expect(401);
  }, 30_000);

  it('logout revokes at once: no grace for a logged-out refresh token', async () => {
    const s = await register('logout');
    await request(app.getHttpServer()).post('/auth/logout').set('Authorization', `Bearer ${s.accessToken}`).send({ refreshToken: s.refreshToken }).expect(200);
    await me(s.accessToken).expect(401);
    await refresh(s.refreshToken).expect(401);
  });

  it('fails closed while Redis is unavailable: 503 for signed-in requests, logout and refresh; public routes still work', async () => {
    const s = await register('outage');
    await withRedisDown(async () => {
      const authed = await me(s.accessToken);
      expect(authed.status).toBe(503);

      const logout = await request(app.getHttpServer()).post('/auth/logout').set('Authorization', `Bearer ${s.accessToken}`).send({ refreshToken: s.refreshToken });
      expect(logout.status).toBe(503); // not "Logged out successfully" while nothing was revoked

      const r = await refresh(s.refreshToken);
      expect(r.status).toBe(503); // an outage, not "Invalid refresh token"

      await request(app.getHttpServer()).get('/support-resources').set('Authorization', `Bearer ${s.accessToken}`).expect(200);
    });
    // Back to normal once Redis is: the session was never revoked and still works.
    await me(s.accessToken).expect(200);
    await refresh(s.refreshToken).expect(200);
  });
});
