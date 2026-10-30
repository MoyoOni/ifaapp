/**
 * A marketplace order is only marked PAID when the money for it actually
 * arrived, through the real HTTP stack and signed Paystack webhooks.
 *
 * Until October 30, 2026 the client chose the amount to charge, and the
 * webhook marked every order named in the payment PAID and escrowed its full
 * total for the vendor without comparing what Paystack charged: a ₦1 payment
 * settled a ₦16,125 order (reproduced locally).
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

describe('Marketplace payment amount', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];
  let vendorUser: { id: string; token: string };
  let buyer: { id: string; token: string };
  let vendorId: string;
  let productId: string;

  const http = () => request(app.getHttpServer());
  const as = (u: { token: string }) => ({ Authorization: `Bearer ${u.token}` });

  async function newUser(role: UserRole) {
    const res = await http()
      .post('/auth/register')
      .send({ email: `payamt-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`, password: 'SecurePassword123!', name: 'Payment Test', role })
      .expect(201);
    userIds.push(res.body.user.id);
    return { id: res.body.user.id as string, token: res.body.accessToken as string };
  }

  async function pendingOrder() {
    const res = await http()
      .post('/marketplace/orders')
      .set(as(buyer))
      .send({ vendorId, items: [{ productId, quantity: 1 }], shippingAddress: 'Lagos', shippingCountry: 'Nigeria' })
      .expect(201);
    return prisma.order.findUniqueOrThrow({ where: { id: res.body.id } });
  }

  // What initializePayment now records: the orders' real total.
  async function paymentFor(orderId: string, amount: number) {
    const reference = `PAYAMT_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const metadata = { userId: buyer.id, purpose: 'MARKETPLACE_ORDER', relatedId: orderId };
    await prisma.payment.create({
      data: { userId: buyer.id, transactionId: reference, amount, currency: 'NGN', purpose: 'MARKETPLACE_ORDER', provider: 'PAYSTACK', status: 'PENDING', metadata },
    });
    return { reference, metadata };
  }

  function webhook(reference: string, metadata: object, chargedKobo: number) {
    const body = JSON.stringify({ event: 'charge.success', data: { reference, amount: chargedKobo, currency: 'NGN', status: 'success', metadata } });
    const signature = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY as string).update(body).digest('hex');
    return http().post('/payments/webhook/paystack').set('Content-Type', 'application/json').set('x-paystack-signature', signature).send(body);
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication({ rawBody: true });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);

    vendorUser = await newUser(UserRole.VENDOR);
    buyer = await newUser(UserRole.CLIENT);
    vendorId = (await prisma.vendor.create({ data: { userId: vendorUser.id, businessName: 'Payment Shop', status: 'APPROVED' } })).id;
    const product = await http()
      .post('/marketplace/products')
      .set(as(vendorUser))
      .send({ name: 'Opele', category: 'sacred-ritual', description: 'Hand-made opele', price: 15000, stock: 10, images: ['https://example.com/o.jpg'] })
      .expect(201);
    productId = product.body.id;
  });

  afterAll(async () => {
    await prisma.escrow.deleteMany({ where: { recipientId: vendorUser.id } });
    await prisma.payment.deleteMany({ where: { userId: buyer.id } });
    await prisma.order.deleteMany({ where: { vendorId } });
    await prisma.product.deleteMany({ where: { vendorId } });
    await prisma.vendor.deleteMany({ where: { id: vendorId } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('leaves the order unpaid, with no vendor escrow, when Paystack charged less than the order costs', async () => {
    const order = await pendingOrder();
    const { reference, metadata } = await paymentFor(order.id, Number(order.totalAmount));

    await webhook(reference, metadata, 100); // ₦1

    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe('PENDING');
    expect(await prisma.escrow.count({ where: { relatedId: order.id } })).toBe(0);
    expect((await prisma.payment.findUniqueOrThrow({ where: { transactionId: reference } })).status).toBe('amount_mismatch');
  });

  it('marks the order paid and escrows it when the full amount arrives', async () => {
    const order = await pendingOrder();
    const { reference, metadata } = await paymentFor(order.id, Number(order.totalAmount));

    await webhook(reference, metadata, Math.round(Number(order.totalAmount) * 100)).expect(200);

    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe('PAID');
    const escrow = await prisma.escrow.findFirstOrThrow({ where: { relatedId: order.id } });
    expect(Number(escrow.amount)).toBe(Number(order.totalAmount));
  });
});
