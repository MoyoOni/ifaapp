/**
 * Mistakes and refusals answer 4xx, not 500, through the real HTTP stack.
 *
 * An October 30, 2026 crawl found these routes throwing a plain `Error` for
 * an ordinary member's request (not an admin, unknown id, missing search
 * term), so the member saw "A server error occurred" and every one would be
 * reported to Sentry as a server bug.
 *
 * Run: npm run test:integration
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole } from '@ile-ase/common';

describe('Client error status codes', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];
  let member: { id: string; token: string };
  let other: { id: string; token: string };

  const http = () => request(app.getHttpServer());

  async function newUser() {
    const res = await http()
      .post('/auth/register')
      .send({ email: `status-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`, password: 'SecurePassword123!', name: 'Status Test', role: UserRole.CLIENT })
      .expect(201);
    userIds.push(res.body.user.id);
    return { id: res.body.user.id as string, token: res.body.accessToken as string };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    member = await newUser();
    other = await newUser();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  const cases: Array<[string, () => string, number]> = [
    ['a member asking for the admin unverified-payments list', () => '/payments/unverified', 403],
    ['a search with no search term', () => '/search', 400],
    ['profile completeness for an unknown user', () => '/profile-completeness/no-such-user', 404],
    ['next steps for an unknown user', () => '/profile-completeness/no-such-user/next-steps', 404],
    ["someone else's Yoruba word history", () => `/recommendations/daily-word/yoruba/history/${other.id}`, 403],
  ];

  it.each(cases)('%s', async (_label, url, expected) => {
    const res = await http().get(url()).set({ Authorization: `Bearer ${member.token}` });
    expect(res.status).toBe(expected);
  });

  it('still serves the member their own word history', async () => {
    await http()
      .get(`/recommendations/daily-word/yoruba/history/${member.id}`)
      .set({ Authorization: `Bearer ${member.token}` })
      .expect(200);
  });
});
