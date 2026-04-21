import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { User, Appointment, Payment } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('Appointment Payment Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let clientUser: User;
  let babalawoUser: User;
  let appointment: Appointment;
  let payment: Payment;

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
    if (appointment) {
      await prisma.appointment.deleteMany({
        where: { id: appointment.id },
      });
    }
    
    if (payment) {
      await prisma.payment.deleteMany({
        where: { appointmentId: appointment?.id },
      });
    }

    if (clientUser) {
      await prisma.user.deleteMany({
        where: { email: clientUser.email },
      });
    }

    if (babalawoUser) {
      await prisma.user.deleteMany({
        where: { email: babalawoUser.email },
      });
    }

    await app.close();
  });

  it('/auth/register (POST) -> Register Client User', async () => {
    const registrationData = {
      email: `client-${Date.now()}@example.com`,
      firstName: 'Client',
      lastName: 'User',
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

  it('/auth/register (POST) -> Register Babalawo User', async () => {
    const registrationData = {
      email: `babalawo-${Date.now()}@example.com`,
      firstName: 'Babalawo',
      lastName: 'Oracle',
      password: 'SecurePassword123!',
      phone: '+1234567891',
    };

    return request(app.getHttpServer())
      .post('/auth/register')
      .send(registrationData)
      .expect(201)
      .then(response => {
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.role).toBe('BABALAWO');
        babalawoUser = response.body.user;
      });
  });

  it('/appointments (POST) -> Create Appointment Request', async () => {
    // Get client access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: clientUser.email,
        password: 'SecurePassword123!',
      })
      .expect(200);

    const clientAccessToken = loginResponse.body.tokens.access_token;

    const appointmentData = {
      babalawoId: babalawoUser.id,
      scheduledStart: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      scheduledEnd: new Date(Date.now() + 86400000 + 3600000).toISOString(), // 1 hour later
      reason: 'Spiritual Consultation',
    };

    return request(app.getHttpServer())
      .post('/appointments')
      .set('Authorization', `Bearer ${clientAccessToken}`)
      .send(appointmentData)
      .expect(201)
      .then(response => {
        expect(response.body).toHaveProperty('id');
        expect(response.body.clientId).toBe(clientUser.id);
        expect(response.body.babalawoId).toBe(babalawoUser.id);
        expect(response.body.status).toBe('PENDING');
        appointment = response.body;
      });
  });

  it('/appointments/:id/accept (PATCH) -> Accept Appointment (Babalawo)', async () => {
    // Get babalawo access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: babalawoUser.email,
        password: 'SecurePassword123!',
      })
      .expect(200);

    const babalawoAccessToken = loginResponse.body.tokens.access_token;

    return request(app.getHttpServer())
      .patch(`/appointments/${appointment.id}/accept`)
      .set('Authorization', `Bearer ${babalawoAccessToken}`)
      .expect(200)
      .then(response => {
        expect(response.body.status).toBe('CONFIRMED');
        expect(response.body.id).toBe(appointment.id);
      });
  });

  it('/payments/process (POST) -> Process Payment for Appointment', async () => {
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
      appointmentId: appointment.id,
      amount: 15000, // 150 naira in kobo
      currency: 'NGN',
      provider: 'FLUTTERWAVE',
      metadata: {
        purpose: 'Spiritual Consultation Fee',
      },
    };

    return request(app.getHttpServer())
      .post('/payments/process')
      .set('Authorization', `Bearer ${clientAccessToken}`)
      .send(paymentData)
      .expect(201)
      .then(response => {
        expect(response.body).toHaveProperty('id');
        expect(response.body.appointmentId).toBe(appointment.id);
        expect(response.body.amount).toBe(15000);
        expect(response.body.status).toBe('PENDING');
        payment = response.body;
      });
  });

  it('/payments/webhook (POST) -> Simulate Payment Confirmation', async () => {
    // Simulate Flutterwave webhook confirming payment
    const webhookData = {
      event: 'charge.completed',
      data: {
        id: payment.id,
        tx_ref: `tx_${uuidv4()}`,
        status: 'successful',
        amount: 15000,
        currency: 'NGN',
        customer: {
          email: clientUser.email,
        },
      },
    };

    return request(app.getHttpServer())
      .post('/payments/webhook')
      .send(webhookData)
      .set('Content-Type', 'application/json')
      .expect(200)
      .then(response => {
        expect(response.body.success).toBe(true);
      });
  });

  it('/appointments/:id/end (PATCH) -> End Appointment After Consultation', async () => {
    // Get babalawo access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: babalawoUser.email,
        password: 'SecurePassword123!',
      })
      .expect(200);

    const babalawoAccessToken = loginResponse.body.tokens.access_token;

    return request(app.getHttpServer())
      .patch(`/appointments/${appointment.id}/end`)
      .set('Authorization', `Bearer ${babalawoAccessToken}`)
      .send({
        notes: 'Consultation completed successfully. Provided spiritual guidance on career path.',
      })
      .expect(200)
      .then(response => {
        expect(response.body.status).toBe('COMPLETED');
        expect(response.body.notes).toContain('provided spiritual guidance');
      });
  });

  it('/appointments/:id/review (POST) -> Submit Feedback/Review', async () => {
    // Get client access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: clientUser.email,
        password: 'SecurePassword123!',
      })
      .expect(200);

    const clientAccessToken = loginResponse.body.tokens.access_token;

    const reviewData = {
      rating: 5,
      comment: 'Excellent spiritual guidance. Provided deep insights into my life path.',
    };

    return request(app.getHttpServer())
      .post(`/appointments/${appointment.id}/review`)
      .set('Authorization', `Bearer ${clientAccessToken}`)
      .send(reviewData)
      .expect(201)
      .then(response => {
        expect(response.body).toHaveProperty('id');
        expect(response.body.rating).toBe(5);
        expect(response.body.comment).toContain('Excellent spiritual guidance');
        expect(response.body.appointmentId).toBe(appointment.id);
      });
  });
});