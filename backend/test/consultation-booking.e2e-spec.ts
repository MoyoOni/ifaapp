import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Consultation Booking API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let babalawoId: string;
  let clientId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // TODO: Implement proper authentication setup
    // This would typically involve:
    // 1. Creating test users
    // 2. Getting auth tokens
    // 3. Setting up test data
    
    // For now, we'll mock the setup
    authToken = 'test-token';
    babalawoId = 'test-babalawo-id';
    clientId = 'test-client-id';
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('POST /api/appointments', () => {
    it('should create a new consultation booking', async () => {
      const bookingData = {
        babalawoId: babalawoId,
        clientId: clientId,
        date: '2024-12-20',
        time: '14:00',
        topic: 'Love & Relationships Guidance',
        preferredMethod: 'VIDEO',
        duration: 60,
        price: 5000,
        paymentMethod: 'WALLET',
      };

      const response = await request(app.getHttpServer())
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookingData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.babalawoId).toBe(babalawoId);
      expect(response.body.clientId).toBe(clientId);
      expect(response.body.status).toBe('PENDING_CONFIRMATION');
    });

    it('should reject booking with past date', async () => {
      const bookingData = {
        babalawoId: babalawoId,
        clientId: clientId,
        date: '2020-01-01', // Past date
        time: '14:00',
        topic: 'Test Topic',
        preferredMethod: 'VIDEO',
        paymentMethod: 'WALLET',
      };

      await request(app.getHttpServer())
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookingData)
        .expect(400);
    });
  });

  describe('POST /api/appointments/check-availability', () => {
    it('should check if time slot is available', async () => {
      const checkData = {
        babalawoId: babalawoId,
        date: '2024-12-20',
        time: '14:00',
        duration: '60',
      };

      const response = await request(app.getHttpServer())
        .post('/api/appointments/check-availability')
        .send(checkData)
        .expect(201);

      expect(response.body).toHaveProperty('available');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/appointments/:id', () => {
    it('should get appointment details', async () => {
      // This would require creating an appointment first
      const appointmentId = 'test-appointment-id';

      const response = await request(app.getHttpServer())
        .get(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('babalawo');
      expect(response.body).toHaveProperty('client');
    });
  });

  describe('GET /api/appointments/babalawo/:babalawoId/available-slots', () => {
    it('should get available time slots for babalawo', async () => {
      const date = '2024-12-20';

      const response = await request(app.getHttpServer())
        .get(`/api/appointments/babalawo/${babalawoId}/available-slots?date=${date}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
    });
  });

  describe('PATCH /api/appointments/:id/confirm', () => {
    it('should confirm an appointment', async () => {
      const appointmentId = 'test-appointment-id';

      const response = await request(app.getHttpServer())
        .patch(`/api/appointments/${appointmentId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('CONFIRMED');
    });
  });

  describe('GET /api/appointments/client/:clientId/upcoming', () => {
    it('should get upcoming appointments for client', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/appointments/client/${clientId}/upcoming`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
    });
  });
});