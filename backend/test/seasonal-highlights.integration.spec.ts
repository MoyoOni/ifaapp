/**
 * FOR-007: gathering threads for sacred-calendar events that are near or
 * underway, and GET /forum/seasonal-highlights, against a real database --
 * the date window is a Prisma where-clause, which a mocked unit test can't
 * actually check.
 *
 * Run: npm run test:integration
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import { SeasonalEventReminderService } from '../src/marketplace/seasonal-event-reminder.service';
import { UserRole } from '@ile-ase/common';

const DAY = 24 * 60 * 60 * 1000;
const CATEGORY_SLUG = 'temple-connections-events';

describe('Seasonal highlights (FOR-007)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let reminders: SeasonalEventReminderService;
  let userId: string;
  let categoryId: string;
  let createdCategory = false;
  let originalThreadCount = 0;
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    reminders = app.get(SeasonalEventReminderService);

    const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: `seasonal-${stamp}@example.com`, password: 'SecurePassword123!', name: 'Seasonal Test', role: UserRole.CLIENT })
      .expect(201);
    userId = res.body.user.id;

    const existing = await prisma.forumCategory.findUnique({ where: { slug: CATEGORY_SLUG } });
    if (existing) {
      categoryId = existing.id;
      originalThreadCount = existing.threadCount;
    } else {
      categoryId = (await prisma.forumCategory.create({ data: { name: 'Temple Connections & Events', slug: CATEGORY_SLUG } })).id;
      createdCategory = true;
    }

    const now = Date.now();
    const make = (key: string, data: { date: number; endDate?: number; isActive?: boolean; yorubaName?: string }) =>
      prisma.sacredCalendarEvent
        .create({
          data: {
            title: `Test ${key} ${stamp}`,
            description: 'Test event',
            createdBy: userId,
            date: new Date(data.date),
            endDate: data.endDate !== undefined ? new Date(data.endDate) : null,
            isActive: data.isActive ?? true,
            yorubaName: data.yorubaName,
          },
        })
        .then((e) => (ids[key] = e.id));

    await make('upcoming', { date: now + 2 * DAY, yorubaName: 'Ọdún Ifá' });
    await make('underway', { date: now - DAY, endDate: now + DAY });
    await make('singleDayToday', { date: now - 60 * 60 * 1000 });
    await make('tooFar', { date: now + 10 * DAY });
    await make('ended', { date: now - 3 * DAY, endDate: now - DAY });
    await make('inactive', { date: now + DAY, isActive: false });
  });

  afterAll(async () => {
    // events and threads cascade from their creator/author
    await prisma.user.deleteMany({ where: { id: userId } });
    if (createdCategory) {
      await prisma.forumCategory.deleteMany({ where: { id: categoryId } });
    } else {
      await prisma.forumCategory.update({ where: { id: categoryId }, data: { threadCount: originalThreadCount } });
    }
    await app.close();
  });

  const inSeason = ['upcoming', 'underway', 'singleDayToday'];
  const outOfSeason = ['tooFar', 'ended', 'inactive'];

  it('creates one gathering thread only for events that are near or underway', async () => {
    await reminders.createGatheringThreads();

    const events = await prisma.sacredCalendarEvent.findMany({ where: { id: { in: Object.values(ids) } } });
    const byId = new Map(events.map((e) => [e.id, e]));
    for (const key of inSeason) expect(byId.get(ids[key])?.gatheringThreadId).toBeTruthy();
    for (const key of outOfSeason) expect(byId.get(ids[key])?.gatheringThreadId).toBeNull();

    const upcomingThread = await prisma.forumThread.findUnique({ where: { id: byId.get(ids.upcoming)!.gatheringThreadId! } });
    expect(upcomingThread?.title).toMatch(/^Ọdún Ifá \(Test upcoming .*\) — Gathering$/);
    expect(upcomingThread?.categoryId).toBe(categoryId);
  });

  it('does not create a second thread when the job runs again', async () => {
    await reminders.createGatheringThreads();
    const threads = await prisma.forumThread.count({ where: { authorId: userId, tags: { has: 'gathering' } } });
    expect(threads).toBe(inSeason.length);
  });

  it('serves the in-season events with their threads, publicly', async () => {
    const res = await request(app.getHttpServer()).get('/forum/seasonal-highlights').expect(200);
    const ours = (res.body as { id: string; thread: { id: string } }[]).filter((h) => Object.values(ids).includes(h.id));

    expect(ours.map((h) => h.id).sort()).toEqual(inSeason.map((k) => ids[k]).sort());
    for (const h of ours) expect(h.thread.id).toBeTruthy();
  });

  it('drops an event from the highlights once its thread is deleted', async () => {
    const event = await prisma.sacredCalendarEvent.findUnique({ where: { id: ids.underway } });
    await prisma.forumThread.update({ where: { id: event!.gatheringThreadId! }, data: { status: 'DELETED' } });

    const res = await request(app.getHttpServer()).get('/forum/seasonal-highlights').expect(200);
    expect((res.body as { id: string }[]).map((h) => h.id)).not.toContain(ids.underway);
  });
});
