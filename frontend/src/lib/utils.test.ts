import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  getDayAndMonth,
  formatRelativeTime,
  formatPrice,
  getCurrencySymbol,
  truncate,
  titleCase,
  formatEnumLabel,
  isValidEmail,
  isValidPassword,
} from './utils';

describe('Date Formatting Utilities', () => {
  const testDate = '2024-06-15T14:30:00Z';

  it('formatDate formats date correctly', () => {
    const result = formatDate(testDate);
    expect(result).toContain('2024');
    expect(result).toContain('Jun');
  });

  it('formatDateTime includes time', () => {
    const result = formatDateTime(testDate);
    expect(result).toContain('2024');
    expect(result).toMatch(/\d{1,2}:\d{2}/); // Contains time
  });

  it('getDayAndMonth returns correct structure', () => {
    const result = getDayAndMonth(testDate);
    expect(result).toHaveProperty('day');
    expect(result).toHaveProperty('month');
    expect(result).toHaveProperty('time');
    expect(result.day).toBe(15);
  });

  it('formatRelativeTime returns "just now" for recent dates', () => {
    const now = new Date();
    const result = formatRelativeTime(now);
    expect(result).toBe('just now');
  });
});

describe('Price Formatting Utilities', () => {
  it('getCurrencySymbol returns correct symbols', () => {
    expect(getCurrencySymbol('NGN')).toBe('₦');
    expect(getCurrencySymbol('USD')).toBe('$');
    expect(getCurrencySymbol('EUR')).toBe('€');
    expect(getCurrencySymbol('GBP')).toBe('£');
  });

  it('getCurrencySymbol returns code for unknown currencies', () => {
    expect(getCurrencySymbol('XYZ')).toBe('XYZ');
  });

  it('formatPrice formats correctly', () => {
    expect(formatPrice(1000, 'NGN')).toBe('₦1,000');
    expect(formatPrice(50, 'USD')).toBe('$50');
  });

  it('formatPrice shows "Free" for zero price', () => {
    expect(formatPrice(0, 'NGN')).toBe('Free');
  });

  it('formatPrice respects showFree option', () => {
    expect(formatPrice(0, 'NGN', { showFree: false })).toBe('₦0');
  });
});

describe('String Utilities', () => {
  it('truncate shortens long text', () => {
    const longText = 'This is a very long text that should be truncated';
    const result = truncate(longText, 20);
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result).toContain('...');
  });

  it('truncate leaves short text unchanged', () => {
    const shortText = 'Short';
    expect(truncate(shortText, 20)).toBe(shortText);
  });

  it('titleCase capitalizes words', () => {
    expect(titleCase('hello world')).toBe('Hello World');
    expect(titleCase('HELLO WORLD')).toBe('Hello World');
  });

  it('formatEnumLabel converts enum-style strings', () => {
    expect(formatEnumLabel('UNDER_REVIEW')).toBe('Under Review');
    expect(formatEnumLabel('IN_PROGRESS')).toBe('In Progress');
  });
});

describe('Validation Utilities', () => {
  it('isValidEmail validates email format', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.org')).toBe(true);
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('missing@domain')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
  });

  it('isValidPassword checks minimum length', () => {
    expect(isValidPassword('short').valid).toBe(false);
    expect(isValidPassword('short').message).toContain('8 characters');
    expect(isValidPassword('longenoughpassword').valid).toBe(true);
  });
});
