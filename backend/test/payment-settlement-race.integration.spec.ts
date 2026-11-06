/**
 * A provider-confirmed payment is settled exactly once, however many routes
 * try at the same moment: the Flutterwave webhook (and its retries) and an
 * admin's manual verification all go through settleConfirmedPayment, which
 * claims the Payment row in one conditional write (November 6, 2026).
 *
 * Flutterwave's API is stubbed; the webhook's verif-hash is real.
 * Run: npm run test:integration
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import { FlutterwaveApiService } from '../src/payments/flutterwave-api.service';
import { UserRole } from '@ile-ase/common';

describe('Payment settlement race', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];
  const hash = process.env.FLUTTERWAVE_SECRET_HASH!;
  const ref = `ILEASE_race_${Date.now()}`;
  const tx = { id: 4242, status: 'successful', tx_ref: ref, amount: 7500, currency: 'NGN' };
  let member: string;
  let finance: string;

  const http = () => request(app.getHttpServer());

  async function newUser(adminSubRole?: string) {
    const email = `race-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
    const res = await http().post('/auth/register').send({ email, password: 'SecurePassword123!', name: 'Race Test', role: UserRole.CLIENT }).expect(201);
    userIds.push(res.body.user.id);
    if (!adminSubRole) return { id: res.body.user.id as string, token: res.body.accessToken as string };
    await prisma.user.update({ where: { id: res.body.user.id }, data: { role: 'ADMIN', adminSubRole } });
    const login = await http().post('/auth/login').send({ email, password: 'SecurePassword123!' }).expect(200);
    return { id: res.body.user.id as string, token: login.body.accessToken as string };
  }

  beforeAll(async () => {
    if (!hash) throw new Error('FLUTTERWAVE_SECRET_HASH must be set for this suite');
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(FlutterwaveApiService)
      .useValue({
        isConfigured: () => true,
        verifyById: async () => ({ status: 'success', data: tx }),
        verifyByReference: async () => ({ status: 'success', data: tx }),
      })
      .compile();
    app = moduleFixture.createNestApplication({ rawBody: true });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    member = (await newUser()).id;
    finance = (await newUser('FINANCE')).token;
    await prisma.payment.create({
      data: { userId: member, transactionId: ref, amount: 7500, currency: 'NGN', purpose: 'WALLET_TOPUP', provider: 'FLUTTERWAVE', status: 'PENDING', metadata: { userId: member } },
    });
  });

  afterAll(async () => {
    await prisma.outboxEvent.deleteMany({ where: { payload: { path: ['userId'], equals: member } } }).catch(() => undefined);
    await prisma.transaction.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.wallet.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.payment.deleteMany({ where: { transactionId: ref } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('credits the wallet once when webhooks and an admin verification arrive together', async () => {
    const webhook = { event: 'charge.completed', data: { id: tx.id, status: 'successful', tx_ref: ref, amount: 7500, currency: 'NGN' } };
    const results = await Promise.all([
      http().post('/payments/webhook/flutterwave').set('verif-hash', hash).send(webhook),
      http().post('/payments/webhook/flutterwave').set('verif-hash', hash).send(webhook),
      http().post(`/admin/payments/verify/${ref}`).set('Authorization', `Bearer ${finance}`),
      http().post('/payments/webhook/flutterwave').set('verif-hash', hash).send(webhook),
    ]);
    for (const r of results) expect(r.status).toBeLessThan(300);

    const credits = await prisma.transaction.findMany({ where: { userId: member } });
    expect(credits).toHaveLength(1);
    expect(Number(credits[0].amount)).toBe(7500);
    const wallet = await prisma.wallet.findFirst({ where: { userId: member } });
    expect(Number(wallet?.balance)).toBe(7500);
    expect(await prisma.payment.findUnique({ where: { transactionId: ref } })).toMatchObject({ status: 'success', verified: true });
  });

  it('only finance, compliance and super admins can verify payments', async () => {
    const moderator = (await newUser('MODERATOR')).token;
    await http().post(`/admin/payments/verify/${ref}`).set('Authorization', `Bearer ${moderator}`).expect(403);
    await http().get('/admin/payments/unverified').set('Authorization', `Bearer ${moderator}`).expect(403);
  });
});
