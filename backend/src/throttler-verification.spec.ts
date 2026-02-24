/**
 * PB-204.3: Verify rate limiting (ThrottlerGuard) returns 429 when limit exceeded.
 * Uses a minimal Nest app with ThrottlerModule (3 req/min) and asserts the 4th request gets 429.
 */
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { Controller, Get } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');

@Controller()
class PingController {
  @Get('ping')
  ping() {
    return { ok: true };
  }
}

describe('Rate limiting (PB-204.3)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          { ttl: 60000, limit: 3 },
        ]),
      ],
      controllers: [PingController],
      providers: [
        { provide: APP_GUARD, useClass: ThrottlerGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 429 after exceeding limit (3 requests allowed, 4th throttled)', async () => {
    const server = app.getHttpServer();

    await request(server).get('/ping').expect(200);
    await request(server).get('/ping').expect(200);
    await request(server).get('/ping').expect(200);
    await request(server).get('/ping').expect(429);
  });
});
