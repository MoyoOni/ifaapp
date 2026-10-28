/**
 * Advisory Board vote listing, through the real HTTP stack and database.
 *
 * The voting view asks for several statuses at once (?status=ACTIVE,PENDING);
 * the backend passed that whole string to Prisma as a single VoteStatus enum
 * value, which it rejected -- a 400 on every visit, and the Advisory Board
 * page sat on its loading state forever.
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

describe('Advisory vote listing (GET /admin/advisory-board/votes)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminId: string;
  let token: string;
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: `advisory-${Date.now()}@example.com`, password: 'SecurePassword123!', name: 'Advisory Test', role: UserRole.CLIENT })
      .expect(201);
    adminId = res.body.user.id;
    token = res.body.accessToken;
    // JwtStrategy reads the role from the database on every request
    await prisma.user.update({ where: { id: adminId }, data: { role: 'ADMIN', adminSubRole: 'SUPER' } });

    const base = { proposerId: adminId, description: 'Test', deadline: new Date(Date.now() + 86_400_000), requiredMajority: 'SIMPLE' as const };
    for (const status of ['ACTIVE', 'PENDING', 'CLOSED', 'APPROVED'] as const) {
      ids[status] = (await prisma.advisoryVote.create({ data: { ...base, title: `Test ${status}`, status } })).id;
    }
  });

  afterAll(async () => {
    // proposer has no cascade, so the votes go first
    await prisma.advisoryVote.deleteMany({ where: { proposerId: adminId } });
    await prisma.user.deleteMany({ where: { id: adminId } });
    await app.close();
  });

  const list = (status: string) =>
    request(app.getHttpServer())
      .get('/admin/advisory-board/votes')
      .query({ status })
      .set('Authorization', `Bearer ${token}`);

  it('accepts the comma-separated statuses the voting view sends', async () => {
    const active = await list('ACTIVE,PENDING').expect(200);
    const mine = (active.body as { id: string }[]).map((v) => v.id).filter((id) => Object.values(ids).includes(id));
    expect(mine.sort()).toEqual([ids.ACTIVE, ids.PENDING].sort());

    const closed = await list('CLOSED,APPROVED,REJECTED').expect(200);
    const mineClosed = (closed.body as { id: string }[]).map((v) => v.id).filter((id) => Object.values(ids).includes(id));
    expect(mineClosed.sort()).toEqual([ids.CLOSED, ids.APPROVED].sort());
  });

  it('still accepts a single status', async () => {
    const res = await list('ACTIVE').expect(200);
    expect((res.body as { id: string }[]).some((v) => v.id === ids.ACTIVE)).toBe(true);
  });

  it('refuses an unknown status with a clear message', async () => {
    const res = await list('ACTIVE,NONSENSE').expect(400);
    expect(JSON.stringify(res.body)).toMatch(/Unknown vote status: NONSENSE/);
  });
});
