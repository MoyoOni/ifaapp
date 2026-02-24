import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Location Service
 * Detects user location for payment gateway routing
 */
@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {}

  /**
   * Get user country from profile or IP
   */
  async getUserCountry(userId: string, ipAddress?: string): Promise<string | null> {
    try {
      // First, try to get from user profile
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { location: true },
      });

      if (user?.location) {
        // Try to extract country from location string
        // Location format could be "Lagos, Nigeria" or "NG" or "Nigeria"
        const country = this.extractCountryFromLocation(user.location);
        if (country) {
          return country;
        }
      }

      // Fallback to IP geolocation if available
      if (ipAddress) {
        return await this.getCountryFromIP(ipAddress);
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to get user country: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Extract country code from location string
   */
  private extractCountryFromLocation(location: string): string | null {
    // Common country names and codes
    const countryMap: Record<string, string> = {
      nigeria: 'NG',
      'nigeria,': 'NG',
      'nigeria.': 'NG',
      ghana: 'GH',
      kenya: 'KE',
      'south africa': 'ZA',
      'south africa,': 'ZA',
      'south africa.': 'ZA',
      tanzania: 'TZ',
      uganda: 'UG',
      'united kingdom': 'GB',
      uk: 'GB',
      'united states': 'US',
      usa: 'US',
      canada: 'CA',
      'united arab emirates': 'AE',
      uae: 'AE',
    };

    const lowerLocation = location.toLowerCase().trim();

    // Check if it's already a country code (2 letters)
    if (lowerLocation.length === 2 && /^[a-z]{2}$/i.test(lowerLocation)) {
      return lowerLocation.toUpperCase();
    }

    // Check country map
    for (const [key, code] of Object.entries(countryMap)) {
      if (lowerLocation.includes(key)) {
        return code;
      }
    }

    return null;
  }

  /**
   * Get country from IP address using free IP geolocation API
   */
  private async getCountryFromIP(ipAddress: string): Promise<string | null> {
    try {
      // Use ip-api.com (free, no API key required)
      // Rate limit: 45 requests/minute
      const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=countryCode`);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.countryCode || null;
    } catch (error) {
      this.logger.warn(`IP geolocation failed: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Determine payment provider based on country
   */
  getProviderForCountry(countryCode: string | null, currency: string): 'PAYSTACK' | 'FLUTTERWAVE' {
    // Nigeria → Paystack
    if (countryCode === 'NG' || currency === 'NGN') {
      return 'PAYSTACK';
    }

    // Other African countries → Flutterwave
    const africanCountries = [
      'GH',
      'KE',
      'ZA',
      'TZ',
      'UG',
      'RW',
      'ET',
      'EG',
      'MA',
      'TN',
      'DZ',
      'SN',
      'CI',
      'CM',
      'AO',
      'MZ',
      'ZM',
      'ZW',
      'BW',
      'NA',
    ];

    if (countryCode && africanCountries.includes(countryCode)) {
      return 'FLUTTERWAVE';
    }

    // Default: Flutterwave for diaspora (supports more currencies)
    return 'FLUTTERWAVE';
  }
}
