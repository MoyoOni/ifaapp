import { LocationService } from './location.service';
import { PrismaService } from '../prisma/prisma.service';

// Code-health pass (November 6, 2026).
describe('LocationService', () => {
  const findUnique = jest.fn();
  const service = new LocationService({ user: { findUnique } } as unknown as PrismaService);
  const fetchSpy = jest.spyOn(global, 'fetch');

  beforeEach(() => jest.clearAllMocks());

  describe('extractCountryFromLocation', () => {
    it.each([
      ['Lagos, Nigeria', 'NG'],
      ['NG', 'NG'],
      ['gh', 'GH'],
      ['Accra, Ghana.', 'GH'],
      ['London, UK', 'GB'],
      ['Houston, USA', 'US'],
      ['Cape Town, South Africa', 'ZA'],
      ['Okuku, Osun', null], // used to read as the UK
      ['Ìbàdàn', null],
      ['Lukasa', null],
      ['', null],
    ])('%s → %s', (location, expected) => expect(service.extractCountryFromLocation(location)).toBe(expected));
  });

  describe('getUserCountry', () => {
    it('prefers the profile location', async () => {
      findUnique.mockResolvedValue({ location: 'Abeokuta, Nigeria' });
      await expect(service.getUserCountry('u', 'GB')).resolves.toBe('NG');
    });

    it('falls back to the CloudFront viewer country, and never calls an IP lookup service', async () => {
      findUnique.mockResolvedValue({ location: 'Ọ̀yọ́' });
      await expect(service.getUserCountry('u', 'gb')).resolves.toBe('GB');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('ignores a malformed header and survives a database error', async () => {
      findUnique.mockResolvedValue(null);
      await expect(service.getUserCountry('u', 'not-a-country')).resolves.toBeNull();
      findUnique.mockRejectedValue(new Error('db down'));
      await expect(service.getUserCountry('u', 'KE')).resolves.toBe('KE');
    });
  });

  describe('getProviderForCountry', () => {
    it('routes Nigeria or naira to Paystack, everything else to Flutterwave', () => {
      expect(service.getProviderForCountry('NG', 'USD')).toBe('PAYSTACK');
      expect(service.getProviderForCountry(null, 'NGN')).toBe('PAYSTACK');
      expect(service.getProviderForCountry('GH', 'GHS')).toBe('FLUTTERWAVE');
      expect(service.getProviderForCountry('GB', 'GBP')).toBe('FLUTTERWAVE');
      expect(service.getProviderForCountry(null, 'USD')).toBe('FLUTTERWAVE');
    });
  });
});
