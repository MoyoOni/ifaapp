/**
 * Optional authentication on @Public() routes, through the real HTTP stack.
 *
 * JwtAuthGuard used to return early for public routes without authenticating,
 * so @CurrentUser() was always undefined there -- a signed-in member was
 * treated as an anonymous visitor. Concretely, F9-601's "sacred threads are
 * hidden from unauthenticated visitors" hid them from every member too.
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

describe('Optional auth on public routes (sacred forum threads)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;
  let token: string;
  let categoryId: string;
  let sacredThreadId: string;
  let openThreadId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);

    const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: `pub-auth-${stamp}@example.com`, password: 'SecurePassword123!', name: 'Public Auth Test', role: UserRole.CLIENT })
      .expect(201);
    userId = res.body.user.id;
    token = res.body.accessToken;

    const category = await prisma.forumCategory.create({
      data: { name: 'Public auth test', slug: `public-auth-test-${stamp}` },
    });
    categoryId = category.id;
    const base = { categoryId, authorId: userId, content: 'Test content', tags: [] };
    sacredThreadId = (await prisma.forumThread.create({ data: { ...base, title: 'Sacred', isSacred: true } })).id;
    openThreadId = (await prisma.forumThread.create({ data: { ...base, title: 'Open' } })).id;
  });

  afterAll(async () => {
    // threads cascade from both the category and the author
    await prisma.forumCategory.deleteMany({ where: { id: categoryId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await app.close();
  });

  const listIds = async (auth?: string) => {
    const req = request(app.getHttpServer()).get(`/forum/threads?categoryId=${categoryId}`);
    if (auth) req.set('Authorization', auth);
    const res = await req.expect(200);
    return (res.body as { id: string }[]).map((t) => t.id).sort();
  };

  it('shows a signed-in member sacred threads in the list', async () => {
    expect(await listIds(`Bearer ${token}`)).toEqual([openThreadId, sacredThreadId].sort());
  });

  it('lets a signed-in member open a sacred thread', async () => {
    await request(app.getHttpServer())
      .get(`/forum/threads/${sacredThreadId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('still hides sacred threads from anonymous visitors', async () => {
    expect(await listIds()).toEqual([openThreadId]);
    await request(app.getHttpServer()).get(`/forum/threads/${sacredThreadId}`).expect(403);
  });

  it('treats an invalid token as anonymous instead of rejecting the request', async () => {
    expect(await listIds('Bearer not-a-real-token')).toEqual([openThreadId]);
    await request(app.getHttpServer())
      .get(`/forum/threads/${sacredThreadId}`)
      .set('Authorization', 'Bearer not-a-real-token')
      .expect(403);
  });
});
