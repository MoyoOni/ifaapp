import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../src/prisma/prisma.service';
import { SecurityHardeningService } from '../src/security/security-hardening.service';

describe('SecurityHardeningService', () => {
  let service: SecurityHardeningService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityHardeningService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<SecurityHardeningService>(SecurityHardeningService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateSecurityConfiguration', () => {
    it('should pass validation in development mode with no issues', async () => {
      (configService.get as jest.Mock)
        .mockReturnValueOnce('development') // NODE_ENV
        .mockReturnValueOnce(undefined) // ENABLE_QUICK_ACCESS
        .mockReturnValueOnce('valid-secret-key-at-least-32-chars-long') // JWT_SECRET
        .mockReturnValueOnce('valid-32-char-encryption-key!!'); // ENCRYPTION_KEY

      const result = await service.validateSecurityConfiguration();
      expect(result).toBe(true);
    });

    it('should fail if JWT_SECRET is too short in production', async () => {
      (configService.get as jest.Mock)
        .mockReturnValueOnce('production') // NODE_ENV
        .mockReturnValueOnce('false') // ENABLE_QUICK_ACCESS
        .mockReturnValueOnce('short') // JWT_SECRET
        .mockReturnValueOnce('valid-32-char-encryption-key!!'); // ENCRYPTION_KEY

      await expect(service.validateSecurityConfiguration()).rejects.toThrow(
        'Security validation failed: JWT_SECRET must be at least 32 characters in production',
      );
    });

    it('should fail if ENCRYPTION_KEY is wrong length in production', async () => {
      (configService.get as jest.Mock)
        .mockReturnValueOnce('production') // NODE_ENV
        .mockReturnValueOnce('false') // ENABLE_QUICK_ACCESS
        .mockReturnValueOnce('valid-secret-key-at-least-32-chars-long') // JWT_SECRET
        .mockReturnValueOnce('invalid-length-key'); // ENCRYPTION_KEY

      await expect(service.validateSecurityConfiguration()).rejects.toThrow(
        'Security validation failed: ENCRYPTION_KEY must be exactly 32 characters (AES-256)',
      );
    });

    it('should fail if ENABLE_QUICK_ACCESS is enabled in production', async () => {
      (configService.get as jest.Mock)
        .mockReturnValueOnce('production') // NODE_ENV
        .mockReturnValueOnce('true') // ENABLE_QUICK_ACCESS
        .mockReturnValueOnce('valid-secret-key-at-least-32-chars-long') // JWT_SECRET
        .mockReturnValueOnce('valid-32-char-encryption-key!!'); // ENCRYPTION_KEY

      await expect(service.validateSecurityConfiguration()).rejects.toThrow(
        'Security validation failed: ENABLE_QUICK_ACCESS should not be enabled in production',
      );
    });
  });

  describe('implementOWASPTop10Measures', () => {
    it('should execute without throwing errors', async () => {
      await expect(service.implementOWASPTop10Measures()).resolves.not.toThrow();
    });
  });

  describe('performGDPRComplianceChecks', () => {
    it('should execute without throwing errors', async () => {
      await expect(service.performGDPRComplianceChecks()).resolves.not.toThrow();
    });
  });

  describe('verifyRateLimitingConfiguration', () => {
    it('should execute without throwing errors', async () => {
      await expect(service.verifyRateLimitingConfiguration()).resolves.not.toThrow();
    });
  });

  describe('optimizeConnectionPooling', () => {
    it('should execute without throwing errors', async () => {
      await expect(service.optimizeConnectionPooling()).resolves.not.toThrow();
    });
  });
});