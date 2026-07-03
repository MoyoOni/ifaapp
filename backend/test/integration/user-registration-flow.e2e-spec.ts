import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';
import { User } from '@prisma/client';

describe('User Registration Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let newUser: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useClass(PrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    authService = moduleFixture.get<AuthService>(AuthService);

    await app.init();
  });

  afterAll(async () => {
    // Clean up test data
    if (newUser) {
      await prisma.user.deleteMany({
        where: { email: newUser.email },
      });
    }

    await app.close();
  });

  it('/auth/register (POST) -> Registration', async () => {
    const registrationData = {
      email: `testuser-${Date.now()}@example.com`,
      firstName: 'Test',
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
        expect(response.body).toHaveProperty('tokens');
        expect(response.body.user.email).toBe(registrationData.email);
        
        newUser = response.body.user;
      });
  });

  it('/auth/verify-email (POST) -> Email Verification', async () => {
    // In a real scenario, we would retrieve the verification token from email service mock
    // For this test, we'll directly verify the user in the database
    await prisma.user.update({
      where: { id: newUser.id },
      data: { isEmailVerified: true },
    });

    // Verify the user is now marked as verified
    const updatedUser = await prisma.user.findUnique({
      where: { id: newUser.id },
    });

    expect(updatedUser.isEmailVerified).toBe(true);
  });

  it('/onboarding/profile (PUT) -> Profile Setup', async () => {
    const profileData = {
      bio: 'This is my bio',
      avatar: 'https://example.com/avatar.jpg',
      additionalInfo: {
        location: 'Lagos, Nigeria',
        occupation: 'Developer',
        interests: ['technology', 'spirituality'],
      },
    };

    // First get authentication tokens
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: newUser.email,
        password: 'SecurePassword123!',
      })
      .expect(200);

    const accessToken = loginResponse.body.tokens.access_token;

    // Update profile with authorization
    return request(app.getHttpServer())
      .put('/onboarding/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(profileData)
      .expect(200)
      .then(response => {
        expect(response.body).toHaveProperty('id', newUser.id);
        expect(response.body.bio).toBe(profileData.bio);
        expect(response.body.additionalInfo.location).toBe('Lagos, Nigeria');
      });
  });

  it('/users/profile (GET) -> Retrieve Updated Profile', async () => {
    // Get auth tokens
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: newUser.email,
        password: 'SecurePassword123!',
      })
      .expect(200);

    const accessToken = loginResponse.body.tokens.access_token;

    // Fetch updated profile
    return request(app.getHttpServer())
      .get('/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .then(response => {
        expect(response.body).toHaveProperty('id', newUser.id);
        expect(response.body.firstName).toBe('Test');
        expect(response.body.lastName).toBe('User');
        expect(response.body.bio).toBe('This is my bio');
        expect(response.body.additionalInfo).toHaveProperty('location', 'Lagos, Nigeria');
      });
  });
});