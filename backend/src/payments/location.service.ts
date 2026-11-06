import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Location Service
 * Detects user location for payment gateway routing
 */
@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * The member's country: from their profile, else the country CloudFront
   * saw the request come from (passed in by the caller).
   */
  async getUserCountry(userId: string, viewerCountry?: string): Promise<string | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { location: true },
      });
      const fromProfile = user?.location ? this.extractCountryFromLocation(user.location) : null;
      if (fromProfile) return fromProfile;
    } catch (error) {
      this.logger.error(`Failed to get user country: ${(error as Error).message}`);
    }
    return viewerCountry && /^[A-Z]{2}$/i.test(viewerCountry) ? viewerCountry.toUpperCase() : null;
  }

  /**
   * Country code from a free-text location such as "Lagos, Nigeria", "NG"
   * or "Nigeria". Whole words only: matching substrings used to read
   * "Okuku, Osun" as the UK.
   */
  extractCountryFromLocation(location: string): string | null {
    const countries: Record<string, string> = {
      nigeria: 'NG',
      ghana: 'GH',
      kenya: 'KE',
      'south africa': 'ZA',
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

    const lower = location.toLowerCase().trim();
    if (/^[a-z]{2}$/.test(lower)) return lower.toUpperCase();

    for (const [name, code] of Object.entries(countries)) {
      if (new RegExp(`(^|[^\\p{L}])${name}($|[^\\p{L}])`, 'u').test(lower)) return code;
    }
    return null;
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
