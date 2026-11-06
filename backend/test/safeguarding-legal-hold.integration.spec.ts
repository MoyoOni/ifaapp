/**
 * docs/safeguarding SAFE-06 legal hold: while a safeguarding case is open,
 * neither the person reported nor the reporter can have their data erased
 * (by themselves or by an admin). The member is never told a case exists.
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

describe('Safeguarding legal hold', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];
  let lead: string;
  let reporter: { id: string; token: string };
  let subject: { id: string; token: string };

  const http = () => request(app.getHttpServer());
  const as = (t: string) => ({ Authorization: `Bearer ${t}` });

  async function newUser(adminSubRole?: string) {
    const email = `hold-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
    const res = await http().post('/auth/register').send({ email, password: 'SecurePassword123!', name: 'Hold Test', role: UserRole.CLIENT }).expect(201);
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
    lead = (await newUser('SUPER')).token;
    reporter = await newUser();
    subject = await newUser();
  });

  afterAll(async () => {
    const cases = await prisma.safeguardingCase.findMany({ where: { OR: [{ subjectId: { in: userIds } }, { reporterId: { in: userIds } }] }, select: { id: true } });
    await prisma.safeguardingCase.deleteMany({ where: { id: { in: cases.map((c) => c.id) } } });
    await prisma.userReport.deleteMany({ where: { reporterId: { in: userIds } } });
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.auditLog.deleteMany({ where: { resourceId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('holds erasure for both people on an open case, and lifts the hold when the case closes', async () => {
    const report = await http()
      .post('/user-reports')
      .set(as(reporter.token))
      .send({ reportedUserId: subject.id, reason: 'FINANCIAL_EXPLOITATION', description: 'Kept demanding more money for rituals' })
      .expect(201);
    const caseRow = await prisma.safeguardingCase.findFirstOrThrow({ where: { sourceId: report.body.id } });

    // The person reported tries to erase themselves: refused, with no hint of a case.
    const self = await http().delete('/gdpr/delete-account').set(as(subject.token)).expect(409);
    expect(JSON.stringify(self.body)).not.toMatch(/safeguard|case|SG-/i);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: subject.id } })).name).not.toBe('[Deleted User]');

    // An admin sees which case is holding it.
    const byAdmin = await http().delete(`/admin/compliance/users/${reporter.id}/erase`).set(as(lead)).expect(409);
    expect(byAdmin.body.error.message).toContain(caseRow.ref);

    const logged = await prisma.safeguardingCaseEntry.count({ where: { caseId: caseRow.id, kind: 'MEASURE', text: { contains: 'legal hold' } } });
    expect(logged).toBe(2);

    // Case closed: erasure goes ahead.
    await http().patch(`/safeguarding/cases/${caseRow.id}`).set(as(lead)).send({ status: 'CLOSED' }).expect(200);
    await http().delete('/gdpr/delete-account').set(as(subject.token)).expect((r) => expect(r.status).toBeLessThan(300));
    expect((await prisma.user.findUniqueOrThrow({ where: { id: subject.id } })).name).toBe('[Deleted User]');
  });
});
