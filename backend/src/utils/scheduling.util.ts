import { zonedTimeToUtc, utcToZonedTime, format as formatInTz } from 'date-fns-tz';
import { BadRequestException } from '@nestjs/common';

/**
 * Combines a `date` ("YYYY-MM-DD"), `time` ("HH:mm", 24-hour) and IANA
 * `timezone` string into the single UTC instant they represent (P2-03).
 *
 * `new Date(`${date}T${time}`)` — the pattern this replaces throughout the
 * codebase — is interpreted by the JS Date constructor as the *server's*
 * local time, silently ignoring `timezone` entirely. That's only correct if
 * the server happens to run in the same zone as the appointment, which is
 * not guaranteed and wasn't actually true for the default "Africa/Lagos"
 * whenever the server itself runs in UTC.
 */
export function combineDateTimeInZone(date: string, time: string, timezone: string): Date {
  const result = zonedTimeToUtc(`${date} ${time}:00`, timezone);
  if (isNaN(result.getTime())) {
    throw new BadRequestException(
      `Could not interpret date "${date}", time "${time}" in timezone "${timezone}"`
    );
  }
  return result;
}

/** Formats a UTC instant back into the given IANA zone's local wall-clock date/time. */
export function formatScheduledAt(
  scheduledAt: Date,
  timezone: string,
  pattern = 'yyyy-MM-dd HH:mm zzz'
): string {
  const zoned = utcToZonedTime(scheduledAt, timezone);
  return formatInTz(zoned, pattern, { timeZone: timezone });
}
