/**
 * The Elder Oversight panel's "My Flags", through the real HTTP stack.
 *
 * The panel fetched GET /forum/elder-flags -- the admin-only moderation queue
 * -- and filtered it client-side, which 403'd for every babalawo, so the tab
 * never loaded. GET /forum/elder-flags/mine returns only the caller's flags.
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

describe('My elder flags (GET /forum/elder-flags/mine)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];
  let categoryId: string;
  let elder: { id: string; token: string };
  let otherElder: { id: string; token: string };

  async function newUser(role: UserRole) {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: `elder-flags-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`, password: 'SecurePassword123!', name: 'Elder Flags Test', role })
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

    elder = await newUser(UserRole.BABALAWO);
    otherElder = await newUser(UserRole.BABALAWO);
    const author = await newUser(UserRole.CLIENT);

    categoryId = (await prisma.forumCategory.create({ data: { name: 'Elder flags test', slug: `elder-flags-test-${Date.now()}` } })).id;
    const thread = await prisma.forumThread.create({ data: { categoryId, authorId: author.id, title: 'Teaching', content: 'x', tags: [] } });
    const post = await prisma.forumPost.create({ data: { threadId: thread.id, authorId: author.id, content: 'A questionable teaching about Odù' } });
    await prisma.elderFlag.createMany({
      data: [
        { postId: post.id, flaggedBy: elder.id, reason: 'Misrepresents the verse' },
        { postId: post.id, flaggedBy: elder.id, reason: 'Already reviewed', status: 'REVIEWED' },
        { postId: post.id, flaggedBy: otherElder.id, reason: "Someone else's flag" },
      ],
    });
  });

  afterAll(async () => {
    // threads/posts/flags cascade from the category and the users
    await prisma.forumCategory.deleteMany({ where: { id: categoryId } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it("returns only the caller's own flags, in every status, with the post", async () => {
    const res = await request(app.getHttpServer())
      .get('/forum/elder-flags/mine')
      .set('Authorization', `Bearer ${elder.token}`)
      .expect(200);

    expect((res.body as { reason: string }[]).map((f) => f.reason).sort()).toEqual(['Already reviewed', 'Misrepresents the verse']);
    expect(res.body[0].post.content).toBe('A questionable teaching about Odù');
  });

  it("doesn't show another elder's flags", async () => {
    const res = await request(app.getHttpServer())
      .get('/forum/elder-flags/mine')
      .set('Authorization', `Bearer ${otherElder.token}`)
      .expect(200);
    expect((res.body as { reason: string }[]).map((f) => f.reason)).toEqual(["Someone else's flag"]);
  });

  it('keeps the moderation queue admin-only', async () => {
    await request(app.getHttpServer()).get('/forum/elder-flags').set('Authorization', `Bearer ${elder.token}`).expect(403);
  });
});
