/**
 * FOR-019 storytelling events (owner decision November 2, 2026): live
 * sessions of kind STORYTELLING, with RSVPs, whose story an admin can save
 * into the Oral History archive as an unpublished draft.
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

describe('Storytelling sessions', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];
  const sessionIds: string[] = [];
  let admin: string;
  let member: string;

  const http = () => request(app.getHttpServer());
  const as = (t: string) => ({ Authorization: `Bearer ${t}` });

  async function token(makeAdmin = false) {
    const email = `story-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
    const res = await http().post('/auth/register').send({ email, password: 'SecurePassword123!', name: 'Story Test', role: UserRole.CLIENT }).expect(201);
    userIds.push(res.body.user.id);
    if (!makeAdmin) return res.body.accessToken as string;
    await prisma.user.update({ where: { id: res.body.user.id }, data: { role: 'ADMIN' } });
    return (await http().post('/auth/login').send({ email, password: 'SecurePassword123!' }).expect(200)).body.accessToken as string;
  }

  async function schedule(kind?: string) {
    const res = await http()
      .post('/forum/live-sessions')
      .set(as(admin))
      .send({ title: 'Ìtàn alẹ́: evening stories', scheduledAt: new Date(Date.now() + 86400000).toISOString(), platform: 'ZOOM', externalUrl: 'https://zoom.us/j/1', description: 'Stories of Ọ̀rúnmìlà', ...(kind ? { kind } : {}) })
      .expect(201);
    sessionIds.push(res.body.id);
    return res.body;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    admin = await token(true);
    member = await token();
  });

  afterAll(async () => {
    const sessions = await prisma.liveSession.findMany({ where: { id: { in: sessionIds } }, select: { oralHistoryId: true } });
    await prisma.oralHistoryEntry.deleteMany({ where: { id: { in: sessions.map((s) => s.oralHistoryId).filter((x): x is string => !!x) } } });
    await prisma.liveSession.deleteMany({ where: { id: { in: sessionIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('lists storytelling events publicly with RSVP counts, and lets a member RSVP and change their mind', async () => {
    const story = await schedule('STORYTELLING');
    const discussion = await schedule();

    const listed = await http().get('/forum/live-sessions?kind=STORYTELLING').expect(200);
    const ids = listed.body.map((s: { id: string }) => s.id);
    expect(ids).toContain(story.id);
    expect(ids).not.toContain(discussion.id);

    expect((await http().post(`/forum/live-sessions/${story.id}/rsvp`).set(as(member)).expect(201)).body).toEqual({ attending: true, count: 1 });
    expect((await http().get('/forum/live-sessions/my-rsvps').set(as(member)).expect(200)).body).toContain(story.id);
    const again = await http().get('/forum/live-sessions?kind=STORYTELLING').expect(200);
    expect(again.body.find((s: { id: string }) => s.id === story.id)._count.rsvps).toBe(1);
    expect((await http().post(`/forum/live-sessions/${story.id}/rsvp`).set(as(member)).expect(201)).body).toEqual({ attending: false, count: 0 });

    await http().patch(`/forum/live-sessions/${story.id}/status`).set(as(admin)).send({ status: 'ENDED' }).expect(200);
    await http().post(`/forum/live-sessions/${story.id}/rsvp`).set(as(member)).expect(400);
  });

  it('saves the story told into the archive as an unpublished draft, once, and only for storytelling events', async () => {
    const story = await schedule('STORYTELLING');
    const discussion = await schedule();
    const body = { title: 'How Ọ̀rúnmìlà came to Ifẹ̀', content: 'As it was told by the elder that evening, long ago ...', storyteller: 'Bàbá Fálànà' };

    await http().post(`/forum/live-sessions/${story.id}/story`).set(as(member)).send(body).expect(403);
    const saved = await http().post(`/forum/live-sessions/${story.id}/story`).set(as(admin)).send(body).expect(201);
    expect(saved.body).toMatchObject({ title: body.title, babalawoName: 'Bàbá Fálànà', category: 'storytelling-events', publishedAt: null, tags: ['storytelling'] });
    expect((await prisma.liveSession.findUniqueOrThrow({ where: { id: story.id } })).oralHistoryId).toBe(saved.body.id);

    await http().post(`/forum/live-sessions/${story.id}/story`).set(as(admin)).send(body).expect(409);
    await http().post(`/forum/live-sessions/${discussion.id}/story`).set(as(admin)).send(body).expect(400);
  });
});
