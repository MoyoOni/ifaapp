/**
 * Onboarding completion, through the real HTTP stack.
 *
 * PATCH /users/:id/onboarding was marked @Public(), and JwtAuthGuard returns
 * early for public routes without authenticating -- so @CurrentUser() was
 * always undefined, the ownership check threw 403 for every non-admin, and no
 * one could finish onboarding. Unit tests called the service directly and never
 * exercised the controller, so nothing caught it.
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

describe('Onboarding completion (PATCH /users/:id/onboarding)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdIds: string[] = [];
  const PASSWORD = 'SecurePassword123!';

  // exactly what use-onboarding.ts completeOnboarding() sends
  const frontendPayload = {
    yorubaName: 'Adé',
    location: 'Lagos, Nigeria',
    intentTags: ['learn-ifa'],
    preferredLanguage: 'en',
    timezone: 'Africa/Lagos',
    hasOnboarded: true,
  };

  async function newUser(role: UserRole = UserRole.CLIENT) {
    const email = `onb-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: PASSWORD, name: 'Onboarding Test', role })
      .expect(201);
    createdIds.push(res.body.user.id);
    return { id: res.body.user.id as string, token: res.body.accessToken as string };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: createdIds } } });
    await app.close();
  });

  it('lets a user complete their own onboarding with the exact payload the UI sends', async () => {
    const { id, token } = await newUser();

    const res = await request(app.getHttpServer())
      .patch(`/users/${id}/onboarding`)
      .set('Authorization', `Bearer ${token}`)
      .send(frontendPayload)
      .expect(200);

    expect(res.body.hasOnboarded).toBe(true);
    const row = await prisma.user.findUnique({ where: { id } });
    expect(row?.hasOnboarded).toBe(true);
    expect(row?.yorubaName).toBe('Adé');
    expect(row?.location).toBe('Lagos, Nigeria');
    expect(row?.timezone).toBe('Africa/Lagos');
    expect(row?.intentTags).toEqual(['learn-ifa']);
  });

  it('works for Vendor and Babalawo accounts too', async () => {
    for (const role of [UserRole.VENDOR, UserRole.BABALAWO]) {
      const { id, token } = await newUser(role);
      await request(app.getHttpServer())
        .patch(`/users/${id}/onboarding`)
        .set('Authorization', `Bearer ${token}`)
        .send(frontendPayload)
        .expect(200);
      expect((await prisma.user.findUnique({ where: { id } }))?.hasOnboarded).toBe(true);
    }
  });

  it('cannot be used to escalate privileges: role/verified/adminSubRole in the body are ignored', async () => {
    const { id, token } = await newUser(UserRole.CLIENT);

    await request(app.getHttpServer())
      .patch(`/users/${id}/onboarding`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...frontendPayload, role: 'ADMIN', verified: true, adminSubRole: 'SUPER', trustScore: 100 })
      .expect(200);

    const row = await prisma.user.findUnique({ where: { id } });
    expect(row?.role).toBe('CLIENT');
    expect(row?.verified).toBe(false);
    expect(row?.adminSubRole).toBeNull();
    expect(row?.trustScore).toBe(0);
    expect(row?.hasOnboarded).toBe(true);
  });

  it("rejects onboarding someone else's account (403) and unauthenticated calls (401)", async () => {
    const victim = await newUser();
    const attacker = await newUser();

    await request(app.getHttpServer())
      .patch(`/users/${victim.id}/onboarding`)
      .set('Authorization', `Bearer ${attacker.token}`)
      .send(frontendPayload)
      .expect(403);
    await request(app.getHttpServer()).patch(`/users/${victim.id}/onboarding`).send(frontendPayload).expect(401);

    expect((await prisma.user.findUnique({ where: { id: victim.id } }))?.hasOnboarded).toBe(false);
  });
});
