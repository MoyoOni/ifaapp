import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MessagingService } from '../messaging/messaging.service';
import { UserService } from '../modules/user/user.service';
import { ImpersonationService } from '../shared/services/impersonation.service';
import { SesEmailService } from '../shared/services/ses-email.service';
import { RedisCacheService } from '../cache/redis-cache.service';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole, CulturalLevel } from '@ile-ase/common';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userProfile: {
      create: jest.fn(),
    },
    userSession: {
      create: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn().mockImplementation(async (fn) => fn()),
  };

  const mockMessagingService = {
    sendDirectMessage: jest.fn(),
  };

  const mockUserService = {
    createUserProfile: jest.fn(),
  };

  const mockSesEmailService = {
    sendEmail: jest.fn(),
  };

  const mockRedisCacheService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(true),
    exists: jest.fn().mockResolvedValue(false),
    del: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        ConfigService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: MessagingService,
          useValue: mockMessagingService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: SesEmailService,
          useValue: mockSesEmailService,
        },
        {
          provide: ImpersonationService,
          useValue: {},
        },
        {
          provide: RedisCacheService,
          useValue: mockRedisCacheService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        name: 'John Doe',
        password: 'password123',
        role: UserRole.CLIENT,
        phone: '+1234567890',
        yorubaName: 'Adewale',
        culturalLevel: CulturalLevel.AKEKO,
        referredByCode: 'referrer-code',
      };

      const hashedPassword = 'hashedPassword123';
      const newUser = {
        id: 'user123',
        email: registerDto.email,
        password: hashedPassword,
        name: registerDto.name,
        phone: registerDto.phone,
        yorubaName: registerDto.yorubaName,
        role: registerDto.role,
        culturalLevel: registerDto.culturalLevel,
        emailVerified: false,
        emailVerificationToken: 'verificationToken',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrismaService.user.create as jest.Mock).mockResolvedValue(newUser);
      (mockUserService.createUserProfile as jest.Mock).mockResolvedValue({});

      const result = await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: registerDto.email,
            passwordHash: hashedPassword,
            name: registerDto.name,
          }),
        })
      );
      expect(result).toMatchObject({
        user: expect.objectContaining({
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        }),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    it('should throw ConflictException when user already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        name: 'John Doe',
        password: 'password123',
        role: UserRole.CLIENT,
        phone: '+1234567890',
        yorubaName: 'Adewale',
        culturalLevel: CulturalLevel.AKEKO,
        referredByCode: 'referrer-code',
      };

      const existingUser = { id: 'user123', email: registerDto.email };

      (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
    });
  });

  describe('login', () => {
    it('should return user and tokens when credentials are valid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: 'user123',
        email: loginDto.email,
        passwordHash: 'hashedPassword123',
        name: 'John Doe',
        phone: '+1234567890',
        yorubaName: 'Adewale',
        role: UserRole.CLIENT,
        culturalLevel: CulturalLevel.AKEKO,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const accessToken = 'accessToken123';

      (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(jwtService, 'sign').mockReturnValue(accessToken as any);

      const result = await service.login(loginDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, user.passwordHash);
      expect(result).toMatchObject({
        user: expect.objectContaining({ id: user.id, email: user.email, role: user.role }),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    it('signs the access token with the configured JWT_EXPIRES_IN, not a hardcoded value', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };
      const user = {
        id: 'user123',
        email: loginDto.email,
        passwordHash: 'hashedPassword123',
        role: UserRole.CLIENT,
      };

      (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const signSpy = jest.spyOn(jwtService, 'sign').mockReturnValue('token' as any);

      await service.login(loginDto);

      // Regression guard: generateTokens() used to hardcode expiresIn: '1h'
      // regardless of JWT_EXPIRES_IN/.env.example's documented 15m default.
      expect(signSpy).toHaveBeenCalledWith(
        expect.objectContaining({ jti: expect.any(String) }),
        expect.objectContaining({ expiresIn: '15m' })
      );
      expect(signSpy).toHaveBeenCalledWith(
        expect.objectContaining({ jti: expect.any(String) }),
        expect.objectContaining({ expiresIn: '7d' })
      );
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongPassword',
      };

      const user = {
        id: 'user123',
        email: loginDto.email,
        passwordHash: 'hashedPassword123',
      };

      (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, user.passwordHash);
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
    });
  });

  describe('logout / token revocation', () => {
    beforeEach(() => {
      mockRedisCacheService.set.mockClear();
      mockRedisCacheService.exists.mockClear();
      mockRedisCacheService.exists.mockResolvedValue(false);
    });

    it('logout() denylists the session jti with a TTL capped to the token`s own remaining lifetime', async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const exp = nowSeconds + 900; // 15 minutes out

      await service.logout('session-jti-1', exp);

      expect(mockRedisCacheService.set).toHaveBeenCalledWith(
        'auth:denylist:session-jti-1',
        '1',
        expect.any(Number)
      );
      const ttlArg = mockRedisCacheService.set.mock.calls[0][2];
      expect(ttlArg).toBeGreaterThan(0);
      expect(ttlArg).toBeLessThanOrEqual(900);
    });

    it('refreshToken() rejects a refresh token whose jti has already been revoked', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        sub: 'user123',
        email: 'test@example.com',
        role: UserRole.CLIENT,
        verified: true,
        jti: 'revoked-jti',
        exp: Math.floor(Date.now() / 1000) + 1000,
      } as any);
      mockRedisCacheService.exists.mockResolvedValue(true); // already denylisted

      await expect(service.refreshToken('some.refresh.token')).rejects.toThrow(UnauthorizedException);
    });

    it('refreshToken() rotates: the spent refresh token is denylisted so it cannot be replayed', async () => {
      const oldExp = Math.floor(Date.now() / 1000) + 1000;
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        sub: 'user123',
        email: 'test@example.com',
        role: UserRole.CLIENT,
        verified: true,
        jti: 'old-jti',
        exp: oldExp,
      } as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('new-token' as any);
      (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        role: UserRole.CLIENT,
        verified: true,
      });

      const result = await service.refreshToken('some.refresh.token');

      expect(result).toMatchObject({ accessToken: 'new-token', refreshToken: 'new-token' });
      expect(mockRedisCacheService.set).toHaveBeenCalledWith(
        'auth:denylist:old-jti',
        '1',
        expect.any(Number)
      );
    });
  });

  describe('verifyGoogleToken', () => {
    it('refuses to verify when GOOGLE_CLIENT_ID is not configured, instead of silently verifying with no audience restriction', async () => {
      // Regression guard: production ran with GOOGLE_CLIENT_ID entirely
      // unset for a while -- new OAuth2Client(undefined) + audience:
      // undefined doesn't fail in an obviously diagnosable way, it either
      // throws a generic "Invalid Google token" or verifies without
      // actually restricting the token's audience to this app.
      jest.spyOn(configService, 'get').mockImplementation((key: string) =>
        key === 'GOOGLE_CLIENT_ID' ? undefined : 'irrelevant'
      );

      await expect(service.verifyGoogleToken('some-credential')).rejects.toThrow(
        'Google sign-in is not configured'
      );
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
