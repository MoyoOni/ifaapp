/**
 * International orders and their customs declaration (SHOP_BACKLOG.md
 * MSP-009), through the real HTTP stack.
 *
 * Owner's scope (October 30, 2026): customs declaration only -- an order
 * leaving the vendor's country snapshots each item's customs details, and
 * the vendor can print a declaration for the parcel.
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

describe('Customs declaration', () => {
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
      .send({ email: `customs-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`, password: 'SecurePassword123!', name: 'Customs Test', role })
      .expect(201);
    userIds.push(res.body.user.id);
    return { id: res.body.user.id as string, token: res.body.accessToken as string };
  }

  const order = (shippingCountry: string) =>
    http()
      .post('/marketplace/orders')
      .set(as(buyer))
      .send({ vendorId, items: [{ productId, quantity: 2 }], shippingAddress: '12 Brixton Road, London', shippingCountry })
      .expect(201);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);

    vendorUser = await newUser(UserRole.VENDOR);
    buyer = await newUser(UserRole.CLIENT);
    vendorId = (await prisma.vendor.create({ data: { userId: vendorUser.id, businessName: 'Ọjà Ifá', status: 'APPROVED' } })).id;

    const product = await http()
      .post('/marketplace/products')
      .set(as(vendorUser))
      .send({
        name: 'Ọ̀pẹ̀lẹ̀ divination chain', category: 'sacred-ritual', description: 'Hand-made opele', price: 15000, stock: 10,
        images: ['https://example.com/opele.jpg'],
        customsDescription: 'Brass and seed divination chain', hsCode: '7117.19', originCountry: 'Nigeria',
      })
      .expect(201);
    productId = product.body.id;
    await prisma.product.update({ where: { id: productId }, data: { weight: 0.25 } });
  });

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { vendorId } });
    await prisma.product.deleteMany({ where: { vendorId } });
    await prisma.vendor.deleteMany({ where: { id: vendorId } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('rejects a malformed HS code', async () => {
    await http().patch(`/marketplace/products/${productId}`).set(as(vendorUser)).send({ hsCode: 'brass' }).expect(400);
  });

  it('marks an order to another country international and snapshots customs details', async () => {
    const res = await order('United Kingdom');
    const saved = await prisma.order.findUnique({ where: { id: res.body.id }, include: { items: true } });
    expect(saved!.isInternational).toBe(true);
    expect(saved!.items[0]).toMatchObject({ customsDescription: 'Brass and seed divination chain', hsCode: '7117.19', originCountry: 'Nigeria', weightKg: 0.25 });

    // A later product edit doesn't change the declaration already made.
    await http().patch(`/marketplace/products/${productId}`).set(as(vendorUser)).send({ hsCode: '9999.99' }).expect(200);
    const after = await prisma.orderItem.findFirst({ where: { orderId: res.body.id } });
    expect(after!.hsCode).toBe('7117.19');
  });

  it('lets the vendor print the declaration, but not the buyer', async () => {
    const res = await order('UK');
    const pdf = await http()
      .get(`/marketplace/orders/${res.body.id}/customs-declaration`)
      .set(as(vendorUser))
      .buffer(true)
      .parse((r, cb) => { const c: Buffer[] = []; r.on('data', (d: Buffer) => c.push(d)); r.on('end', () => cb(null, Buffer.concat(c))); })
      .expect(200);
    expect(pdf.headers['content-type']).toBe('application/pdf');
    expect((pdf.body as Buffer).subarray(0, 5).toString()).toBe('%PDF-');

    await http().get(`/marketplace/orders/${res.body.id}/customs-declaration`).set(as(buyer)).expect(403);
  });

  // Every PDF (invoice, statement, tax summary) threw on production until
  // October 30, 2026: pdfkit has no default export and the unit tests'
  // mock supplied one. This uses the real library.
  it('renders the order invoice with the real PDF library', async () => {
    const res = await order('Nigeria');
    const pdf = await http()
      .get(`/marketplace/orders/${res.body.id}/invoice`)
      .set(as(buyer))
      .buffer(true)
      .parse((r, cb) => { const c: Buffer[] = []; r.on('data', (d: Buffer) => c.push(d)); r.on('end', () => cb(null, Buffer.concat(c))); })
      .expect(200);
    expect((pdf.body as Buffer).subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('treats an order within Nigeria as domestic, with no declaration', async () => {
    const res = await order('naija');
    const saved = await prisma.order.findUnique({ where: { id: res.body.id }, include: { items: true } });
    expect(saved!.isInternational).toBe(false);
    expect(saved!.items[0].hsCode).toBeNull();
    await http().get(`/marketplace/orders/${res.body.id}/customs-declaration`).set(as(vendorUser)).expect(400);
  });

  it('lets a vendor change where they ship from', async () => {
    await http().patch(`/marketplace/vendors/${vendorId}`).set(as(vendorUser)).send({ shipsFromCountry: 'United Kingdom' }).expect(200);
    const res = await order('United Kingdom');
    expect((await prisma.order.findUnique({ where: { id: res.body.id } }))!.isInternational).toBe(false);
  });
});
