/**
 * Following up a crisis-flagged post (Z1-803), through the real HTTP stack.
 *
 * A flag used to only notify admins. Nobody could say "I'm on this" -- two
 * admins could both reach out, or neither -- and "Mark as Reviewed" kept no
 * record of what was done. Admins can now claim a flag, resolve it with an
 * outcome and a note, and see the history.
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

describe('Crisis follow-up', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];
  let categoryId: string;
  let circleId: string;
  let adminA: { id: string; token: string };
  let adminB: { id: string; token: string };
  let member: { id: string; token: string };

  const http = () => request(app.getHttpServer());

  async function newUser(role: UserRole, admin = false) {
    const res = await http()
      .post('/auth/register')
      .send({ email: `crisis-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`, password: 'SecurePassword123!', name: admin ? `Admin ${userIds.length}` : 'Crisis Test', role })
      .expect(201);
    userIds.push(res.body.user.id);
    if (admin) await prisma.user.update({ where: { id: res.body.user.id }, data: { role: 'ADMIN' } });
    return { id: res.body.user.id as string, token: res.body.accessToken as string };
  }

  async function flaggedForumPost() {
    const thread = await prisma.forumThread.create({ data: { categoryId, authorId: member.id, title: 'Heavy days', content: 'x', tags: [] } });
    return prisma.forumPost.create({
      data: { threadId: thread.id, authorId: member.id, content: "I can't go on like this", hasCrisisSignal: true, heldForReview: true },
    });
  }

  const as = (u: { token: string }) => ({ Authorization: `Bearer ${u.token}` });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);

    adminA = await newUser(UserRole.CLIENT, true);
    adminB = await newUser(UserRole.CLIENT, true);
    member = await newUser(UserRole.CLIENT);
    categoryId = (await prisma.forumCategory.create({ data: { name: 'Crisis test', slug: `crisis-test-${Date.now()}` } })).id;
    circleId = (await prisma.circle.create({ data: { name: 'Crisis circle', slug: `crisis-circle-${Date.now()}`, creatorId: member.id } })).id;
  });

  afterAll(async () => {
    await prisma.forumCategory.deleteMany({ where: { id: categoryId } });
    await prisma.circle.deleteMany({ where: { id: circleId } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('lets one admin claim a flag, shows the claim to others, and refuses a second claim', async () => {
    const post = await flaggedForumPost();

    await http().patch(`/forum/admin/crisis-signals/${post.id}/claim?source=forum`).set(as(adminA)).expect(200);
    // Claiming again yourself is fine (idempotent).
    await http().patch(`/forum/admin/crisis-signals/${post.id}/claim?source=forum`).set(as(adminA)).expect(200);
    const second = await http().patch(`/forum/admin/crisis-signals/${post.id}/claim?source=forum`).set(as(adminB)).expect(409);
    expect(second.body.error.message).toMatch(/already following this up/);

    const queue = await http().get('/forum/admin/crisis-signals?limit=100').set(as(adminB)).expect(200);
    const row = queue.body.posts.find((p: { id: string }) => p.id === post.id);
    expect(row.followUp).toMatchObject({ status: 'CLAIMED', claimedBy: { id: adminA.id } });
  });

  it('resolves with an outcome and note, clears the flag, and records it in history', async () => {
    const post = await flaggedForumPost();
    await http().patch(`/forum/admin/crisis-signals/${post.id}/claim?source=forum`).set(as(adminA)).expect(200);

    await http().patch(`/forum/admin/crisis-signals/${post.id}/resolve?source=forum`).set(as(adminA))
      .send({ outcome: 'NOT_A_THING' }).expect(400);
    await http().patch(`/forum/admin/crisis-signals/${post.id}/resolve?source=forum`).set(as(adminA))
      .send({ outcome: 'REACHED_OUT', note: 'Spoke by phone; they have family support.' }).expect(200);

    const after = await prisma.forumPost.findUnique({ where: { id: post.id } });
    expect(after).toMatchObject({ hasCrisisSignal: false, heldForReview: false, reviewedBy: adminA.id });

    const queue = await http().get('/forum/admin/crisis-signals?limit=100').set(as(adminA)).expect(200);
    expect(queue.body.posts.map((p: { id: string }) => p.id)).not.toContain(post.id);

    const history = await http().get('/forum/admin/crisis-signals/history').set(as(adminB)).expect(200);
    const item = history.body.items.find((i: { postId: string }) => i.postId === post.id);
    expect(item).toMatchObject({
      outcome: 'REACHED_OUT',
      note: 'Spoke by phone; they have family support.',
      author: { id: member.id },
      claimedBy: { id: adminA.id },
      resolvedBy: { id: adminA.id },
    });

    await http().patch(`/forum/admin/crisis-signals/${post.id}/claim?source=forum`).set(as(adminB)).expect(400);
    await http().patch(`/forum/admin/crisis-signals/${post.id}/resolve?source=forum`).set(as(adminB))
      .send({ outcome: 'FALSE_ALARM' }).expect(400);
  });

  it('resolves an unclaimed circle flag directly (e.g. a false alarm)', async () => {
    const post = await (prisma as any).circleFeedPost.create({
      data: { circleId, authorId: member.id, content: 'This recipe is better off dead simple', hasCrisisSignal: true },
    });
    await http().patch(`/forum/admin/crisis-signals/${post.id}/resolve?source=circle`).set(as(adminB))
      .send({ outcome: 'FALSE_ALARM' }).expect(200);

    expect((await (prisma as any).circleFeedPost.findUnique({ where: { id: post.id } })).hasCrisisSignal).toBe(false);
    const followUp = await prisma.crisisFollowUp.findUnique({ where: { source_postId: { source: 'circle', postId: post.id } } });
    expect(followUp).toMatchObject({ status: 'RESOLVED', outcome: 'FALSE_ALARM', claimedById: null, resolvedById: adminB.id });
  });

  // The brief used to say "All clear" while a distress post sat unanswered.
  it("counts open flags in the admin morning brief's pending actions", async () => {
    const before = (await http().get('/admin/morning-brief').set(as(adminA)).expect(200)).body.pendingActions;
    const post = await flaggedForumPost();
    const during = (await http().get('/admin/morning-brief').set(as(adminA)).expect(200)).body.pendingActions;
    expect(during.crisisSignals).toBe(before.crisisSignals + 1);
    expect(during.total).toBe(before.total + 1);

    await http().patch(`/forum/admin/crisis-signals/${post.id}/resolve?source=forum`).set(as(adminA)).send({ outcome: 'REFERRED' }).expect(200);
    const after = (await http().get('/admin/morning-brief').set(as(adminA)).expect(200)).body.pendingActions;
    expect(after.crisisSignals).toBe(before.crisisSignals);
  });

  it('keeps crisis posts out of the moderation queue, where they could be rejected with no follow-up', async () => {
    const post = await flaggedForumPost();
    const queue = await http().get('/admin/integrity/queue?limit=100').set(as(adminA)).expect(200);
    expect(queue.body.items.map((i: { id: string }) => i.id)).not.toContain(post.id);
    const reject = await http().post(`/admin/integrity/queue/${post.id}/reject`).set(as(adminA)).send({ reason: 'Not appropriate' }).expect(400);
    expect(reject.body.error.message).toMatch(/Crisis Alerts/);
    expect((await prisma.forumPost.findUnique({ where: { id: post.id } }))?.hasCrisisSignal).toBe(true);
  });

  it('is admin-only', async () => {
    const post = await flaggedForumPost();
    await http().patch(`/forum/admin/crisis-signals/${post.id}/claim?source=forum`).set(as(member)).expect(403);
    await http().patch(`/forum/admin/crisis-signals/${post.id}/resolve?source=forum`).set(as(member)).send({ outcome: 'FALSE_ALARM' }).expect(403);
    await http().get('/forum/admin/crisis-signals/history').set(as(member)).expect(403);
  });
});
