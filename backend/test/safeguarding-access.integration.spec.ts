/**
 * Safeguarding access (docs/safeguarding SAFE-01/SAFE-03, November 3, 2026),
 * through the real HTTP stack and guards: only Safeguarding and Super admins
 * read safeguarding reports, crisis flags and practitioner concerns;
 * moderators keep spam/impersonation reports.
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

describe('Safeguarding access', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];
  let member: { id: string; token: string };
  let other: { id: string; token: string };
  let moderator: string;
  let safeguarding: string;

  const http = () => request(app.getHttpServer());
  const as = (t: string) => ({ Authorization: `Bearer ${t}` });

  async function newUser(adminSubRole?: string) {
    const email = `safeacc-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
    const res = await http().post('/auth/register').send({ email, password: 'SecurePassword123!', name: 'Safeguarding Test', role: UserRole.CLIENT }).expect(201);
    userIds.push(res.body.user.id);
    if (!adminSubRole) return { id: res.body.user.id as string, token: res.body.accessToken as string };
    await prisma.user.update({ where: { id: res.body.user.id }, data: { role: 'ADMIN', adminSubRole } });
    const login = await http().post('/auth/login').send({ email, password: 'SecurePassword123!' }).expect(200);
    return { id: res.body.user.id as string, token: login.body.accessToken as string };
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
    moderator = (await newUser('MODERATOR')).token;
    safeguarding = (await newUser('SAFEGUARDING')).token;
  });

  afterAll(async () => {
    await prisma.userReport.deleteMany({ where: { reporterId: { in: userIds } } });
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('lets a member report anyone for sexual misconduct, marked urgent', async () => {
    const res = await http()
      .post('/user-reports')
      .set(as(member.token))
      .send({ reportedUserId: other.id, reason: 'SEXUAL_MISCONDUCT', description: 'Unwanted advances after a reading' })
      .expect(201);
    expect(res.body).toMatchObject({ reason: 'SEXUAL_MISCONDUCT', urgent: true });
    await http().post('/user-reports').set(as(member.token)).send({ reportedUserId: other.id, reason: 'SPAM', description: 'Posting adverts everywhere' }).expect(201);
  });

  it('shows the safeguarding report to Safeguarding only, and the spam report to the moderator only', async () => {
    const mine = (r: { reporter: { id: string } }) => r.reporter.id === member.id;
    const forSafeguarding = (await http().get('/admin/user-reports').set(as(safeguarding)).expect(200)).body.filter(mine);
    const forModerator = (await http().get('/admin/user-reports').set(as(moderator)).expect(200)).body.filter(mine);
    expect(forSafeguarding.map((r: { reason: string }) => r.reason)).toEqual(['SEXUAL_MISCONDUCT']);
    expect(forModerator.map((r: { reason: string }) => r.reason)).toEqual(['SPAM']);

    // ... and a moderator cannot act on it by id either.
    const report = forSafeguarding[0];
    await http().post(`/admin/user-reports/${report.id}/resolve`).set(as(moderator)).send({ action: 'DISMISS', resolutionNotes: 'not mine to see' }).expect(404);
  });

  it('keeps the crisis queue and practitioner concerns from moderators', async () => {
    await http().get('/forum/admin/crisis-signals').set(as(moderator)).expect(403);
    await http().get('/admin/complaints').set(as(moderator)).expect(403);
    await http().get('/forum/admin/crisis-signals').set(as(safeguarding)).expect(200);
    await http().get('/admin/complaints').set(as(safeguarding)).expect(200);
  });
});
