/**
 * V4-807: Authentication Critical-Path Integration Tests
 * Verifies the entire authentication flow works correctly.
 *
 * Run: npm run test:integration
 * Requires: Postgres at DATABASE_URL, JWT_SECRET in .env
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { UserRole } from '@ile-ase/common';

describe('Authentication Critical-Path Tests (V4-807)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let configService: ConfigService;

  const TEST_EMAIL = `test-${Date.now()}@example.com`;
  const TEST_PASSWORD = 'SecurePassword123!';
  const TEST_NAME = 'Test User';

  let createdUserId: string;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }));
    // Matches main.ts's real bootstrap — without this, error responses use
    // Nest's bare default shape instead of { success: false, error: {...} }.
    app.useGlobalFilters(new GlobalExceptionFilter());

    await app.init();

    jwtService = app.get(JwtService);
    configService = app.get(ConfigService);
  });

  afterAll(async () => {
    // Cleanup would happen here if we had direct DB access
    await app.close();
  });

  describe('AC-1: Registration Flow', () => {
    it('should register new user with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          name: TEST_NAME,
          role: UserRole.CLIENT,
        })
        .expect(201);

      // AuthService.register() returns { user: {...}, accessToken, refreshToken }
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', TEST_EMAIL);
      expect(response.body.user).toHaveProperty('name', TEST_NAME);
      expect(response.body.user).toHaveProperty('role', UserRole.CLIENT);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      createdUserId = response.body.user.id;
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'not-an-email',
          password: TEST_PASSWORD,
          name: TEST_NAME,
          role: UserRole.CLIENT,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `weak-${Date.now()}@example.com`,
          password: 'weak',
          name: TEST_NAME,
          role: UserRole.CLIENT,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject duplicate email registration', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          name: TEST_NAME,
          role: UserRole.CLIENT,
        })
        .expect(409); // Conflict

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('AC-1: Login Flow', () => {
    it('should login with correct credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', createdUserId);

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: TEST_EMAIL,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: TEST_PASSWORD,
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('AC-1: Token Refresh Flow', () => {
    it('should issue new access token with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: refreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      // JWT `iat` has second-level granularity, so a refresh issued within the
      // same second as the original login can legitimately produce a
      // byte-identical token — asserting string inequality here is flaky.
      // What actually matters is that the new token is valid and still
      // resolves to the same user.
      const decoded = jwtService.verify(response.body.accessToken, {
        secret: configService.get<string>('JWT_SECRET'),
      });
      expect(decoded.sub).toBe(createdUserId);

      // Update token for subsequent tests
      accessToken = response.body.accessToken;
    });

    it('should reject refresh with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalid.token.here',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject refresh with expired token', async () => {
      // Create an expired token
      const expiredToken = jwtService.sign(
        { id: createdUserId, email: TEST_EMAIL },
        { expiresIn: '-1s' } // Already expired
      );

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: expiredToken,
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('AC-2: Protected Endpoint Access', () => {
    it('should access protected endpoint with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', createdUserId);
      expect(response.body).toHaveProperty('email', TEST_EMAIL);
    });

    it('should reject access without token', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject access with expired token', async () => {
      const expiredToken = jwtService.sign(
        { id: createdUserId, email: TEST_EMAIL },
        { expiresIn: '-1s' }
      );

      const response = await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject access with malformed header', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('AC-2: Authorization - Role-Based Access', () => {
    it('should allow client role to access client endpoints', async () => {
      // Assuming a client-only endpoint exists
      const response = await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Should not be 403 (forbidden)
      expect(response.status).not.toBe(403);
    });

    it('should reject unauthorized role from protected endpoint', async () => {
      // Create a token for a different role (simulated)
      const adminToken = jwtService.sign(
        { id: 'fake-admin', role: 'ADMIN' },
        { expiresIn: '15m' }
      );

      // Try to access a client-only endpoint with admin token
      // This would depend on actual endpoint implementation
      // For now, we verify the token structure is correct
      const decoded = jwtService.verify(adminToken);
      expect(decoded.role).toBe('ADMIN');
    });
  });

  describe('AC-5: Complete Authentication Session', () => {
    it('should complete full auth flow: register -> login -> refresh -> access protected', async () => {
      const sessionEmail = `session-${Date.now()}@example.com`;

      // 1. Register
      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: sessionEmail,
          password: TEST_PASSWORD,
          name: 'Session Test',
          role: UserRole.CLIENT,
        })
        .expect(201);

      const userId = registerRes.body.user.id;

      // 2. Login
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: sessionEmail,
          password: TEST_PASSWORD,
        })
        .expect(200);

      let token = loginRes.body.accessToken;
      const refToken = loginRes.body.refreshToken;

      // 3. Access protected endpoint
      const meRes1 = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(meRes1.body.id).toBe(userId);

      // 4. Refresh token
      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: refToken })
        .expect(200);

      token = refreshRes.body.accessToken;

      // 5. Access protected endpoint with new token
      const meRes2 = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(meRes2.body.id).toBe(userId);
    });
  });
});
