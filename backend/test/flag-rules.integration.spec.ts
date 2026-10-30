/**
 * Flag rules applied to real posts, and moderation that actually hides
 * (FOR-001), through the real HTTP stack.
 *
 * Until October 30, 2026 the ContentFlagRule list was never applied to new
 * posts, and posts a moderator hid (status HIDDEN) or rejected (REJECTED)
 * stayed visible to every member -- editing one even put it back.
 *
 * Owner's decision: a rule match publishes the post and queues it for an
 * admin; it is not hidden until the admin chooses to.
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

describe('Flag rules and moderation visibility', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];
  let categoryId: string;
  let circleId: string;
  let ruleId: string;
  let admin: { id: string; token: string };
  let author: { id: string; token: string };
  let reader: { id: string; token: string };

  const http = () => request(app.getHttpServer());
  const as = (u: { token: string }) => ({ Authorization: `Bearer ${u.token}` });
  const KEYWORD = `flagtest phrase ${Date.now()}`;

  async function newUser(makeAdmin = false) {
    const res = await http()
      .post('/auth/register')
      .send({ email: `flag-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`, password: 'SecurePassword123!', name: 'Flag Test', role: UserRole.CLIENT })
      .expect(201);
    userIds.push(res.body.user.id);
    if (makeAdmin) await prisma.user.update({ where: { id: res.body.user.id }, data: { role: 'ADMIN' } });
    return { id: res.body.user.id as string, token: res.body.accessToken as string };
  }

  const threadPosts = async (threadId: string, who: { token: string }) =>
    (await http().get(`/forum/threads/${threadId}/posts`).set(as(who)).expect(200)).body as Array<{ id: string; content: string }>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);

    admin = await newUser(true);
    author = await newUser();
    reader = await newUser();
    categoryId = (await prisma.forumCategory.create({ data: { name: 'Flag test', slug: `flag-test-${Date.now()}` } })).id;
    circleId = (await prisma.circle.create({ data: { name: 'Flag circle', slug: `flag-circle-${Date.now()}`, creatorId: author.id } })).id;
    await prisma.circleMember.create({ data: { circleId, userId: author.id } });

    const rule = await http()
      .post('/admin/integrity/rules')
      .set(as(admin))
      .send({ type: 'KEYWORD', value: KEYWORD, reason: 'Test-only rule' })
      .expect(201);
    ruleId = rule.body.id;
  });

  afterAll(async () => {
    await prisma.contentFlagRule.deleteMany({ where: { id: ruleId } });
    await prisma.forumThread.deleteMany({ where: { categoryId } });
    await prisma.forumCategory.deleteMany({ where: { id: categoryId } });
    await prisma.circle.deleteMany({ where: { id: circleId } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('publishes a matching thread, queues it for admins, and hides it only when an admin says so', async () => {
    const created = await http()
      .post('/forum/threads')
      .set(as(author))
      .send({ categoryId, title: 'Offer', content: `Now ${KEYWORD.toUpperCase()}, message me` })
      .expect(201);
    const threadId = created.body.id;

    // Still visible to other members.
    const before = await threadPosts(threadId, reader);
    expect(before).toHaveLength(1);
    const postId = before[0].id;

    // Waiting for an admin, with the rule that matched.
    const flagged = await http().get('/admin/integrity/flagged').set(as(admin)).expect(200);
    const item = flagged.body.items.find((i: { id: string }) => i.id === postId);
    expect(item).toMatchObject({ source: 'forum', flagMatch: `Keyword "${KEYWORD}": Test-only rule` });

    await http().post(`/admin/integrity/flagged/forum/${postId}/hide`).set(as(admin)).expect(201);

    expect(await threadPosts(threadId, reader)).toHaveLength(0);
    const afterHide = await http().get('/admin/integrity/flagged').set(as(admin)).expect(200);
    expect(afterHide.body.items.some((i: { id: string }) => i.id === postId)).toBe(false);

    // The author can't bring it back by editing it.
    await http().patch(`/forum/posts/${postId}`).set(as(author)).send({ content: 'harmless now' }).expect(404);
    expect(await threadPosts(threadId, reader)).toHaveLength(0);
  });

  it('leaves ordinary posts alone, and lets an admin clear a false match', async () => {
    const clean = await http()
      .post('/forum/threads')
      .set(as(author))
      .send({ categoryId, title: 'Question', content: 'When is the next Ọ̀ṣẹ̀ gathering?' })
      .expect(201);
    const [cleanPost] = await threadPosts(clean.body.id, reader);
    const flagged = await http().get('/admin/integrity/flagged').set(as(admin)).expect(200);
    expect(flagged.body.items.some((i: { id: string }) => i.id === cleanPost.id)).toBe(false);

    // An edit that introduces the phrase queues it.
    await http().patch(`/forum/posts/${cleanPost.id}`).set(as(author)).send({ content: `Also ${KEYWORD}` }).expect(200);
    const queued = await http().get('/admin/integrity/flagged').set(as(admin)).expect(200);
    expect(queued.body.items.some((i: { id: string }) => i.id === cleanPost.id)).toBe(true);

    await http().post(`/admin/integrity/flagged/forum/${cleanPost.id}/clear`).set(as(admin)).expect(201);
    expect(await threadPosts(clean.body.id, reader)).toHaveLength(1);
    const cleared = await http().get('/admin/integrity/flagged').set(as(admin)).expect(200);
    expect(cleared.body.items.some((i: { id: string }) => i.id === cleanPost.id)).toBe(false);
  });

  it('flags circle posts too', async () => {
    const res = await http().post(`/circles/${circleId}/feed`).set(as(author)).send({ content: `${KEYWORD} here` }).expect(201);
    const flagged = await http().get('/admin/integrity/flagged').set(as(admin)).expect(200);
    expect(flagged.body.items.find((i: { id: string }) => i.id === res.body.id)).toMatchObject({ source: 'circle', where: { title: 'Flag circle' } });
  });

  it('keeps a post hidden from a report or rejected in review off the page', async () => {
    const t = await http().post('/forum/threads').set(as(author)).send({ categoryId, title: 'Hidden test', content: 'An ordinary first post for this thread.' }).expect(201);
    const [first] = await threadPosts(t.body.id, reader);
    await prisma.forumPost.update({ where: { id: first.id }, data: { status: 'HIDDEN' } });
    const rejected = await prisma.forumPost.create({ data: { threadId: t.body.id, authorId: author.id, content: 'rejected one', status: 'REJECTED' } });

    expect(await threadPosts(t.body.id, reader)).toHaveLength(0);
    await http().get(`/forum/posts/${rejected.id}`).set(as(reader)).expect(404);
    // Admins still see them, to review.
    expect((await threadPosts(t.body.id, admin)).length).toBe(2);
  });
});
