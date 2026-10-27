/**
 * V8-305: attendance XP, through the real HTTP stack and database -- the
 * Devoted 2x multiplier lives in UsersService.awardXP and the award-once
 * guard is a conditional update, neither of which a mocked test can prove.
 *
 * Run: npm run test:integration
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import { EventsService } from '../src/events/events.service';
import { UserRole } from '@ile-ase/common';

describe('Event attendance XP (PATCH /events/:id/attendees/:userId/attendance)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];
  let organizer: { id: string; token: string };
  let freeMember: { id: string; token: string };
  let devotedMember: { id: string; token: string };
  let eventId: string;

  async function newUser() {
    const email = `attend-xp-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'SecurePassword123!', name: 'Attendance Test', role: UserRole.CLIENT })
      .expect(201);
    userIds.push(res.body.user.id);
    return { id: res.body.user.id as string, token: res.body.accessToken as string };
  }

  const mark = (userId: string, attended: boolean, token = organizer.token) =>
    request(app.getHttpServer())
      .patch(`/events/${eventId}/attendees/${userId}/attendance`)
      .set('Authorization', `Bearer ${token}`)
      .send({ attended });

  const xpOf = async (id: string) => (await prisma.user.findUnique({ where: { id } }))!.rankXP ?? 0;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);

    organizer = await newUser();
    freeMember = await newUser();
    devotedMember = await newUser();
    await prisma.user.update({ where: { id: devotedMember.id }, data: { subscriptionStatus: 'DEVOTED' } });

    const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    eventId = (
      await prisma.event.create({
        data: {
          title: 'Attendance test',
          slug: `attend-xp-${stamp}`,
          creatorId: organizer.id,
          type: 'CEREMONY',
          startDate: new Date(Date.now() - 2 * 3_600_000),
          published: true,
        },
      })
    ).id;
    for (const m of [freeMember, devotedMember, organizer]) {
      await prisma.eventRegistration.create({ data: { eventId, userId: m.id } });
    }
  });

  afterAll(async () => {
    // events and registrations cascade from their creator/user
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('awards attendance XP, doubled for a Devoted member', async () => {
    const freeBefore = await xpOf(freeMember.id);
    const devotedBefore = await xpOf(devotedMember.id);

    await mark(freeMember.id, true).expect(200);
    await mark(devotedMember.id, true).expect(200);

    expect((await xpOf(freeMember.id)) - freeBefore).toBe(EventsService.ATTENDANCE_XP);
    expect((await xpOf(devotedMember.id)) - devotedBefore).toBe(EventsService.ATTENDANCE_XP * 2);
    const reg = await prisma.eventRegistration.findUnique({ where: { eventId_userId: { eventId, userId: freeMember.id } } });
    expect(reg?.status).toBe('ATTENDED');
    expect(reg?.attendedAt).toBeTruthy();
  });

  it('never awards twice, even after unmarking and re-marking', async () => {
    const before = await xpOf(freeMember.id);
    await mark(freeMember.id, false).expect(200);
    await mark(freeMember.id, true).expect(200);
    await mark(freeMember.id, true).expect(200);
    expect(await xpOf(freeMember.id)).toBe(before);
  });

  it('shows attendance in the organizer’s attendee list', async () => {
    const res = await request(app.getHttpServer())
      .get(`/events/${eventId}/attendees`)
      .set('Authorization', `Bearer ${organizer.token}`)
      .expect(200);
    const free = res.body.attendees.find((a: { userId: string }) => a.userId === freeMember.id);
    expect(free.status).toBe('ATTENDED');
    expect(free.attendedAt).toBeTruthy();
  });

  it('refuses members marking each other, and organizers marking themselves', async () => {
    await mark(devotedMember.id, true, freeMember.token).expect(403);
    await mark(organizer.id, true).expect(403);
  });
});
