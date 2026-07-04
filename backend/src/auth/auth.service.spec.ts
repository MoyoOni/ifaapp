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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
