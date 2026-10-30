/**
 * What public and member-facing endpoints may say about other people,
 * through the real HTTP stack.
 *
 * An October 30, 2026 crawl of every GET route found anonymous visitors
 * receiving a paid digital product's download link and every vendor's tax
 * ID and business license (product listings), a temple founder's personal
 * email (temples list), and a vendor's personal email (storefront).
 *
 * Run: npm run test:integration
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { SensitiveFieldStripInterceptor } from '../src/interceptors/sensitive-field-strip.interceptor';
import { DecimalToNumberInterceptor } from '../src/interceptors/decimal-to-number.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole } from '@ile-ase/common';

describe('Response privacy', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];
  let vendorUser: { id: string; token: string; email: string };
  let member: { id: string; token: string };
  let productId: string;
  let templeId: string;

  const PAID_LINK = 'https://drive.example/paid-odu-guide';
  const http = () => request(app.getHttpServer());
  const as = (u: { token: string }) => ({ Authorization: `Bearer ${u.token}` });

  async function newUser(role: UserRole) {
    const email = `privacy-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
    const res = await http()
      .post('/auth/register')
      .send({ email, password: 'SecurePassword123!', name: 'Privacy Test', role })
      .expect(201);
    userIds.push(res.body.user.id);
    return { id: res.body.user.id as string, token: res.body.accessToken as string, email };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    // Same order as main.ts.
    app.useGlobalInterceptors(new SensitiveFieldStripInterceptor(), new DecimalToNumberInterceptor());
    await app.init();
    prisma = app.get(PrismaService);

    vendorUser = await newUser(UserRole.VENDOR);
    member = await newUser(UserRole.CLIENT);

    const vendor = await prisma.vendor.create({
      data: { userId: vendorUser.id, businessName: 'Privacy Shop', taxId: 'TAX-PRIV-1', businessLicense: 'LIC-PRIV-1', status: 'APPROVED' },
    });
    const product = await prisma.product.create({
      data: { vendorId: vendor.id, name: 'Privacy digital guide', category: 'BOOKS', description: 'x', price: 5000, type: 'DIGITAL', status: 'ACTIVE', stock: 10, digitalFileUrl: PAID_LINK },
    });
    productId = product.id;
    const temple = await prisma.temple.create({
      data: { name: 'Privacy Temple', slug: `privacy-temple-${Date.now()}`, founderId: vendorUser.id, status: 'ACTIVE' },
    });
    templeId = temple.id;
  });

  afterAll(async () => {
    await prisma.temple.deleteMany({ where: { id: templeId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.vendor.deleteMany({ where: { userId: vendorUser.id } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  const leaked = (body: unknown) => {
    const text = JSON.stringify(body);
    return ['TAX-PRIV-1', 'LIC-PRIV-1', PAID_LINK, vendorUser.email].filter((s) => text.includes(s));
  };

  it('gives anonymous visitors no download link, tax details or owner email', async () => {
    const list = await http().get('/marketplace/products').expect(200);
    expect(JSON.stringify(list.body)).toContain('Privacy digital guide');
    expect(leaked(list.body)).toEqual([]);

    const one = await http().get(`/marketplace/products/${productId}`).expect(200);
    expect(leaked(one.body)).toEqual([]);

    const temples = await http().get('/temples').expect(200);
    expect(JSON.stringify(temples.body)).toContain('Privacy Temple');
    expect(leaked(temples.body)).toEqual([]);
  });

  it('gives another member none of it either', async () => {
    for (const url of ['/marketplace/products', `/marketplace/products/${productId}`, '/marketplace/vendors', `/marketplace/vendors/${vendorUser.id}`, '/temples']) {
      const res = await http().get(url).set(as(member));
      expect(res.status).toBe(200);
      expect({ url, leaked: leaked(res.body) }).toEqual({ url, leaked: [] });
    }
  });

  it('still shows the vendor their own link and tax details', async () => {
    const res = await http().get(`/marketplace/products/${productId}`).set(as(vendorUser)).expect(200);
    expect(res.body.digitalFileUrl).toBe(PAID_LINK);
    expect(res.body.vendor.taxId).toBe('TAX-PRIV-1');
  });
});
