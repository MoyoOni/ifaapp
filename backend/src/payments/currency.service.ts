import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisCacheService } from '../cache/redis-cache.service';
import { Currency } from '@ile-ase/common';

/**
 * Currency Service
 * Handles currency conversion with rate caching
 */
@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private readonly redisTTL = 24 * 60 * 60; // 24 hours in seconds
  private readonly feePercentage = 0.015; // 1.5% fee for cross-border transactions

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private redis: RedisCacheService
  ) {}

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(from: Currency, to: Currency, includeExpired = false) {
    // If same currency, return 1.0
    if (from === to) {
      return {
        rate: 1.0,
        cachedAt: new Date(),
      };
    }

    const redisKey = `exchange_rate:${from}_${to}`;
    const dbKey = `${from}_${to}`;

    // L1: Redis (fast in-memory)
    const redisHit = await this.redis.get<{ rate: number; cachedAt: string }>(redisKey);
    if (redisHit) {
      return { rate: redisHit.rate, cachedAt: new Date(redisHit.cachedAt) };
    }

    // L2: DB cache table
    try {
      const cached = (await this.prisma.$queryRawUnsafe(
        `SELECT rate, cached_at FROM currency_cache WHERE cache_key = $1 AND cached_at > NOW() - INTERVAL '24 hours' LIMIT 1`,
        dbKey
      )) as any[];

      if (cached && cached.length > 0) {
        const result = { rate: cached[0].rate, cachedAt: cached[0].cached_at };
        // Backfill Redis so the next request is faster
        await this.redis.set(redisKey, result, this.redisTTL);
        return result;
      }

      // Cache miss — fetch live rate
      const rate = await this.fetchLiveRate(from, to);
      const cachedAt = new Date();

      // Write to DB cache
      try {
        await this.prisma.$queryRawUnsafe(
          `INSERT INTO currency_cache (cache_key, rate, cached_at) VALUES ($1, $2, NOW())
           ON CONFLICT (cache_key) DO UPDATE SET rate = EXCLUDED.rate, cached_at = EXCLUDED.cached_at`,
          dbKey,
          rate
        );
      } catch (error) {
        this.logger.warn(`Could not write DB cache: ${(error as any).message}`);
      }

      // Write to Redis
      await this.redis.set(redisKey, { rate, cachedAt }, this.redisTTL);

      return { rate, cachedAt };
    } catch (error) {
      this.logger.error(`Failed to get exchange rate: ${(error as any).message}`);

      if (includeExpired) {
        const expiredCache = (await this.prisma.$queryRawUnsafe(
          `SELECT rate, cached_at FROM currency_cache WHERE cache_key = $1 ORDER BY cached_at DESC LIMIT 1`,
          dbKey
        )) as any[];

        if (expiredCache && expiredCache.length > 0) {
          return { rate: expiredCache[0].rate, cachedAt: expiredCache[0].cached_at };
        }
      }

      const rate = await this.fetchLiveRate(from, to);
      return { rate, cachedAt: null };
    }
  }

  /**
   * Fetch live rate from external provider
   */
  private async fetchLiveRate(from: Currency, to: Currency): Promise<number> {
    if (from === to) return 1;

    // In a real implementation, this would call an external FX rate API.
    // Only the two pairs below have a real (if hardcoded) rate. EMG-07: this
    // used to silently `return 1` for every other pair — a diaspora GBP/EUR/
    // CAD payment "converted" at a 1:1 rate instead of the real rate would
    // silently over- or under-charge by orders of magnitude. Fail loudly
    // instead of guessing.
    if (from === Currency.USD && to === Currency.NGN) return 1500; // Example: 1 USD = 1500 NGN
    if (from === Currency.NGN && to === Currency.USD) return 0.00067; // Reverse of above

    throw new BadRequestException(`Currency conversion from ${from} to ${to} is not supported yet`);
  }

  /**
   * Convert amount from one currency to another
   */
  async convertAmount(
    amount: number,
    from: Currency,
    to: Currency,
    includeFees: boolean = false
  ): Promise<{ convertedAmount: number; rate: number; fees?: number }> {
    const { rate } = await this.getExchangeRate(from, to);
    let convertedAmount = amount * rate;

    if (includeFees) {
      // Apply fees for cross-border transactions
      const fees = this.calculateFees(convertedAmount, from, to);
      convertedAmount -= fees;
      return { convertedAmount, rate, fees };
    }

    return { convertedAmount, rate };
  }

  /**
   * Calculate fees for currency conversion
   */
  private calculateFees(amount: number, from: Currency, to: Currency): number {
    // Only apply fees for cross-border transactions
    if (from !== to) {
      return amount * this.feePercentage;
    }
    return 0;
  }

  /**
   * Get supported currencies for conversion
   */
  getSupportedCurrencies(baseCurrency: Currency): Currency[] {
    // Return all available currencies except the base currency
    const allCurrencies = Object.values(Currency);
    return allCurrencies.filter((currency) => currency !== baseCurrency);
  }
}
