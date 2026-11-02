/**
 * Escrow policy (October 31, 2026), through the real HTTP stack, a real
 * wallet/escrow and signed Paystack webhooks.
 *
 * Before this: the person being paid could release an escrow to themselves
 * (PATCH /wallet/:id/escrow/release, or a vendor marking an order DELIVERED);
 * a customer could mark their own order PAID; and every escrow refunded the
 * buyer 14 days after payment even after the vendor had shipped, because
 * nothing ever released on `autoReleaseAt`.
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
import { WalletService } from '../src/wallet/wallet.service';
import { UserRole } from '@ile-ase/common';

describe('Escrow policy', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let wallet: WalletService;
  const userIds: string[] = [];
  let vendorUser: { id: string; token: string };
  let buyer: { id: string; token: string };
  let vendorId: string;
  let productId: string;

  const http = () => request(app.getHttpServer());
  const as = (u: { token: string }) => ({ Authorization: `Bearer ${u.token}` });
  const balance = async (userId: string) => Number((await prisma.wallet.findFirst({ where: { userId } }))?.balance ?? 0);

  async function newUser(role: UserRole) {
    const res = await http()
      .post('/auth/register')
      .send({ email: `escrowpol-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`, password: 'SecurePassword123!', name: 'Escrow Test', role })
      .expect(201);
    userIds.push(res.body.user.id);
    return { id: res.body.user.id as string, token: res.body.accessToken as string };
  }

  async function paidOrder() {
    const res = await http()
      .post('/marketplace/orders')
      .set(as(buyer))
      .send({ vendorId, items: [{ productId, quantity: 1 }], shippingAddress: 'Lagos', shippingCountry: 'Nigeria' })
      .expect(201);
    const order = await prisma.order.findUniqueOrThrow({ where: { id: res.body.id } });
    const reference = `ESCPOL_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const metadata = { userId: buyer.id, purpose: 'MARKETPLACE_ORDER', relatedId: order.id };
    await prisma.payment.create({
      data: { userId: buyer.id, transactionId: reference, amount: Number(order.totalAmount), currency: 'NGN', purpose: 'MARKETPLACE_ORDER', provider: 'PAYSTACK', status: 'PENDING', metadata },
    });
    const body = JSON.stringify({ event: 'charge.success', data: { reference, amount: Math.round(Number(order.totalAmount) * 100), currency: 'NGN', status: 'success', metadata } });
    const signature = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY as string).update(body).digest('hex');
    await http().post('/payments/webhook/paystack').set('Content-Type', 'application/json').set('x-paystack-signature', signature).send(body).expect(200);
    const escrow = await prisma.escrow.findFirstOrThrow({ where: { relatedId: order.id } });
    return { order, escrow };
  }

  // The tier-1 release on SHIPPED is fire-and-forget; wait for it.
  async function settle(escrowId: string, status: string) {
    for (let i = 0; i < 50; i++) {
      if ((await prisma.escrow.findUniqueOrThrow({ where: { id: escrowId } })).status === status) return;
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication({ rawBody: true });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    wallet = app.get(WalletService);

    vendorUser = await newUser(UserRole.VENDOR);
    buyer = await newUser(UserRole.CLIENT);
    vendorId = (await prisma.vendor.create({ data: { userId: vendorUser.id, businessName: 'Escrow Shop', status: 'APPROVED' } })).id;
    const product = await http()
      .post('/marketplace/products')
      .set(as(vendorUser))
      .send({ name: 'Ìbò', category: 'sacred-ritual', description: 'Divination set', price: 10000, stock: 10, images: ['https://example.com/i.jpg'] })
      .expect(201);
    productId = product.body.id;
  });

  afterAll(async () => {
    await prisma.returnRequest.deleteMany({ where: { order: { vendorId } } });
    await prisma.escrow.deleteMany({ where: { recipientId: vendorUser.id } });
    await prisma.payment.deleteMany({ where: { userId: buyer.id } });
    await prisma.order.deleteMany({ where: { vendorId } });
    await prisma.product.deleteMany({ where: { vendorId } });
    await prisma.vendor.deleteMany({ where: { id: vendorId } });
    await prisma.transaction.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.wallet.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('does not let the vendor release the escrow, or mark the order delivered, or the buyer mark an order paid', async () => {
    const { order, escrow } = await paidOrder();

    await http().patch(`/wallet/${vendorUser.id}/escrow/release`).set(as(vendorUser)).send({ escrowId: escrow.id }).expect(403);
    await http().patch(`/marketplace/orders/${order.id}`).set(as(vendorUser)).send({ status: 'DELIVERED' }).expect(403);
    expect((await prisma.escrow.findUniqueOrThrow({ where: { id: escrow.id } })).status).toBe('HOLD');

    const unpaid = await http()
      .post('/marketplace/orders')
      .set(as(buyer))
      .send({ vendorId, items: [{ productId, quantity: 1 }], shippingAddress: 'Lagos', shippingCountry: 'Nigeria' })
      .expect(201);
    await http().patch(`/marketplace/orders/${unpaid.body.id}`).set(as(buyer)).send({ status: 'PAID' }).expect(403);
  });

  it('pays the vendor half on shipping and the rest when the buyer confirms delivery', async () => {
    const { order, escrow } = await paidOrder();
    const before = await balance(vendorUser.id);

    await http().patch(`/marketplace/orders/${order.id}`).set(as(vendorUser)).send({ status: 'SHIPPED', trackingNumber: 'NIPOST123' }).expect(200);
    await settle(escrow.id, 'PARTIALLY_RELEASED');
    const shipped = await prisma.escrow.findUniqueOrThrow({ where: { id: escrow.id } });
    expect(shipped.autoReleaseAt).not.toBeNull(); // the buyer's 14 days to confirm have started
    expect(shipped.expiryDate).toBeNull(); // and it no longer refunds on expiry
    const afterShip = await balance(vendorUser.id);
    expect(afterShip).toBeGreaterThan(before);

    await http().patch(`/marketplace/orders/${order.id}`).set(as(buyer)).send({ status: 'DELIVERED' }).expect(200);
    await settle(escrow.id, 'RELEASED');
    expect(await balance(vendorUser.id)).toBeCloseTo(afterShip * 2 - before, 2);
  });

  it('releases the rest to the vendor when the buyer stays silent past the deadline, and does not refund the buyer', async () => {
    const { order, escrow } = await paidOrder();
    await http().patch(`/marketplace/orders/${order.id}`).set(as(vendorUser)).send({ status: 'SHIPPED' }).expect(200);
    await settle(escrow.id, 'PARTIALLY_RELEASED');
    const buyerBefore = await balance(buyer.id);
    const vendorBefore = await balance(vendorUser.id);

    // The deadline passes; both daily/hourly jobs run.
    await prisma.escrow.update({ where: { id: escrow.id }, data: { autoReleaseAt: new Date(Date.now() - 1000) } });
    await wallet.expireEscrows();
    await wallet.autoReleaseEscrows();

    expect((await prisma.escrow.findUniqueOrThrow({ where: { id: escrow.id } })).status).toBe('RELEASED');
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe('DELIVERED');
    expect(await balance(vendorUser.id)).toBeGreaterThan(vendorBefore);
    expect(await balance(buyer.id)).toBe(buyerBefore);
  });

  it('does not auto-release while the buyer has a return open', async () => {
    const { order, escrow } = await paidOrder();
    await http().patch(`/marketplace/orders/${order.id}`).set(as(vendorUser)).send({ status: 'SHIPPED' }).expect(200);
    await settle(escrow.id, 'PARTIALLY_RELEASED');
    await http().post(`/marketplace/orders/${order.id}/return`).set(as(buyer)).send({ reasonCategory: 'NOT_AS_DESCRIBED', reason: 'Wrong item sent' }).expect(201);

    await prisma.escrow.update({ where: { id: escrow.id }, data: { autoReleaseAt: new Date(Date.now() - 1000) } });
    await wallet.autoReleaseEscrows();

    expect((await prisma.escrow.findUniqueOrThrow({ where: { id: escrow.id } })).status).toBe('PARTIALLY_RELEASED');
    await prisma.returnRequest.deleteMany({ where: { orderId: order.id } });
  });

  it('still refunds the buyer when the vendor never ships', async () => {
    const { order, escrow } = await paidOrder();
    const buyerBefore = await balance(buyer.id);

    await prisma.escrow.update({ where: { id: escrow.id }, data: { expiryDate: new Date(Date.now() - 1000) } });
    await wallet.autoReleaseEscrows();
    await wallet.expireEscrows();

    expect((await prisma.escrow.findUniqueOrThrow({ where: { id: escrow.id } })).status).toBe('EXPIRED');
    expect(await balance(buyer.id)).toBe(buyerBefore + Number(order.totalAmount));
  });
});
