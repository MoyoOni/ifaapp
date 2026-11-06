/**
 * Bans, suspensions, admin force-logout and erasure have to actually end
 * access. Until November 6, 2026 none of them did: a banned or suspended
 * member carried on as normal, "force logout" only marked history rows, and
 * an erased account could sign back in with Google.
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

describe('Account moderation ends access', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];
  const password = 'SecurePassword123!';
  let moderator: string;

  const http = () => request(app.getHttpServer());
  const as = (t: string) => ({ Authorization: `Bearer ${t}` });
  // JWT iat is in whole seconds; a cut-off only ends tokens from earlier seconds.
  const nextSecond = () => new Promise((r) => setTimeout(r, 1100));

  async function newMember() {
    const email = `modtest-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
    const res = await http()
      .post('/auth/register')
      .send({ email, password, name: 'Moderation Test', role: UserRole.CLIENT })
      .expect(201);
    userIds.push(res.body.user.id);
    return {
      id: res.body.user.id as string,
      email,
      token: res.body.accessToken as string,
      refresh: res.body.refreshToken as string,
    };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true })
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    const m = await newMember();
    await prisma.user.update({
      where: { id: m.id },
      data: { role: 'ADMIN', adminSubRole: 'MODERATOR' },
    });
    moderator = (await http().post('/auth/login').send({ email: m.email, password }).expect(200))
      .body.accessToken;
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.auditLog.deleteMany({ where: { resourceId: { in: userIds } } });
    await prisma.userSession.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('a ban ends the current session and refuses sign-in until it is lifted', async () => {
    const member = await newMember();
    await http().get('/subscriptions/me').set(as(member.token)).expect(200);

    await http()
      .post(`/admin/users/${member.id}/ban`)
      .set(as(moderator))
      .send({ reason: 'Repeated harassment' })
      .expect(201);
    await http().get('/subscriptions/me').set(as(member.token)).expect(401);
    await http().post('/auth/refresh').send({ refreshToken: member.refresh }).expect(401);
    const login = await http()
      .post('/auth/login')
      .send({ email: member.email, password })
      .expect(403);
    expect(JSON.stringify(login.body)).toMatch(/banned/);

    await http()
      .post(`/admin/users/${member.id}/unban`)
      .set(as(moderator))
      .send({ reason: 'Appeal upheld' })
      .expect(201);
    await http().post('/auth/login').send({ email: member.email, password }).expect(200);
  });

  it('a suspension refuses sign-in and says until when', async () => {
    const member = await newMember();
    await http()
      .post(`/admin/users/${member.id}/suspend`)
      .set(as(moderator))
      .send({ reason: 'Cooling off', durationDays: 2 })
      .expect(201);
    await http().get('/subscriptions/me').set(as(member.token)).expect(401);
    const login = await http()
      .post('/auth/login')
      .send({ email: member.email, password })
      .expect(403);
    expect(JSON.stringify(login.body)).toMatch(/suspended until/);
  });

  it('force logout ends existing tokens; signing in again works', async () => {
    const member = await newMember();
    await nextSecond();
    await http()
      .delete(`/admin/security/users/${member.id}/sessions`)
      .set(as(moderator))
      .expect(200);
    await http().get('/subscriptions/me').set(as(member.token)).expect(401);
    await http().post('/auth/refresh').send({ refreshToken: member.refresh }).expect(401);

    await nextSecond();
    const again = await http()
      .post('/auth/login')
      .send({ email: member.email, password })
      .expect(200);
    await http().get('/subscriptions/me').set(as(again.body.accessToken)).expect(200);
  });

  it('an erased account loses its session, sign-in, Google link and share link', async () => {
    const member = await newMember();
    await prisma.user.update({
      where: { id: member.id },
      data: { googleId: `g-${member.id}`, slug: `modtest-${member.id}` },
    });
    await nextSecond();
    await http()
      .delete('/gdpr/delete-account')
      .set(as(member.token))
      .expect((r) => expect(r.status).toBeLessThan(300));

    await http().get('/subscriptions/me').set(as(member.token)).expect(401);
    await http().post('/auth/login').send({ email: member.email, password }).expect(401);
    const row = await prisma.user.findUniqueOrThrow({ where: { id: member.id } });
    expect(row).toMatchObject({ googleId: null, slug: null, passwordHash: '' });
    expect(row.email).toMatch(/@deleted\.iluase\.invalid$/);
  });
});
