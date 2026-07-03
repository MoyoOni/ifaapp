import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthService', () => {
  let service: HealthService;
  let prisma: PrismaService;
  let config: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              // All optional services disabled so only DB is checked
              if (key === 'PAYSTACK_SECRET_KEY') return undefined;
              if (key === 'FLUTTERWAVE_SECRET_KEY') return undefined;
              if (key === 'AWS_ACCESS_KEY_ID') return undefined;
              if (key === 'SENDGRID_API_KEY') return undefined;
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prisma = module.get<PrismaService>(PrismaService);
    config = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDetailed', () => {
    it('should return healthy when database is up and optional services disabled', async () => {
      const result = await service.getDetailed();
      expect(result.status).toBe('healthy');
      expect(result.timestamp).toBeDefined();
      expect(result.services.database.status).toBe('up');
      expect(result.services.database.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.services.paystack.status).toBe('disabled');
      expect(result.services.flutterwave.status).toBe('disabled');
      expect(result.services.s3.status).toBe('disabled');
      expect(result.services.sendgrid.status).toBe('disabled');
    });

    it('should return unhealthy when database is down', async () => {
      jest.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('Connection refused'));
      const result = await service.getDetailed();
      expect(result.status).toBe('unhealthy');
      expect(result.services.database.status).toBe('down');
      expect(result.services.database.message).toContain('Connection refused');
    });
  });

  describe('isHealthy', () => {
    it('should return true when getDetailed status is not unhealthy', async () => {
      expect(await service.isHealthy()).toBe(true);
    });

    it('should return false when database is down', async () => {
      jest.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('DB down'));
      expect(await service.isHealthy()).toBe(false);
    });
  });
});
