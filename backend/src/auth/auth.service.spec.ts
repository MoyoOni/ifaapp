import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MessagingService } from '../messaging/messaging.service';
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
  let prisma: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let messagingService: MessagingService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockMessagingService = {
    sendSystemMessage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MessagingService, useValue: mockMessagingService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    messagingService = module.get(MessagingService);

    // Setup default config values
    (configService.get as jest.Mock)
      .mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return 'test-jwt-secret';
        if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
        return null;
      });

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const mockRegisterDto: RegisterDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      role: UserRole.CLIENT,
      yorubaName: 'Test Yoruba',
      culturalLevel: CulturalLevel.OMO_ILE,
    };

    const mockUser = {
      id: 'user-123',
      email: mockRegisterDto.email,
      name: mockRegisterDto.name,
      role: mockRegisterDto.role,
      verified: false,
      yorubaName: mockRegisterDto.yorubaName,
      culturalLevel: mockRegisterDto.culturalLevel,
      hasOnboarded: true,
    };

    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    beforeEach(() => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce(mockTokens.accessToken)
        .mockReturnValueOnce(mockTokens.refreshToken);
    });

    it('should register a new user successfully', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'admin-1', email: 'admin@ile-ase.test', role: 'ADMIN' },
      ]);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (messagingService.sendSystemMessage as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await service.register(mockRegisterDto);

      // Wait for fire-and-forget sendWelcomeMessage
      await new Promise((r) => setImmediate(r));

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockRegisterDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(mockRegisterDto.password, 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: mockRegisterDto.email,
          name: mockRegisterDto.name,
          passwordHash: 'hashed-password',
          role: mockRegisterDto.role,
          yorubaName: mockRegisterDto.yorubaName,
          culturalLevel: mockRegisterDto.culturalLevel || 'Omo Ilé',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          verified: true,
          yorubaName: true,
          culturalLevel: true,
          hasOnboarded: true,
        },
      });
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(messagingService.sendSystemMessage).toHaveBeenCalled();
      expect(result).toEqual({
        user: mockUser,
        ...mockTokens,
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(mockRegisterDto)).rejects.toThrow(ConflictException);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockRegisterDto.email },
      });
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should not send welcome message for non-client roles', async () => {
      // Arrange
      const adminRegisterDto: RegisterDto = {
        ...mockRegisterDto,
        role: UserRole.ADMIN,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        role: UserRole.ADMIN,
      });

      // Act
      await service.register(adminRegisterDto);

      // Assert
      expect(messagingService.sendSystemMessage).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const mockLoginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockDbUser = {
      id: 'user-123',
      email: mockLoginDto.email,
      name: 'Test User',
      passwordHash: 'hashed-password',
      role: UserRole.CLIENT,
      verified: true,
      yorubaName: 'Test Yoruba',
      culturalLevel: 'Omo Ilé',
      hasOnboarded: true,
    };

    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    beforeEach(() => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce(mockTokens.accessToken)
        .mockReturnValueOnce(mockTokens.refreshToken);
    });

    it('should login user with valid credentials', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);

      // Act
      const result = await service.login(mockLoginDto);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockLoginDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(mockLoginDto.password, mockDbUser.passwordHash);
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        user: {
          id: mockDbUser.id,
          email: mockDbUser.email,
          name: mockDbUser.name,
          role: mockDbUser.role,
          verified: mockDbUser.verified,
          yorubaName: mockDbUser.yorubaName,
          culturalLevel: mockDbUser.culturalLevel,
          hasOnboarded: mockDbUser.hasOnboarded,
        },
        ...mockTokens,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(mockLoginDto)).rejects.toThrow(UnauthorizedException);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockLoginDto.email },
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(mockLoginDto)).rejects.toThrow(UnauthorizedException);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockLoginDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(mockLoginDto.password, mockDbUser.passwordHash);
    });
  });

  describe('quickAccessLogin', () => {
    const userEmail = 'test@example.com';
    const mockUser = {
      id: 'user-123',
      email: userEmail,
      name: 'Test User',
      passwordHash: 'hashed-password',
      role: UserRole.CLIENT,
      verified: true,
      yorubaName: 'Test Yoruba',
      culturalLevel: 'Omo Ilé',
      hasOnboarded: true,
    };

    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    beforeEach(() => {
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce(mockTokens.accessToken)
        .mockReturnValueOnce(mockTokens.refreshToken);
    });

    it('should login user via quick access', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await service.quickAccessLogin(userEmail);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userEmail },
      });
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          verified: mockUser.verified,
          yorubaName: mockUser.yorubaName,
          culturalLevel: mockUser.culturalLevel,
          hasOnboarded: mockUser.hasOnboarded,
        },
        ...mockTokens,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.quickAccessLogin(userEmail)).rejects.toThrow(UnauthorizedException);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userEmail },
      });
    });
  });

  describe('refreshToken', () => {
    const refreshToken = 'refresh-token';
    const mockPayload = {
      sub: 'user-123',
      email: 'test@example.com',
      role: UserRole.CLIENT,
      verified: true,
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashed-password',
      role: UserRole.CLIENT,
      verified: true,
      yorubaName: 'Test Yoruba',
      culturalLevel: 'Omo Ilé',
      hasOnboarded: true,
    };

    const mockNewTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    beforeEach(() => {
      (jwtService.verify as jest.Mock).mockReturnValue(mockPayload);
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce(mockNewTokens.accessToken)
        .mockReturnValueOnce(mockNewTokens.refreshToken);
    });

    it('should refresh tokens successfully', async () => {
      // Arrange: clear queue (leftover from quickAccessLogin) and use implementation so order is irrelevant
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      const signMock = jwtService.sign as jest.Mock;
      signMock.mockReset();
      signMock.mockImplementation((_payload: any, opts: any) =>
        opts?.expiresIn === '7d' ? mockNewTokens.refreshToken : mockNewTokens.accessToken,
      );

      // Act
      const result = await service.refreshToken(refreshToken);

      // Assert
      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: 'test-refresh-secret',
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockPayload.sub },
      });
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockNewTokens);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: 'test-refresh-secret',
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockPayload.sub },
      });
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      // Arrange
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: 'test-refresh-secret',
      });
    });
  });

  describe('generateTokens', () => {
    const mockPayload = {
      sub: 'user-123',
      email: 'test@example.com',
      role: UserRole.CLIENT,
      verified: true,
    };

    it('should generate access and refresh tokens', async () => {
      // Arrange (reset sign so previous tests' implementation doesn't override)
      const signMock = jwtService.sign as jest.Mock;
      signMock.mockReset();
      signMock
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      // Act
      const result = await (service as any).generateTokens(mockPayload);

      // Assert
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(jwtService.sign).toHaveBeenCalledWith(mockPayload, {
        secret: 'test-jwt-secret',
        expiresIn: '15m',
      });
      expect(jwtService.sign).toHaveBeenCalledWith(mockPayload, {
        secret: 'test-refresh-secret',
        expiresIn: '7d',
      });
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should throw error if JWT_SECRET is not configured', async () => {
      // Arrange
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
        return null; // JWT_SECRET is missing
      });

      // Act & Assert
      await expect((service as any).generateTokens(mockPayload)).rejects.toThrow(
        'JWT_SECRET environment variable is required'
      );
    });

    it('should throw error if JWT_REFRESH_SECRET is not configured', async () => {
      // Arrange
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return 'test-jwt-secret';
        return null; // JWT_REFRESH_SECRET is missing
      });

      // Act & Assert
      await expect((service as any).generateTokens(mockPayload)).rejects.toThrow(
        'JWT_REFRESH_SECRET environment variable is required'
      );
    });
  });
});