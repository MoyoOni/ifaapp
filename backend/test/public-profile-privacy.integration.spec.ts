/**
 * GET /users/:id for someone else returns an allowlist, not the User row.
 * Until November 2, 2026 a stranger received 76 fields, including WhatsApp
 * number, Google id, moderation history, recent orders and anonymous forum
 * posts; and "Private" in Settings was never saved or enforced.
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

describe('Public profile privacy', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];
  let owner: { id: string; token: string };
  let stranger: { id: string; token: string };

  const http = () => request(app.getHttpServer());
  const as = (u: { token: string }) => ({ Authorization: `Bearer ${u.token}` });

  async function newUser() {
    const res = await http()
      .post('/auth/register')
      .send({ email: `privacy-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`, password: 'SecurePassword123!', name: 'Privacy Test', role: UserRole.CLIENT })
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
    owner = await newUser();
    stranger = await newUser();
    await prisma.user.update({
      where: { id: owner.id },
      data: { whatsappNumber: '+2348012345678', banReason: 'test', warnCount: 2, bio: 'Àṣẹ', slug: `privacy-${Date.now()}`, profileVisibility: 'public' },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('shows a stranger only the public allowlist', async () => {
    const res = await http().get(`/users/${owner.id}`).set(as(stranger)).expect(200);
    expect(res.body).toMatchObject({ id: owner.id, bio: 'Àṣẹ', isPrivate: false, subscriptionStatus: 'FREE' });
    for (const field of ['email', 'whatsappNumber', 'googleId', 'banReason', 'warnCount', 'ordersPlaced', 'postsAuthored', 'guidancePlansReceived', 'verificationApp', 'referralCode', 'trustScoreOverrideReason', 'age', 'permissions']) {
      expect(res.body).not.toHaveProperty(field);
    }
  });

  it('still shows the owner their own details', async () => {
    const res = await http().get(`/users/${owner.id}`).set(as(owner)).expect(200);
    expect(res.body).toMatchObject({ whatsappNumber: '+2348012345678' });
    expect(res.body.email).toContain('@example.com');
  });

  it('saves "private" from Settings and then shows others only the basics, including on the share link', async () => {
    await http().patch(`/users/${owner.id}`).set(as(owner)).send({ profileVisibility: 'private' }).expect(200);
    expect((await http().get(`/users/${owner.id}`).set(as(owner)).expect(200)).body.profileVisibility).toBe('private');

    const res = await http().get(`/users/${owner.id}`).set(as(stranger)).expect(200);
    expect(res.body).toMatchObject({ id: owner.id, isPrivate: true });
    expect(res.body).not.toHaveProperty('bio');

    const slug = (await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).slug;
    const shared = await http().get(`/public/resolve/${slug}`).expect(200);
    expect(shared.body).toMatchObject({ id: owner.id });
    expect(shared.body).not.toHaveProperty('bio');
  });
});
