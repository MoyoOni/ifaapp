import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { User, Product, Order, OrderItem } from '@prisma/client';

describe('Marketplace Purchase Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let clientUser: User;
  let vendorUser: User;
  let product: Product;
  let order: Order;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useClass(PrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    // Clean up test data
    if (order) {
      await prisma.order.deleteMany({
        where: { id: order.id },
      });
    }

    if (product) {
      await prisma.product.deleteMany({
        where: { id: product.id },
      });
    }

    if (clientUser) {
      await prisma.user.deleteMany({
        where: { email: clientUser.email },
      });
    }

    if (vendorUser) {
      await prisma.user.deleteMany({
        where: { email: vendorUser.email },
      });
    }

    await app.close();
  });

  it('/auth/register (POST) -> Register Client User', async () => {
    const registrationData = {
      email: `buyer-${Date.now()}@example.com`,
      firstName: 'Marketplace',
      lastName: 'Buyer',
      password: 'SecurePassword123!',
      phone: '+1234567890',
    };

    return request(app.getHttpServer())
      .post('/auth/register')
      .send(registrationData)
      .expect(201)
      .then(response => {
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.role).toBe('CLIENT');
        clientUser = response.body.user;
      });
  });

  it('/auth/register (POST) -> Register Vendor User', async () => {
    const registrationData = {
      email: `vendor-${Date.now()}@example.com`,
      firstName: 'Marketplace',
      lastName: 'Vendor',
      password: 'SecurePassword123!',
      phone: '+1234567891',
    };

    return request(app.getHttpServer())
      .post('/auth/register')
      .send(registrationData)
      .expect(201)
      .then(response => {
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.role).toBe('VENDOR');
        vendorUser = response.body.user;
      });
  });

  it('/products (POST) -> Create Product Listing (Vendor)', async () => {
    // Get vendor access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: vendorUser.email,
        password: 'SecurePassword123!',
      })
      .expect(200);

    const vendorAccessToken = loginResponse.body.tokens.access_token;

    const productData = {
      name: 'Spiritual Candle',
      description: 'A sacred candle for spiritual rituals and prayers',
      price: 5000, // 50 naira in kobo
      stockQuantity: 20,
      categoryId: 'candle',
      images: ['https://example.com/candle1.jpg', 'https://example.com/candle2.jpg'],
      status: 'ACTIVE',
    };

    return request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${vendorAccessToken}`)
      .send(productData)
      .expect(201)
      .then(response => {
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('Spiritual Candle');
        expect(response.body.vendorId).toBe(vendorUser.id);
        expect(response.body.price).toBe(5000);
        expect(response.body.status).toBe('ACTIVE');
        product = response.body;
      });
  });

  it('/products/:id (GET) -> Retrieve Product Details', async () => {
    return request(app.getHttpServer())
      .get(`/products/${product.id}`)
      .expect(200)
      .then(response => {
        expect(response.body).toHaveProperty('id', product.id);
        expect(response.body.name).toBe('Spiritual Candle');
        expect(response.body.description).toBe('A sacred candle for spiritual rituals and prayers');
        expect(response.body.vendor).toHaveProperty('firstName', 'Marketplace');
        expect(response.body.vendor).toHaveProperty('lastName', 'Vendor');
      });
  });

  it('/cart/add (POST) -> Add Product to Cart', async () => {
    // Get client access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: clientUser.email,
        password: 'SecurePassword123!',
      })
      .expect(200);

    const clientAccessToken = loginResponse.body.tokens.access_token;

    const cartData = {
      productId: product.id,
      quantity: 2,
    };

    return request(app.getHttpServer())
      .post('/cart/add')
      .set('Authorization', `Bearer ${clientAccessToken}`)
      .send(cartData)
      .expect(201)
      .then(response => {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.cart.items).toBeInstanceOf(Array);
        expect(response.body.cart.items[0].productId).toBe(product.id);
        expect(response.body.cart.items[0].quantity).toBe(2);
      });
  });

  it('/orders/create (POST) -> Create Order from Cart', async () => {
    // Get client access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: clientUser.email,
        password: 'SecurePassword123!',
      })
      .expect(200);

    const clientAccessToken = loginResponse.body.tokens.access_token;

    const orderData = {
      shippingAddress: {
        street: '123 Main St',
        city: 'Lagos',
        state: 'Lagos',
        zipCode: '100001',
        country: 'NG',
      },
      billingAddress: {
        street: '123 Main St',
        city: 'Lagos',
        state: 'Lagos',
        zipCode: '100001',
        country: 'NG',
      },
    };

    return request(app.getHttpServer())
      .post('/orders/create')
      .set('Authorization', `Bearer ${clientAccessToken}`)
      .send(orderData)
      .expect(201)
      .then(response => {
        expect(response.body).toHaveProperty('id');
        expect(response.body.userId).toBe(clientUser.id);
        expect(response.body.totalAmount).toBe(10000); // 2 x 5000
        expect(response.body.status).toBe('PENDING_PAYMENT');
        expect(response.body.orderItems).toBeInstanceOf(Array);
        expect(response.body.orderItems[0].productId).toBe(product.id);
        expect(response.body.orderItems[0].quantity).toBe(2);
        order = response.body;
      });
  });

  it('/orders/:id/payment (POST) -> Process Order Payment', async () => {
    // Get client access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: clientUser.email,
        password: 'SecurePassword123!',
      })
      .expect(200);

    const clientAccessToken = loginResponse.body.tokens.access_token;

    const paymentData = {
      orderId: order.id,
      amount: order.totalAmount,
      currency: 'NGN',
      provider: 'FLUTTERWAVE',
      metadata: {
        purpose: 'Marketplace Purchase',
      },
    };

    return request(app.getHttpServer())
      .post('/orders/payment')
      .set('Authorization', `Bearer ${clientAccessToken}`)
      .send(paymentData)
      .expect(201)
      .then(response => {
        expect(response.body).toHaveProperty('id');
        expect(response.body.orderId).toBe(order.id);
        expect(response.body.amount).toBe(order.totalAmount);
        expect(response.body.status).toBe('PENDING');
      });
  });

  it('/orders/:id/confirm (POST) -> Confirm Payment and Notify Vendor', async () => {
    // Simulate payment confirmation which should trigger vendor notification
    // Get client access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: clientUser.email,
        password: 'SecurePassword123!',
      })
      .expect(200);

    const clientAccessToken = loginResponse.body.tokens.access_token;

    return request(app.getHttpServer())
      .post(`/orders/${order.id}/confirm`)
      .set('Authorization', `Bearer ${clientAccessToken}`)
      .expect(200)
      .then(response => {
        expect(response.body.status).toBe('CONFIRMED');
        expect(response.body.id).toBe(order.id);
      });
  });

  it('/orders/:id/tracking (POST) -> Vendor Marks as Shipped', async () => {
    // Get vendor access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: vendorUser.email,
        password: 'SecurePassword123!',
      })
      .expect(200);

    const vendorAccessToken = loginResponse.body.tokens.access_token;

    const trackingData = {
      carrier: 'FedEx',
      trackingNumber: 'TRACK123456789',
      status: 'SHIPPED',
    };

    return request(app.getHttpServer())
      .post(`/orders/${order.id}/tracking`)
      .set('Authorization', `Bearer ${vendorAccessToken}`)
      .send(trackingData)
      .expect(200)
      .then(response => {
        expect(response.body.status).toBe('SHIPPED');
        expect(response.body.trackingInfo).toHaveProperty('carrier', 'FedEx');
        expect(response.body.trackingInfo).toHaveProperty('trackingNumber', 'TRACK123456789');
      });
  });

  it('/orders/:id (GET) -> Client Retrieves Order Status', async () => {
    // Get client access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: clientUser.email,
        password: 'SecurePassword123!',
      })
      .expect(200);

    const clientAccessToken = loginResponse.body.tokens.access_token;

    return request(app.getHttpServer())
      .get(`/orders/${order.id}`)
      .set('Authorization', `Bearer ${clientAccessToken}`)
      .expect(200)
      .then(response => {
        expect(response.body).toHaveProperty('id', order.id);
        expect(response.body.status).toBe('SHIPPED');
        expect(response.body.trackingInfo).toHaveProperty('carrier', 'FedEx');
        expect(response.body.orderItems).toBeInstanceOf(Array);
        expect(response.body.orderItems[0].product.name).toBe('Spiritual Candle');
      });
  });

  it('/notifications (GET) -> Vendor Checks Notifications', async () => {
    // Get vendor access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: vendorUser.email,
        password: 'SecurePassword123!',
      })
      .expect(200);

    const vendorAccessToken = loginResponse.body.tokens.access_token;

    return request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${vendorAccessToken}`)
      .expect(200)
      .then(response => {
        expect(response.body).toBeInstanceOf(Array);
        // There should be a notification about the new order
        const orderNotification = response.body.find(notification => 
          notification.message && notification.message.includes('new order')
        );
        expect(orderNotification).toBeDefined();
        expect(orderNotification.type).toBe('ORDER_NOTIFICATION');
      });
  });
});