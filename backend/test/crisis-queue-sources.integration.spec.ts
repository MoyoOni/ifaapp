/**
 * Crisis language in a circle comment or on the remembrance wall reaches the
 * admin crisis queue and goes through the same claim → resolve follow-up as
 * forum and circle posts (Z1-803, November 2, 2026). Before this, comments
 * and the grief wall were never checked at all.
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

describe('Crisis queue sources', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];
  let admin: { id: string; token: string };
  let member: { id: string; token: string };
  let circleId: string;

  const http = () => request(app.getHttpServer());
  const as = (u: { token: string }) => ({ Authorization: `Bearer ${u.token}` });

  async function newUser(role: UserRole) {
    const email = `crisisq-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
    const res = await http().post('/auth/register').send({ email, password: 'SecurePassword123!', name: 'Crisis Queue Test', role }).expect(201);
    userIds.push(res.body.user.id);
    return { id: res.body.user.id as string, token: res.body.accessToken as string, email };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);

    const a = await newUser(UserRole.CLIENT);
    await prisma.user.update({ where: { id: a.id }, data: { role: 'ADMIN', adminSubRole: 'SAFEGUARDING' } });
    const login = await http().post('/auth/login').send({ email: a.email, password: 'SecurePassword123!' }).expect(200);
    admin = { id: a.id, token: login.body.accessToken };
    member = await newUser(UserRole.CLIENT);

    const circle = await prisma.circle.create({
      data: { name: `Grief Circle ${Date.now()}`, slug: `grief-${Date.now()}`, creatorId: admin.id },
    });
    circleId = circle.id;
    await prisma.circleMember.create({ data: { circleId, userId: member.id, status: 'ACTIVE' } });
  });

  afterAll(async () => {
    await prisma.crisisFollowUp.deleteMany({ where: { authorId: { in: userIds } } });
    await prisma.memorialEntry.deleteMany({ where: { authorId: { in: userIds } } });
    await prisma.circle.deleteMany({ where: { id: circleId } });
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  async function queued(source: string, id: string) {
    const res = await http().get('/forum/admin/crisis-signals?limit=100').set(as(admin)).expect(200);
    return res.body.posts.find((p: { id: string; source: string }) => p.id === id && p.source === source);
  }

  it('queues a remembrance wall entry, and an admin can claim and resolve it', async () => {
    const entry = await http()
      .post('/memorials')
      .set(as(member))
      .send({ name: 'Bàbá', message: 'Since you left I want to die too', isPublic: true })
      .expect(201);

    const item = await queued('memorial', entry.body.id);
    expect(item).toMatchObject({ content: 'Since you left I want to die too', author: { id: member.id } });

    await http().patch(`/forum/admin/crisis-signals/${entry.body.id}/claim?source=memorial`).set(as(admin)).expect(200);
    await http()
      .patch(`/forum/admin/crisis-signals/${entry.body.id}/resolve?source=memorial`)
      .set(as(admin))
      .send({ outcome: 'REACHED_OUT', note: 'Called them' })
      .expect(200);

    expect(await queued('memorial', entry.body.id)).toBeUndefined();
    // Still on the wall: grief posts immediately and is never hidden.
    expect((await prisma.memorialEntry.findUniqueOrThrow({ where: { id: entry.body.id } })).deletedAt).toBeNull();
  });

  it('queues a circle comment with a link to its circle; ordinary comments are not queued', async () => {
    const post = await prisma.circleFeedPost.create({ data: { circleId, authorId: admin.id, content: 'How is everyone holding up?' } });

    const ok = await http().post(`/circles/feed/${post.id}/comments`).set(as(member)).send({ content: 'Holding on, thank you' }).expect(201);
    const flagged = await http().post(`/circles/feed/${post.id}/comments`).set(as(member)).send({ content: "Honestly I can't go on" }).expect(201);

    expect(await queued('circle-comment', ok.body.id)).toBeUndefined();
    expect(await queued('circle-comment', flagged.body.id)).toMatchObject({ circle: { id: circleId } });
  });
});
