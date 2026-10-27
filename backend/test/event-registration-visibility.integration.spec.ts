/**
 * Event detail and attendee list for signed-in members, through the real
 * HTTP stack.
 *
 * GET /events/:identifier and GET /events/:id/attendees had no guard at all,
 * so @CurrentUser() was always undefined: the detail never included the
 * member's own registration (the frontend papered over that by fabricating
 * one whenever registering failed), and the creator of an unpublished event
 * was refused their own attendee list.
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

describe('Event registration visibility (GET /events/:identifier, /attendees)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];
  let creator: { id: string; token: string };
  let member: { id: string; token: string };
  let publishedId: string;
  let publishedSlug: string;
  let draftId: string;

  async function newUser() {
    const email = `evt-vis-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'SecurePassword123!', name: 'Event Visibility Test', role: UserRole.CLIENT })
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

    creator = await newUser();
    member = await newUser();
    const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const base = { creatorId: creator.id, type: 'CEREMONY', startDate: new Date(Date.now() + 7 * 86_400_000) };
    publishedSlug = `evt-vis-published-${stamp}`;
    publishedId = (
      await prisma.event.create({ data: { ...base, title: 'Published', slug: publishedSlug, published: true } })
    ).id;
    draftId = (await prisma.event.create({ data: { ...base, title: 'Draft', slug: `evt-vis-draft-${stamp}` } })).id;
  });

  afterAll(async () => {
    // events and registrations cascade from their creator/user
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it("includes a signed-in member's own registration in the event detail", async () => {
    await request(app.getHttpServer())
      .post(`/events/${publishedId}/register`)
      .set('Authorization', `Bearer ${member.token}`)
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/events/${publishedSlug}`)
      .set('Authorization', `Bearer ${member.token}`)
      .expect(200);
    expect(res.body.userRegistration?.status).toBe('REGISTERED');
  });

  it('still serves the event detail to anonymous visitors, without a registration', async () => {
    const res = await request(app.getHttpServer()).get(`/events/${publishedSlug}`).expect(200);
    expect(res.body.userRegistration).toBeNull();
  });

  it('lets the creator see attendees of their own unpublished event', async () => {
    const res = await request(app.getHttpServer())
      .get(`/events/${draftId}/attendees`)
      .set('Authorization', `Bearer ${creator.token}`)
      .expect(200);
    expect(res.body.eventId).toBe(draftId);
  });

  it('still refuses that attendee list to anyone else', async () => {
    await request(app.getHttpServer()).get(`/events/${draftId}/attendees`).expect(403);
    await request(app.getHttpServer())
      .get(`/events/${draftId}/attendees`)
      .set('Authorization', `Bearer ${member.token}`)
      .expect(403);
  });
});
