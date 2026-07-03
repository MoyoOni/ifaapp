import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisCacheService } from '../cache/redis-cache.service';
import { Currency } from '@ile-ase/common';

describe('CurrencyService', () => {
  let service: CurrencyService;

  const mockPrismaService = {
    $queryRawUnsafe: jest.fn(),
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRedis.get.mockResolvedValue(null);
    mockPrismaService.$queryRawUnsafe.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisCacheService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);
  });

  describe('getExchangeRate / convertAmount (EMG-07)', () => {
    it('returns 1.0 for the same currency without hitting cache or gateway lookups', async () => {
      const result = await service.getExchangeRate(Currency.NGN, Currency.NGN);
      expect(result.rate).toBe(1.0);
      expect(mockRedis.get).not.toHaveBeenCalled();
    });

    it('returns the known hardcoded rate for USD -> NGN', async () => {
      const result = await service.getExchangeRate(Currency.USD, Currency.NGN);
      expect(result.rate).toBe(1500);
    });

    it('returns the known hardcoded rate for NGN -> USD', async () => {
      const result = await service.getExchangeRate(Currency.NGN, Currency.USD);
      expect(result.rate).toBe(0.00067);
    });

    it('rejects an unsupported currency pair instead of silently using a 1:1 rate', async () => {
      await expect(service.getExchangeRate(Currency.GBP, Currency.NGN)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects convertAmount for an unsupported pair — no silent wrong-rate conversion', async () => {
      await expect(
        service.convertAmount(1000, Currency.EUR, Currency.NGN),
      ).rejects.toThrow(BadRequestException);
    });

    it('never caches a rate of 1 for an unsupported pair', async () => {
      await expect(service.getExchangeRate(Currency.EUR, Currency.USD)).rejects.toThrow(
        BadRequestException,
      );
      // The old behavior would have cached `rate: 1` here — assert it never
      // reaches the point of writing that value to Redis or the DB cache.
      expect(mockRedis.set).not.toHaveBeenCalled();
    });
  });
});
