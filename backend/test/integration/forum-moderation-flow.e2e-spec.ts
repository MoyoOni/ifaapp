import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { User, ForumThread, ForumPost, ForumCategory } from '@prisma/client';

describe('Forum Moderation Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let clientUser: User;
  let babalawoUser: User;
  let adminUser: User;
  let category: ForumCategory;
  let thread: ForumThread;
  let post: ForumPost;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useClass(PrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    // Clean up test data
    if (post) {
      await prisma.forumPost.deleteMany({
        where: { id: post.id },
      });
    }

    if (thread) {
      await prisma.forumThread.deleteMany({
        where: { id: thread.id },
      });
    }

    if (category) {
      await prisma.forumCategory.deleteMany({
        where: { id: category.id },
      });
    }

    if (clientUser) {
      await prisma.user.deleteMany({
        where: { email: clientUser.email },
      });
    }

    if (babalawoUser) {
      await prisma.user.deleteMany({
        where: { email: babalawoUser.email },
      });
    }

    if (adminUser) {
      await prisma.user.deleteMany({
        where: { email: adminUser.email },
      });
    }

    await app.close();
  });

  it('/auth/register (POST) -> Register Client User', async () => {
    const registrationData = {
      email: `client-${Date.now()}@example.com`,
      firstName: 'Forum',
      lastName: 'Client',
      password: 'SecurePassword123!',
      phone: '+1234567890',
    };

    return request(app.getHttpServer())
      .post('/auth/register')
      .send(registrationData)
      .expect(201)
      .then(response => {
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.role).toBe('CLIENT');
        clientUser = response.body.user;
      });
  });

  it('/auth/register (POST) -> Register Babalawo User', async () => {
    const registrationData = {
      email: `babalawo-${Date.now()}@example.com`,
      firstName: 'Forum',
      lastName: 'Babalawo',
      password: 'SecurePassword123!',
      phone: '+1234567891',
    };

    return request(app.getHttpServer())
      .post('/auth/register')
      .send(registrationData)
      .expect(201)
      .then(response => {
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.role).toBe('BABALAWO');
        babalawoUser = response.body.user;
      });
  });

  it('/auth/register (POST) -> Register Admin User', async () => {
    const registrationData = {
      email: `admin-${Date.now()}@example.com`,
      firstName: 'Forum',
      lastName: 'Admin',
      password: 'SecurePassword123!',
      phone: '+1234567892',
    };

    return request(app.getHttpServer())
      .post('/auth/register')
      .send(registrationData)
      .expect(201)
      .then(response => {
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.role).toBe('ADMIN');
        adminUser = response.body.user;
      });
  });

  it('/forum/categories (POST) -> Create Forum Category', async () => {
    // Get admin access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminUser.email,
        password: 'SecurePassword123!',
      })
      .expect(200);

    const adminAccessToken = loginResponse.body.tokens.access_token;

    const categoryData = {
      name: 'Spiritual Guidance',
      description: 'Discussions about spiritual matters',
    };

    return request(app.getHttpServer())
      .post('/forum/categories')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send(categoryData)
      .expect(201)
      .then(response => {
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('Spiritual Guidance');
        category = response.body;
      });
  });

  it('/forum/threads (POST) -> Create Forum Thread', async () => {
    // Get client access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: clientUser.email,
        password: 'SecurePassword123!',
      })
      .expect(200);

    const clientAccessToken = loginResponse.body.tokens.access_token;

    const threadData = {
      title: 'Seeking Spiritual Guidance',
      content: 'I am seeking guidance on my spiritual path. Any advice would be appreciated.',
      categoryId: category.id,
      visibility: 'PUBLIC',
    };

    return request(app.getHttpServer())
      .post('/forum/threads')
      .set('Authorization', `Bearer ${clientAccessToken}`)
      .send(threadData)
      .expect(201)
      .then(response => {
        expect(response.body).toHaveProperty('id');
        expect(response.body.title).toBe('Seeking Spiritual Guidance');
        expect(response.body.authorId).toBe(clientUser.id);
        expect(response.body.status).toBe('PENDING_REVIEW'); // Assuming auto-approval is disabled for moderation
        thread = response.body;
      });
  });

  it('/forum/moderate/approve (PATCH) -> Approve Thread (Babalawo)', async () => {
    // Get babalawo access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: babalawoUser.email,
        password: 'SecurePassword123!',
      })
      .expect(200);

    const babalawoAccessToken = loginResponse.body.tokens.access_token;

    return request(app.getHttpServer())
      .patch(`/forum/threads/${thread.id}/approve`)
      .set('Authorization', `Bearer ${babalawoAccessToken}`)
      .expect(200)
      .then(response => {
        expect(response.body.status).toBe('APPROVED');
        expect(response.body.id).toBe(thread.id);
        expect(response.body.approvedById).toBe(babalawoUser.id);
      });
  });

  it('/forum/posts (POST) -> Create Reply Post', async () => {
    // Get babalawo access token to respond
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: babalawoUser.email,
        password: 'SecurePassword123!',
      })
      .expect(200);

    const babalawoAccessToken = loginResponse.body.tokens.access_token;

    const postData = {
      content: 'May the wisdom of Ifá guide you on your spiritual journey. Consider meditation at dawn for clarity.',
      threadId: thread.id,
    };

    return request(app.getHttpServer())
      .post('/forum/posts')
      .set('Authorization', `Bearer ${babalawoAccessToken}`)
      .send(postData)
      .expect(201)
      .then(response => {
        expect(response.body).toHaveProperty('id');
        expect(response.body.content).toContain('wisdom of Ifá');
        expect(response.body.authorId).toBe(babalawoUser.id);
        expect(response.body.threadId).toBe(thread.id);
        post = response.body;
      });
  });

  it('/forum/posts/:id/report (POST) -> Report Post (Client)', async () => {
    // Get client access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: clientUser.email,
        password: 'SecurePassword123!',
      })
      .expect(200);

    const clientAccessToken = loginResponse.body.tokens.access_token;

    const reportData = {
      reason: 'INAPPROPRIATE_CONTENT',
      details: 'The post contains content that seems misleading spiritually',
    };

    return request(app.getHttpServer())
      .post(`/forum/posts/${post.id}/report`)
      .set('Authorization', `Bearer ${clientAccessToken}`)
      .send(reportData)
      .expect(201)
      .then(response => {
        expect(response.body).toHaveProperty('id');
        expect(response.body.postId).toBe(post.id);
        expect(response.body.reporterId).toBe(clientUser.id);
        expect(response.body.status).toBe('PENDING_REVIEW');
      });
  });

  it('/moderation/reports/:id/review (PATCH) -> Review Report (Admin)', async () => {
    // Get admin access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminUser.email,
        password: 'SecurePassword123!',
      })
      .expect(200);

    const adminAccessToken = loginResponse.body.tokens.access_token;

    // First, get the report ID
    const reportsResponse = await request(app.getHttpServer())
      .get('/moderation/reports')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    const report = reportsResponse.body.find(r => r.postId === post.id);
    expect(report).toBeDefined();

    const reviewData = {
      decision: 'APPROVED', // Meaning the reported content was found to be appropriate
      notes: 'Reviewed content and found it to be appropriate spiritual guidance',
    };

    return request(app.getHttpServer())
      .patch(`/moderation/reports/${report.id}/review`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send(reviewData)
      .expect(200)
      .then(response => {
        expect(response.body.decision).toBe('APPROVED');
        expect(response.body.status).toBe('RESOLVED');
      });
  });

  it('/forum/threads/:id (GET) -> Retrieve Thread with Posts', async () => {
    // Get client access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: clientUser.email,
        password: 'SecurePassword123!',
      })
      .expect(200);

    const clientAccessToken = loginResponse.body.tokens.access_token;

    return request(app.getHttpServer())
      .get(`/forum/threads/${thread.id}`)
      .set('Authorization', `Bearer ${clientAccessToken}`)
      .expect(200)
      .then(response => {
        expect(response.body).toHaveProperty('id', thread.id);
        expect(response.body.posts).toBeInstanceOf(Array);
        expect(response.body.posts.length).toBeGreaterThan(0);
        expect(response.body.posts[0].content).toContain('wisdom of Ifá');
      });
  });
});