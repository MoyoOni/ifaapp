/**
 * Formats an appointment's scheduled time for display (P2-03).
 *
 * Given a real `scheduledAt` UTC instant, `Intl.DateTimeFormat` with an
 * explicit `timeZone` renders it correctly in that zone regardless of the
 * viewer's own device/browser timezone — unlike `new Date(...).toLocaleString()`
 * on a raw `date`+`time` string, which silently reinterprets the wall-clock
 * value in the *viewer's* local zone instead of the appointment's.
 */
export function formatScheduledAt(
  scheduledAt: string | Date,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }
): string {
  const instant = typeof scheduledAt === 'string' ? new Date(scheduledAt) : scheduledAt;
  return new Intl.DateTimeFormat('en-US', { ...options, timeZone: timezone }).format(instant);
}
