import { isDevoted } from './devoted';

describe('isDevoted -- the one definition of a Devoted member', () => {
  const now = new Date('2026-11-02T12:00:00Z');
  const tomorrow = new Date('2026-11-03T12:00:00Z');
  const yesterday = new Date('2026-11-01T12:00:00Z');

  it('is Devoted while the flag is set and the paid-up date has not passed', () => {
    expect(isDevoted({ subscriptionStatus: 'DEVOTED', subscriptionEnd: tomorrow }, now)).toBe(true);
  });

  it('is not Devoted once the date has passed, even if the flag was never cleared (a failed renewal)', () => {
    expect(isDevoted({ subscriptionStatus: 'DEVOTED', subscriptionEnd: yesterday }, now)).toBe(false);
  });

  it('is not Devoted without a date, or when free, or for no user', () => {
    expect(isDevoted({ subscriptionStatus: 'DEVOTED', subscriptionEnd: null }, now)).toBe(false);
    expect(isDevoted({ subscriptionStatus: 'FREE', subscriptionEnd: tomorrow }, now)).toBe(false);
    expect(isDevoted(null, now)).toBe(false);
  });
});
