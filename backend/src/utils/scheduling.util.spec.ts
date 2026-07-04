import { combineDateTimeInZone, formatScheduledAt } from './scheduling.util';
import { BadRequestException } from '@nestjs/common';

describe('combineDateTimeInZone (P2-03)', () => {
  it('combines a date+time in Africa/Lagos (UTC+1, no DST) into the correct UTC instant', () => {
    const result = combineDateTimeInZone('2026-08-01', '14:30', 'Africa/Lagos');
    expect(result.toISOString()).toBe('2026-08-01T13:30:00.000Z');
  });

  it('combines a date+time in America/New_York during EDT (UTC-4) into the correct UTC instant', () => {
    const result = combineDateTimeInZone('2026-08-01', '09:00', 'America/New_York');
    expect(result.toISOString()).toBe('2026-08-01T13:00:00.000Z');
  });

  it('combines a date+time in America/New_York during EST (UTC-5) into the correct UTC instant', () => {
    // January is outside DST for the US.
    const result = combineDateTimeInZone('2026-01-15', '09:00', 'America/New_York');
    expect(result.toISOString()).toBe('2026-01-15T14:00:00.000Z');
  });

  it('does not silently assume the server is in the target timezone', () => {
    // Regression guard for the bug this replaces: `new Date(`${date}T${time}`)`
    // is interpreted in the *server's* local time, not the appointment's
    // timezone. Lagos and New York must produce different UTC instants for
    // the same wall-clock date+time.
    const lagos = combineDateTimeInZone('2026-08-01', '09:00', 'Africa/Lagos');
    const newYork = combineDateTimeInZone('2026-08-01', '09:00', 'America/New_York');
    expect(lagos.getTime()).not.toBe(newYork.getTime());
  });

  it('throws BadRequestException for an unparseable date/time', () => {
    expect(() => combineDateTimeInZone('not-a-date', '99:99', 'Africa/Lagos')).toThrow(
      BadRequestException,
    );
  });
});

describe('formatScheduledAt (P2-03)', () => {
  it('formats a UTC instant back into the target zone local wall-clock time', () => {
    const utcInstant = new Date('2026-08-01T13:30:00.000Z');
    const formatted = formatScheduledAt(utcInstant, 'Africa/Lagos', 'yyyy-MM-dd HH:mm');
    expect(formatted).toBe('2026-08-01 14:30');
  });
});
