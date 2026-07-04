/**
 * V4-807: Payment Idempotency Integration Tests
 * Verifies the Paystack/Flutterwave webhook handlers dedupe payment
 * notifications by gateway reference and never double-credit a wallet.
 *
 * P1-03 rewrite: this file previously drove POST /api/wallet/deposit, a
 * direct client-callable deposit route that was permanently removed in
 * EMG-01 (money only ever enters a wallet via a verified payment-gateway
 * webhook now). Idempotency is now tested through the actual current path:
 * POST /payments/webhook/paystack, which requires a valid HMAC-SHA512
 * `x-paystack-signature` (EMG-02) and dedupes via a `paystack:<reference>`
 * idempotency key on the Transaction row (EMG-03).
 *
 * Run: npm run test:integration
 * Requires: Postgres at DATABASE_URL, PAYSTACK_SECRET_KEY, FLUTTERWAVE_SECRET_HASH in .env
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as crypto from 'crypto';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import { Currency } from '@ile-ase/common';

describe('Payment Idempotency Critical-Path Tests (V4-807)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY!;

  const TEST_EMAIL = `payment-test-${Date.now()}@example.com`;
  const TEST_PASSWORD = 'SecurePassword123!';

  let userId: string;

  function signPaystackPayload(payload: unknown): string {
    return crypto
      .createHmac('sha512', paystackSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  function paystackChargeSuccess(reference: string, amountNaira: number, currency = Currency.NGN) {
    return {
      event: 'charge.success',
      data: {
        reference,
        amount: amountNaira * 100, // Paystack sends amounts in kobo
        currency,
        metadata: { userId },
      },
    };
  }

  beforeAll(async () => {
    if (!paystackSecret) {
      throw new Error('PAYSTACK_SECRET_KEY must be set in the environment for this suite to run');
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }));
    app.useGlobalFilters(new GlobalExceptionFilter());

    await app.init();
    prisma = app.get(PrismaService);

    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: 'Payment Test User',
        role: 'CLIENT',
      });

    userId = registerRes.body.user.id;
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany({ where: { userId } });
    await prisma.wallet.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await app.close();
  });

  describe('Webhook signature verification (EMG-02)', () => {
    it('rejects a webhook with a missing signature', async () => {
      const response = await request(app.getHttpServer())
        .post('/payments/webhook/paystack')
        .send(paystackChargeSuccess('NO-SIG-' + Date.now(), 100));

      expect(response.status).toBe(401);
    });

    it('rejects a webhook with an invalid signature', async () => {
      const response = await request(app.getHttpServer())
        .post('/payments/webhook/paystack')
        .set('x-paystack-signature', 'not-the-real-signature')
        .send(paystackChargeSuccess('BAD-SIG-' + Date.now(), 100));

      expect(response.status).toBe(401);
    });
  });

  describe('Idempotent replay by gateway reference (EMG-03)', () => {
    it('credits the wallet exactly once when the same reference is delivered twice', async () => {
      const reference = 'IDEM-' + Date.now();
      const payload = paystackChargeSuccess(reference, 500);
      const signature = signPaystackPayload(payload);

      const response1 = await request(app.getHttpServer())
        .post('/payments/webhook/paystack')
        .set('x-paystack-signature', signature)
        .send(payload)
        .expect(200);

      expect(response1.body).toMatchObject({ success: true, reference });

      // Simulate Paystack retrying the same webhook delivery (e.g. after a
      // timeout on our end) with an identical, identically-signed payload.
      const response2 = await request(app.getHttpServer())
        .post('/payments/webhook/paystack')
        .set('x-paystack-signature', signature)
        .send(payload)
        .expect(200);

      expect(response2.body).toMatchObject({ success: true, reference });

      const transactions = await prisma.transaction.findMany({
        where: { userId, reference },
      });
      // Only one Transaction row for this reference — the replay didn't create a second.
      expect(transactions).toHaveLength(1);
      expect(transactions[0].idempotencyKey).toBe(`paystack:${reference}`);
      expect(transactions[0].status).toBe('COMPLETED');
    });

    it('creates separate transactions for different references', async () => {
      const reference1 = 'REF-1-' + Date.now();
      const reference2 = 'REF-2-' + Date.now();

      const payload1 = paystackChargeSuccess(reference1, 250);
      await request(app.getHttpServer())
        .post('/payments/webhook/paystack')
        .set('x-paystack-signature', signPaystackPayload(payload1))
        .send(payload1)
        .expect(200);

      const payload2 = paystackChargeSuccess(reference2, 250);
      await request(app.getHttpServer())
        .post('/payments/webhook/paystack')
        .set('x-paystack-signature', signPaystackPayload(payload2))
        .send(payload2)
        .expect(200);

      const tx1 = await prisma.transaction.findFirst({ where: { userId, reference: reference1 } });
      const tx2 = await prisma.transaction.findFirst({ where: { userId, reference: reference2 } });

      expect(tx1).toBeDefined();
      expect(tx2).toBeDefined();
      expect(tx1!.id).not.toBe(tx2!.id);
    });

    it('reflects only one deposit in the wallet balance after a retried webhook', async () => {
      const wallet = await prisma.wallet.findUnique({ where: { userId } });
      const balanceBefore = wallet?.balance ?? 0;

      const reference = 'BALANCE-CHECK-' + Date.now();
      const payload = paystackChargeSuccess(reference, 300);
      const signature = signPaystackPayload(payload);

      await request(app.getHttpServer())
        .post('/payments/webhook/paystack')
        .set('x-paystack-signature', signature)
        .send(payload)
        .expect(200);

      // Retry with the identical signed payload.
      await request(app.getHttpServer())
        .post('/payments/webhook/paystack')
        .set('x-paystack-signature', signature)
        .send(payload)
        .expect(200);

      const walletAfter = await prisma.wallet.findUnique({ where: { userId } });
      expect(walletAfter!.balance).toBe(balanceBefore + 300);
    });
  });

  describe('Referential integrity', () => {
    it('links the webhook-created transaction to the correct user and wallet', async () => {
      const reference = 'INTEGRITY-' + Date.now();
      const payload = paystackChargeSuccess(reference, 150);

      await request(app.getHttpServer())
        .post('/payments/webhook/paystack')
        .set('x-paystack-signature', signPaystackPayload(payload))
        .send(payload)
        .expect(200);

      const transaction = await prisma.transaction.findFirst({ where: { userId, reference } });
      const wallet = await prisma.wallet.findUnique({ where: { userId } });

      expect(transaction).toBeDefined();
      expect(transaction!.userId).toBe(userId);
      expect(transaction!.walletId).toBe(wallet!.id);
      expect(wallet!.userId).toBe(userId);
    });
  });
});
