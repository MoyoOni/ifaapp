import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SecretsService } from './secrets.service';

// Mock AWS SDK
jest.mock('@aws-sdk/client-secrets-manager', () => ({
  SecretsManagerClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  GetSecretValueCommand: jest.fn(),
}));

describe('SecretsService', () => {
  let service: SecretsService;
  let configService: ConfigService;
  let mockSecretsManagerClient: any;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecretsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SecretsService>(SecretsService);
    configService = module.get<ConfigService>(ConfigService);

    // Get the mocked client from the service
    mockSecretsManagerClient = (service as any).secretsManagerClient;
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'AWS_REGION') return 'us-east-1';
        return undefined;
      });
    });

    it('should not initialize AWS Secrets Manager client in development', () => {
      // Reinitialize service to trigger constructor
      const newService = new SecretsService(configService);
      expect((newService as any).secretsManagerClient).toBeNull();
    });

    it('should return environment variable value in development', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'TEST_SECRET') return 'test-value';
        return undefined;
      });

      const result = await service.getSecret('test/secret');
      expect(result).toBe('test-value');
      expect(configService.get).toHaveBeenCalledWith('TEST_SECRET');
    });

    it('should throw error if environment variable is not set in development', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        return undefined;
      });

      await expect(service.getSecret('test/secret')).rejects.toThrow(
        'Environment variable TEST_SECRET is not set'
      );
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'AWS_REGION') return 'us-east-1';
        return undefined;
      });
    });

    it('should initialize AWS Secrets Manager client in production', () => {
      const newService = new SecretsService(configService);
      expect((newService as any).secretsManagerClient).not.toBeNull();
    });

    it('should return AWS Secrets Manager value in production', async () => {
      const mockSend = jest.fn().mockResolvedValue({
        SecretString: 'aws-secret-value',
      });
      mockSecretsManagerClient.send = mockSend;

      const result = await service.getSecret('iluase/prod/test-secret');
      expect(result).toBe('aws-secret-value');
      expect(mockSend).toHaveBeenCalled();
    });

    it('should fall back to environment variable if AWS Secrets Manager fails', async () => {
      const mockSend = jest.fn().mockRejectedValue(new Error('AWS Error'));
      mockSecretsManagerClient.send = mockSend;

      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'AWS_REGION') return 'us-east-1';
        if (key === 'TEST_SECRET') return 'fallback-value';
        return undefined;
      });

      const result = await service.getSecret('test/secret');
      expect(result).toBe('fallback-value');
      expect(mockSend).toHaveBeenCalled();
    });

    it('should throw error if both AWS Secrets Manager and environment variable fail', async () => {
      const mockSend = jest.fn().mockRejectedValue(new Error('AWS Error'));
      mockSecretsManagerClient.send = mockSend;

      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'AWS_REGION') return 'us-east-1';
        return undefined;
      });

      await expect(service.getSecret('test/secret')).rejects.toThrow(
        'Environment variable TEST_SECRET is not set and secret test/secret not found in AWS Secrets Manager'
      );
    });
  });

  describe('convertToEnvVarName', () => {
    it('should convert secret names to environment variable names', () => {
      const service = new SecretsService(configService);
      const result = (service as any).convertToEnvVarName('iluase/prod/sentry-dsn');
      expect(result).toBe('SENTRY_DSN');
    });

    it('should handle various formats', () => {
      const service = new SecretsService(configService);
      expect((service as any).convertToEnvVarName('test/secret')).toBe('SECRET');
      expect((service as any).convertToEnvVarName('my-app/prod/api-key')).toBe('API_KEY');
      expect((service as any).convertToEnvVarName('single')).toBe('SINGLE');
    });
  });
});
