/**
 * docs/safeguarding SAFE-02 (case register), SAFE-05 (narrower restrictions)
 * and SAFE-12 (practitioner standards), through the real HTTP stack.
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

describe('Safeguarding cases, restrictions and standards', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];
  let lead: string;
  let member: { id: string; token: string };
  let subject: { id: string; token: string };
  let babalawo: { id: string; token: string };
  let categoryId: string;

  const http = () => request(app.getHttpServer());
  const as = (t: string) => ({ Authorization: `Bearer ${t}` });

  async function newUser(role: UserRole, adminSubRole?: string) {
    const email = `sgcase-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
    const res = await http().post('/auth/register').send({ email, password: 'SecurePassword123!', name: 'Case Test', role }).expect(201);
    userIds.push(res.body.user.id);
    await prisma.user.update({ where: { id: res.body.user.id }, data: { hasOnboarded: true, passedCulturalOrientation: true, ...(adminSubRole ? { role: 'ADMIN', adminSubRole } : {}) } });
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
    lead = (await newUser(UserRole.CLIENT, 'SAFEGUARDING')).token;
    member = await newUser(UserRole.CLIENT);
    subject = await newUser(UserRole.CLIENT);
    babalawo = await newUser(UserRole.BABALAWO);
    // Its own category: CI starts from an empty, unseeded database.
    categoryId = (await prisma.forumCategory.create({ data: { name: 'Safeguarding test', slug: `sg-test-${Date.now()}` } })).id;
  });

  afterAll(async () => {
    const cases = await prisma.safeguardingCase.findMany({ where: { OR: [{ subjectId: { in: userIds } }, { reporterId: { in: userIds } }] }, select: { id: true } });
    await prisma.safeguardingCase.deleteMany({ where: { id: { in: cases.map((c) => c.id) } } });
    await prisma.accountRestriction.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.serviceOffering.deleteMany({ where: { babalawoId: babalawo.id } });
    await prisma.forumThread.deleteMany({ where: { authorId: { in: userIds } } });
    await prisma.forumCategory.deleteMany({ where: { id: categoryId } });
    await prisma.userReport.deleteMany({ where: { reporterId: { in: userIds } } });
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('opens a case for a safeguarding report, and closes it with the decision when the report is resolved', async () => {
    const report = await http()
      .post('/user-reports')
      .set(as(member.token))
      .send({ reportedUserId: subject.id, reason: 'SEXUAL_MISCONDUCT', description: 'Unwanted advances after a reading' })
      .expect(201);

    const list = await http().get('/safeguarding/cases').set(as(lead)).expect(200);
    const c = list.body.cases.find((x: { sourceId: string }) => x.sourceId === report.body.id);
    expect(c).toMatchObject({ source: 'USER_REPORT', priority: 1, status: 'OPEN', subject: { id: subject.id } });
    expect(c.ref).toMatch(/^SG-\d{4}$/);

    await http().post(`/safeguarding/cases/${c.id}/entries`).set(as(lead)).send({ kind: 'CONTACT', text: 'Called the reporter; they are safe.' }).expect(201);
    await http().post(`/admin/user-reports/${report.body.id}/resolve`).set(as(lead)).send({ action: 'SUSPEND', resolutionNotes: 'Upheld after review' }).expect(201);

    const after = await http().get(`/safeguarding/cases/${c.id}`).set(as(lead)).expect(200);
    expect(after.body.status).toBe('CLOSED');
    expect(after.body.entries.map((e: { kind: string }) => e.kind)).toEqual(['SYSTEM', 'CONTACT', 'DECISION']);
    await http().get('/safeguarding/cases').set(as(member.token)).expect(403);

    // The suspension really ends access (it didn't before November 6, 2026).
    await http().get('/users/me').set(as(subject.token)).expect(401);
    await prisma.user.update({ where: { id: subject.id }, data: { suspendedUntil: null } });
  });

  it('logs a case that arrived by email', async () => {
    const res = await http().post('/safeguarding/cases').set(as(lead)).send({ source: 'EMAIL', category: 'FINANCIAL_EXPLOITATION', summary: 'Emailed concern about repeated demands for money', priority: 2 }).expect(201);
    expect(res.body).toMatchObject({ source: 'EMAIL', priority: 2 });
    await prisma.safeguardingCase.delete({ where: { id: res.body.id } });
  });

  it('pauses posting without suspending the account', async () => {
    const r = await http().post('/safeguarding/restrictions').set(as(lead)).send({ userId: subject.id, type: 'PAUSE_POSTING', reason: 'While the report is investigated' }).expect(201);
    await http().post('/forum/threads').set(as(subject.token)).send({ categoryId, title: 'A thread while paused', content: 'Some content for the thread body' }).expect(403);
    await http().get('/users/me').set(as(subject.token)).expect((res) => expect(res.status).toBeLessThan(500)); // still signed in
    await http().post(`/safeguarding/restrictions/${r.body.id}/lift`).set(as(lead)).expect(201);
    await http().post('/forum/threads').set(as(subject.token)).send({ categoryId, title: 'A thread after lifting', content: 'Some content for the thread body' }).expect(201);
  });

  it('hides a profile, and keeps two people apart under no-contact', async () => {
    await http().post('/safeguarding/restrictions').set(as(lead)).send({ userId: subject.id, type: 'NO_CONTACT', protectedUserId: member.id, reason: 'Protecting the reporter' }).expect(201);
    const seen = await http().get(`/users/${subject.id}`).set(as(member.token)).expect(200);
    expect(seen.body).toMatchObject({ id: subject.id, isPrivate: true });
    const back = await http().get(`/users/${member.id}`).set(as(subject.token)).expect(200);
    expect(back.body.isPrivate).toBe(true);
    await http().post('/safeguarding/restrictions').set(as(lead)).send({ userId: subject.id, type: 'NO_CONTACT', reason: 'missing who it protects' }).expect(403);
  });

  it('needs a practitioner to accept the current standards before offering a service', async () => {
    const offering = { name: 'Reading', description: 'A thirty-minute reading', category: 'Guidance', durationMinutes: 30, priceAmount: 10000 };
    await http().post(`/babalawo/${babalawo.id}/service-offerings`).set(as(babalawo.token)).send(offering).expect(403);

    const standards = await http().get('/safeguarding/standards').expect(200);
    expect((await http().get('/safeguarding/standards/me').set(as(babalawo.token)).expect(200)).body).toMatchObject({ required: true, accepted: false });
    await http().post('/safeguarding/standards/accept').set(as(babalawo.token)).send({ version: 'an-old-version' }).expect(403);
    await http().post('/safeguarding/standards/accept').set(as(babalawo.token)).send({ version: standards.body.version }).expect(201);

    await http().post(`/babalawo/${babalawo.id}/service-offerings`).set(as(babalawo.token)).send(offering).expect(201);
  });
});
