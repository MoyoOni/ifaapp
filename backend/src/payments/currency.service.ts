import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Currency } from '@ile-ase/common';

/**
 * Currency Service
 * Handles currency conversion with rate caching
 */
@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private readonly cacheTTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly feePercentage = 0.015; // 1.5% fee for cross-border transactions

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
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

    // TODO: Implement Redis cache for production

    // Check if we have a cache table in Prisma
    // For MVP, we'll use a simple approach with a cache table
    try {
      const cacheKey = `${from}_${to}`;
      // Use a simpler approach without typed raw queries for now
      const cached = (await this.prisma.$queryRawUnsafe(
        `SELECT rate, cached_at FROM currency_cache WHERE cache_key = $1 AND cached_at > NOW() - INTERVAL '24 hours' LIMIT 1`,
        cacheKey
      )) as any[];

      if (cached && cached.length > 0) {
        return {
          rate: cached[0].rate,
          cachedAt: cached[0].cached_at,
        };
      }

      // Fetch live rate from external provider
      const rate = await this.fetchLiveRate(from, to);

      // Cache the rate
      try {
        await this.prisma.$queryRawUnsafe(
          `INSERT INTO currency_cache (cache_key, rate, cached_at) VALUES ($1, $2, NOW())
                     ON CONFLICT (cache_key) DO UPDATE SET rate = EXCLUDED.rate, cached_at = EXCLUDED.cached_at`,
          cacheKey,
          rate
        );
      } catch (error) {
        // Handle case where currency_cache table doesn't exist yet
        this.logger.warn(`Could not cache rate: ${(error as any).message}`);
      }

      return {
        rate,
        cachedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get exchange rate: ${(error as any).message}`);

      if (includeExpired) {
        const cacheKey = `${from}_${to}`;
        const expiredCache = (await this.prisma.$queryRawUnsafe(
          `SELECT rate, cached_at FROM currency_cache WHERE cache_key = $1 ORDER BY cached_at DESC LIMIT 1`,
          cacheKey
        )) as any[];

        if (expiredCache && expiredCache.length > 0) {
          return {
            rate: expiredCache[0].rate,
            cachedAt: expiredCache[0].cached_at,
          };
        }
      }

      // Fallback to fetching live rate
      const rate = await this.fetchLiveRate(from, to);
      return {
        rate,
        cachedAt: null,
      };
    }
  }

  /**
   * Fetch live rate from external provider
   */
  private async fetchLiveRate(from: Currency, to: Currency): Promise<number> {
    // In a real implementation, this would call an external API
    // For now, return a mock rate based on currency pair
    if (from === Currency.USD && to === Currency.NGN) return 1500; // Example: 1 USD = 1500 NGN
    if (from === Currency.NGN && to === Currency.USD) return 0.00067; // Reverse of above
    if (from === to) return 1;

    // Default fallback
    return 1;
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
