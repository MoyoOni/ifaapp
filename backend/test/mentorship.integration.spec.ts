/**
 * Paid mentorship sessions end to end (SHOP_BACKLOG.md MSP-023), through the
 * real HTTP stack, a real wallet/escrow and signed Paystack webhooks.
 *
 * Owner's decisions (October 30, 2026): verified babalawos sell, Devoted
 * members book; booked and paid here, held elsewhere; 0% platform cut.
 *
 * Run: npm run test:integration
 */
import * as crypto from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole } from '@ile-ase/common';

describe('Mentorship sessions', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];
  let babalawo: { id: string; token: string };
  let devoted: { id: string; token: string };
  let free: { id: string; token: string };
  let offeringId: string;

  const http = () => request(app.getHttpServer());
  const as = (u: { token: string }) => ({ Authorization: `Bearer ${u.token}` });

  async function newUser(role: UserRole, data: Record<string, unknown> = {}) {
    const res = await http()
      .post('/auth/register')
      .send({ email: `mentor-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`, password: 'SecurePassword123!', name: 'Mentorship Test', role })
      .expect(201);
    userIds.push(res.body.user.id);
    if (Object.keys(data).length) await prisma.user.update({ where: { id: res.body.user.id }, data });
    return { id: res.body.user.id as string, token: res.body.accessToken as string };
  }

  // What initializePayment records, then Paystack's signed confirmation.
  async function pay(bookingId: string, chargedKobo: number) {
    const booking = await prisma.mentorshipBooking.findUniqueOrThrow({ where: { id: bookingId } });
    const reference = `MENTOR_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const metadata = { userId: booking.clientId, purpose: 'MENTORSHIP_SESSION', relatedId: bookingId };
    await prisma.payment.create({
      data: { userId: booking.clientId, transactionId: reference, amount: booking.amount, currency: 'NGN', purpose: 'MENTORSHIP_SESSION', provider: 'PAYSTACK', status: 'PENDING', metadata },
    });
    const body = JSON.stringify({ event: 'charge.success', data: { reference, amount: chargedKobo, currency: 'NGN', status: 'success', metadata } });
    const signature = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY as string).update(body).digest('hex');
    await http().post('/payments/webhook/paystack').set('Content-Type', 'application/json').set('x-paystack-signature', signature).send(body).expect(200);
  }

  const balance = async (userId: string) => Number((await prisma.wallet.findFirst({ where: { userId } }))?.balance ?? 0);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication({ rawBody: true });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);

    babalawo = await newUser(UserRole.BABALAWO, { verified: true });
    devoted = await newUser(UserRole.CLIENT, { subscriptionStatus: 'DEVOTED' });
    await prisma.subscription.create({
      data: { userId: devoted.id, plan: 'QUARTERLY', status: 'ACTIVE', startDate: new Date(), endDate: new Date(Date.now() + 90 * 86400000), amountPaid: 2500000 },
    });
    free = await newUser(UserRole.CLIENT);

    const offering = await http()
      .post(`/babalawo/${babalawo.id}/service-offerings`)
      .set(as(babalawo))
      .send({ name: 'Two guidance readings', description: 'Two 30-minute sessions', category: 'Guidance', durationMinutes: 30, priceAmount: 20000, isMentorship: true, sessionCount: 2 })
      .expect(201);
    offeringId = offering.body.id;
  });

  afterAll(async () => {
    await prisma.escrow.deleteMany({ where: { recipientId: babalawo.id } });
    await prisma.payment.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.mentorshipBooking.deleteMany({ where: { babalawoId: babalawo.id } });
    await prisma.serviceOffering.deleteMany({ where: { babalawoId: babalawo.id } });
    await prisma.transaction.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.subscription.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.wallet.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('lists the offering, and lets only a Devoted member book it', async () => {
    const list = await http().get('/mentorship/offerings').set(as(free)).expect(200);
    expect(list.body.map((o: { id: string }) => o.id)).toContain(offeringId);
    await http().post('/mentorship/bookings').set(as(free)).send({ offeringId }).expect(403);
  });

  it('pays the babalawo the full price once both sessions are confirmed', async () => {
    const booked = await http().post('/mentorship/bookings').set(as(devoted)).send({ offeringId, note: 'Clarity on my path' }).expect(201);
    expect(Number(booked.body.amount)).toBe(20000);

    // Paystack charging less than the price does not count as paid.
    await pay(booked.body.id, 100);
    expect((await prisma.mentorshipBooking.findUniqueOrThrow({ where: { id: booked.body.id } })).status).toBe('PENDING_PAYMENT');

    await pay(booked.body.id, 2_000_000);
    expect((await prisma.mentorshipBooking.findUniqueOrThrow({ where: { id: booked.body.id } })).status).toBe('PAID');

    await http().patch(`/mentorship/bookings/${booked.body.id}/meeting`).set(as(babalawo)).send({ meetingLink: 'https://wa.me/2348012345678', meetingDetails: 'Saturday 10am WAT' }).expect(200);
    const mine = await http().get('/mentorship/bookings').set(as(devoted)).expect(200);
    expect(mine.body.find((b: { id: string }) => b.id === booked.body.id)).toMatchObject({ meetingLink: 'https://wa.me/2348012345678' });

    // Nothing to confirm until the babalawo marks a session held.
    await http().post(`/mentorship/bookings/${booked.body.id}/sessions/confirm`).set(as(devoted)).expect(400);
    // The babalawo can't confirm on the client's behalf.
    await http().post(`/mentorship/bookings/${booked.body.id}/sessions/held`).set(as(babalawo)).expect(201);
    await http().post(`/mentorship/bookings/${booked.body.id}/sessions/confirm`).set(as(babalawo)).expect(404);

    const before = await balance(babalawo.id);
    await http().post(`/mentorship/bookings/${booked.body.id}/sessions/confirm`).set(as(devoted)).expect(201);
    expect(await balance(babalawo.id)).toBe(before); // one of two sessions: not yet

    await http().post(`/mentorship/bookings/${booked.body.id}/sessions/held`).set(as(babalawo)).expect(201);
    const done = await http().post(`/mentorship/bookings/${booked.body.id}/sessions/confirm`).set(as(devoted)).expect(201);
    expect(done.body.status).toBe('COMPLETED');
    expect(await balance(babalawo.id)).toBe(before + 20000); // 0% platform commission
  });

  it('refunds a paid booking to the client when the babalawo cancels before any session', async () => {
    const booked = await http().post('/mentorship/bookings').set(as(devoted)).send({ offeringId }).expect(201);
    await pay(booked.body.id, 2_000_000);
    const before = await balance(devoted.id);

    await http().post(`/mentorship/bookings/${booked.body.id}/cancel`).set(as(babalawo)).expect(201);

    expect((await prisma.mentorshipBooking.findUniqueOrThrow({ where: { id: booked.body.id } })).status).toBe('CANCELLED');
    expect(await balance(devoted.id)).toBe(before + 20000);
  });
});
