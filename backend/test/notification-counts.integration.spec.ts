/**
 * Notification badge counts, through the real HTTP stack and database.
 *
 * GET /notifications/unread-count returned a bare number while both callers
 * (sidebar bell, notification center) read `.count`, so the unread badge never
 * showed; and GET /notifications/count-by-type (the notification center's tab
 * badges) was never registered, so it 404'd on every visit.
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

describe('Notification badge counts', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: `notif-count-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`, password: 'SecurePassword123!', name: 'Notification Counts', role: UserRole.CLIENT })
      .expect(201);
    userId = res.body.user.id;
    token = res.body.accessToken;

    // registration may itself send a welcome notification -- start from a known state
    await prisma.notification.deleteMany({ where: { userId } });
    const base = { userId, title: 'Test', message: 'Test' };
    await prisma.notification.createMany({
      data: [
        { ...base, type: 'ORDER' },
        { ...base, type: 'ORDER', read: true },
        { ...base, type: 'TEMPLE' },
        { ...base, type: 'MESSAGE' },
        // scheduled for later: not listed yet, so not counted yet
        { ...base, type: 'ORDER', scheduledAt: new Date(Date.now() + 86_400_000) },
      ],
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
    await app.close();
  });

  it('returns the unread count in the { count } shape its callers read', async () => {
    const res = await request(app.getHttpServer())
      .get('/notifications/unread-count')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body).toEqual({ count: 3 });
  });

  it('serves per-tab counts that match what each tab lists', async () => {
    const res = await request(app.getHttpServer())
      .get('/notifications/count-by-type')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body).toEqual({ unread: 3, messages: 1, appointments: 0, orders: 2, community: 1 });

    const orders = await request(app.getHttpServer())
      .get('/notifications?filter=orders')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(orders.body).toHaveLength(res.body.orders);
  });
});
