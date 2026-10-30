import { isInternationalShipment, normalizeCountry } from './country.util';

describe('country.util (MSP-009)', () => {
  it('treats the spellings of Nigeria people actually type as one country', () => {
    for (const c of ['Nigeria', 'nigeria ', 'NG', 'NGA', 'Naija', 'Federal Republic of Nigeria']) {
      expect(normalizeCountry(c)).toBe('nigeria');
    }
  });

  it('marks an order leaving the vendor\'s country as international', () => {
    expect(isInternationalShipment('United Kingdom', 'Nigeria')).toBe(true);
    expect(isInternationalShipment('Brasil', 'Nigeria')).toBe(true);
    expect(isInternationalShipment('ng', 'Nigeria')).toBe(false);
    expect(isInternationalShipment('UK', 'United Kingdom')).toBe(false);
  });

  it('is not international without a destination, and assumes Nigeria when the vendor has none', () => {
    expect(isInternationalShipment('', 'Nigeria')).toBe(false);
    expect(isInternationalShipment(undefined, 'Nigeria')).toBe(false);
    expect(isInternationalShipment('Nigeria', null)).toBe(false);
    expect(isInternationalShipment('Ghana', null)).toBe(true);
  });
});
