import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Vendor Features (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  // Test the vendor earnings report endpoint
  it('/marketplace/vendors/{vendorId}/earnings (GET)', () => {
    // This would require authentication headers and a valid vendor ID
    // For now, we'll expect a 401 (Unauthorized) due to JWT guard
    return request(app.getHttpServer())
      .get('/marketplace/vendors/test-vendor-id/earnings')
      .expect(401); // Expecting unauthorized due to missing JWT token
  });

  // Test the vendor financial summary endpoint
  it('/marketplace/vendors/{vendorId}/financial-summary (GET)', () => {
    // This would require authentication headers and a valid vendor ID
    // For now, we'll expect a 401 (Unauthorized) due to JWT guard
    return request(app.getHttpServer())
      .get('/marketplace/vendors/test-vendor-id/financial-summary')
      .expect(401); // Expecting unauthorized due to missing JWT token
  });

  // Test the vendor payout details endpoint
  it('/marketplace/vendors/{vendorId}/payouts (GET)', () => {
    // This would require authentication headers and a valid vendor ID
    // For now, we'll expect a 401 (Unauthorized) due to JWT guard
    return request(app.getHttpServer())
      .get('/marketplace/vendors/test-vendor-id/payouts')
      .expect(401); // Expecting unauthorized due to missing JWT token
  });

  afterEach(async () => {
    await app.close();
  });
});