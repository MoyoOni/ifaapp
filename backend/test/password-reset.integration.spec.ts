/**
 * Forgot / reset / change password, through the real HTTP stack and database.
 *
 * None of this existed: the login page's "Forgot password?" button had no
 * handler and Settings' "Change Password" just opened the profile page, so a
 * member who forgot their password was locked out for good. Separately,
 * POST /auth/set-password (meant for Google-only accounts) would overwrite an
 * existing password with no check -- anyone holding a member's access token
 * could take the account over.
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
import { UserRole } from '@ile-ase/common';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('Password reset and change', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let sendEmail: jest.SpyInstance;
  const userIds: string[] = [];

  const http = () => request(app.getHttpServer());

  async function newUser(password = 'OriginalPass123!') {
    const email = `pw-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
    const res = await http()
      .post('/auth/register')
      .send({ email, password, name: 'Password Test', role: UserRole.CLIENT })
      .expect(201);
    userIds.push(res.body.user.id);
    return { id: res.body.user.id as string, email, token: res.body.accessToken as string, refreshToken: res.body.refreshToken as string };
  }

  const login = (email: string, password: string) => http().post('/auth/login').send({ email, password });

  /** The raw token from the most recent reset email sent to `email`. */
  const lastResetToken = (email: string): string => {
    const call = [...sendEmail.mock.calls].reverse().find(([to, subject]) => to === email && /reset your password/i.test(subject));
    if (!call) throw new Error(`no reset email sent to ${email}`);
    return /reset-password\?token=([a-f0-9]+)/.exec(call[2])![1];
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    sendEmail = jest.spyOn(app.get(SesEmailService), 'sendEmail').mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  describe('forgot password', () => {
    it('gives the same answer for an unknown email, and sends nothing', async () => {
      const known = await newUser();
      sendEmail.mockClear();

      const unknown = await http().post('/auth/forgot-password').send({ email: `nobody-${Date.now()}@example.com` }).expect(200);
      const existing = await http().post('/auth/forgot-password').send({ email: known.email }).expect(200);

      expect(unknown.body).toEqual(existing.body);
      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendEmail.mock.calls[0][0]).toBe(known.email);
    });

    it('stores only a hash of the emailed token', async () => {
      const u = await newUser();
      await http().post('/auth/forgot-password').send({ email: u.email }).expect(200);
      const raw = lastResetToken(u.email);

      const rows = await prisma.passwordResetToken.findMany({ where: { userId: u.id } });
      expect(rows).toHaveLength(1);
      expect(rows[0].tokenHash).not.toBe(raw);
      expect(rows[0].tokenHash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('reset password', () => {
    it('sets the new password, ends existing sessions, and works only once', async () => {
      const u = await newUser();
      await http().post('/auth/forgot-password').send({ email: u.email }).expect(200);
      const token = lastResetToken(u.email);
      await sleep(1100); // the old token must be issued in an earlier second than the reset

      await http().post('/auth/reset-password').send({ token, password: 'BrandNewPass456!' }).expect(200);

      expect((await login(u.email, 'BrandNewPass456!')).status).toBe(200);
      expect((await login(u.email, 'OriginalPass123!')).status).toBe(401);
      await http().get(`/users/${u.id}`).set('Authorization', `Bearer ${u.token}`).expect(401);
      await http().post('/auth/refresh').send({ refreshToken: u.refreshToken }).expect(401);
      await http().post('/auth/reset-password').send({ token, password: 'AnotherPass789!' }).expect(400);
    });

    it('refuses an expired link', async () => {
      const u = await newUser();
      await http().post('/auth/forgot-password').send({ email: u.email }).expect(200);
      const token = lastResetToken(u.email);
      await prisma.passwordResetToken.updateMany({ where: { userId: u.id }, data: { expiresAt: new Date(Date.now() - 1000) } });

      await http().post('/auth/reset-password').send({ token, password: 'BrandNewPass456!' }).expect(400);
      expect((await login(u.email, 'OriginalPass123!')).status).toBe(200);
    });

    it('a newer link supersedes an older one', async () => {
      const u = await newUser();
      await http().post('/auth/forgot-password').send({ email: u.email }).expect(200);
      const first = lastResetToken(u.email);
      await http().post('/auth/forgot-password').send({ email: u.email }).expect(200);
      const second = lastResetToken(u.email);

      await http().post('/auth/reset-password').send({ token: first, password: 'BrandNewPass456!' }).expect(400);
      await http().post('/auth/reset-password').send({ token: second, password: 'BrandNewPass456!' }).expect(200);
    });

    it('refuses a made-up token', async () => {
      await http().post('/auth/reset-password').send({ token: 'a'.repeat(64), password: 'BrandNewPass456!' }).expect(400);
    });
  });

  describe('change password', () => {
    it('requires the current password', async () => {
      const u = await newUser();
      await http()
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${u.token}`)
        .send({ currentPassword: 'WrongPass000!', newPassword: 'BrandNewPass456!' })
        .expect(400);
      expect((await login(u.email, 'OriginalPass123!')).status).toBe(200);
    });

    it('changes it, keeps this session via fresh tokens, and ends the others', async () => {
      const u = await newUser();
      const other = (await login(u.email, 'OriginalPass123!')).body.accessToken as string;
      await sleep(1100);

      const res = await http()
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${u.token}`)
        .send({ currentPassword: 'OriginalPass123!', newPassword: 'BrandNewPass456!' })
        .expect(200);

      await http().get(`/users/${u.id}`).set('Authorization', `Bearer ${res.body.accessToken}`).expect(200);
      await http().get(`/users/${u.id}`).set('Authorization', `Bearer ${other}`).expect(401);
      expect((await login(u.email, 'BrandNewPass456!')).status).toBe(200);
    });
  });

  // Settings' "Update Email" used to just open the profile page.
  describe('change email', () => {
    const lastConfirmToken = (email: string): string => {
      const call = [...sendEmail.mock.calls].reverse().find(([to, subject]) => to === email && /confirm your new email/i.test(subject));
      if (!call) throw new Error(`no confirmation email sent to ${email}`);
      return /confirm-email-change\?token=([a-f0-9]+)/.exec(call[2])![1];
    };
    const requestChange = (token: string, newEmail: string, currentPassword = 'OriginalPass123!') =>
      http().post('/auth/change-email').set('Authorization', `Bearer ${token}`).send({ newEmail, currentPassword });

    it('only changes the email once the new address confirms, and tells the old one', async () => {
      const u = await newUser();
      const newEmail = `pw-new-${Date.now()}@example.com`;
      sendEmail.mockClear();

      await requestChange(u.token, newEmail).expect(200);
      expect((await prisma.user.findUnique({ where: { id: u.id } }))?.email).toBe(u.email); // not yet
      expect(sendEmail.mock.calls[0][0]).toBe(newEmail); // the link goes to the NEW address

      await http().post('/auth/confirm-email-change').send({ token: lastConfirmToken(newEmail) }).expect(200);

      expect((await prisma.user.findUnique({ where: { id: u.id } }))?.email).toBe(newEmail);
      expect((await login(newEmail, 'OriginalPass123!')).status).toBe(200);
      expect((await login(u.email, 'OriginalPass123!')).status).toBe(401);
      expect(sendEmail.mock.calls.some(([to, subject]) => to === u.email && /was changed/i.test(subject))).toBe(true);
    });

    it('requires the current password', async () => {
      const u = await newUser();
      await requestChange(u.token, `pw-new-${Date.now()}@example.com`, 'WrongPass000!').expect(400);
    });

    it("refuses an address that's already taken, at request and at confirmation", async () => {
      const u = await newUser();
      const other = await newUser();
      await requestChange(u.token, other.email).expect(409);

      // free at request time, registered by someone else before confirming
      const contested = `pw-contested-${Date.now()}@example.com`;
      await requestChange(u.token, contested).expect(200);
      const token = lastConfirmToken(contested);
      const squatter = await http().post('/auth/register').send({ email: contested, password: 'SquatterPass1!', name: 'Squatter', role: UserRole.CLIENT }).expect(201);
      userIds.push(squatter.body.user.id);
      await http().post('/auth/confirm-email-change').send({ token }).expect(409);
      expect((await prisma.user.findUnique({ where: { id: u.id } }))?.email).toBe(u.email);
    });

    it('a confirmation link works once', async () => {
      const u = await newUser();
      const newEmail = `pw-once-${Date.now()}@example.com`;
      await requestChange(u.token, newEmail).expect(200);
      const token = lastConfirmToken(newEmail);
      await http().post('/auth/confirm-email-change').send({ token }).expect(200);
      await http().post('/auth/confirm-email-change').send({ token }).expect(400);
    });
  });

  // set-password is for Google-only accounts. It used to overwrite an existing
  // password with no check, so a stolen access token was enough to take over.
  it('refuses set-password on an account that already has a password', async () => {
    const u = await newUser();
    await http()
      .post('/auth/set-password')
      .set('Authorization', `Bearer ${u.token}`)
      .send({ password: 'AttackerPass999!' })
      .expect(400);
    expect((await login(u.email, 'OriginalPass123!')).status).toBe(200);
  });
});
