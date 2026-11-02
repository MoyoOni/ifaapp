/**
 * Notification preferences and marketing consent (November 2, 2026).
 * GET/PATCH /notifications/preferences was never registered (404 on
 * production), its body was an unvalidated interface (a `userId` in it
 * wrote another member's row), and email campaigns ignored the marketing
 * opt-in entirely.
 *
 * Run: npm run test:integration
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import { SesEmailService } from '../src/shared/services/ses-email.service';
import { AdminCampaignsService } from '../src/admin/admin-campaigns.service';
import { UserRole } from '@ile-ase/common';

describe('Notification preferences', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];
  const sent: Array<{ to: string; html: string }> = [];
  let a: { id: string; token: string; email: string };
  let b: { id: string; token: string; email: string };

  const http = () => request(app.getHttpServer());
  const as = (u: { token: string }) => ({ Authorization: `Bearer ${u.token}` });

  async function newUser() {
    const email = `prefs-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
    const res = await http().post('/auth/register').send({ email, password: 'SecurePassword123!', name: 'Prefs Test', role: UserRole.CLIENT }).expect(201);
    userIds.push(res.body.user.id);
    return { id: res.body.user.id as string, token: res.body.accessToken as string, email };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SesEmailService)
      .useValue({ sendEmail: async (to: string, _subject: string, html: string) => void sent.push({ to, html }) })
      .compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    a = await newUser();
    b = await newUser();
  });

  afterAll(async () => {
    await prisma.notificationPreferences.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.emailCampaign.deleteMany({ where: { subject: 'Prefs test campaign' } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('saves a member\'s own preferences, and a userId in the body cannot touch anyone else', async () => {
    const res = await http().patch('/notifications/preferences').set(as(a)).send({ emailMarketing: true, pushForum: true, userId: b.id }).expect(200);
    expect(res.body).toMatchObject({ userId: a.id, emailMarketing: true, pushForum: true });
    expect(await prisma.notificationPreferences.findUnique({ where: { userId: b.id } })).toBeNull();
    expect((await http().get('/notifications/preferences').set(as(a)).expect(200)).body.emailMarketing).toBe(true);
    await http().patch('/notifications/preferences').set(as(a)).send({ emailMarketing: 'yes' }).expect(400);
  });

  it('starts everyone opted out of marketing, even once their preferences exist', async () => {
    const fresh = await http().get('/notifications/preferences').set(as(b)).expect(200);
    expect(fresh.body.emailMarketing).toBe(false);
    await prisma.notificationPreferences.delete({ where: { userId: b.id } });
  });

  it('reports whether WhatsApp is set up', async () => {
    const res = await http().get('/notifications/preferences/channels').set(as(a)).expect(200);
    expect(typeof res.body.whatsapp).toBe('boolean');
  });

  it('sends campaigns only to members who opted in, with a way to stop', async () => {
    const campaign = await prisma.emailCampaign.create({ data: { subject: 'Prefs test campaign', body: '<p>Àṣẹ {{name}}</p>', segment: 'ALL', createdBy: a.id } });
    sent.length = 0;
    await app.get(AdminCampaignsService).sendCampaign(campaign.id);
    const recipients = sent.map((s) => s.to);
    expect(recipients).toContain(a.email); // opted in above
    expect(recipients).not.toContain(b.email); // never opted in
    expect(sent.find((s) => s.to === a.email)?.html).toContain('Settings → Notifications');
  });
});
