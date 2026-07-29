// COMMUNITY_BACKLOG.md FOR-013: cross-timezone ritual coordination
// (platform owner decision, July 29, 2026). Sacred events are stored as a
// single instant; the diaspora community needs to see it both in their own
// local time AND anchored to Nigeria (WAT), since ritual timing (dawn,
// dusk) is culturally tied to that reference point.
const WAT_TIME_ZONE = 'Africa/Lagos';

export function formatRitualDateTime(dateInput: string | Date): { local: string; wat: string } {
  const date = new Date(dateInput);

  const localFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const watFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: WAT_TIME_ZONE,
  });

  return { local: localFormatter.format(date), wat: watFormatter.format(date) };
}

export function isViewerInWatTimeZone(): boolean {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone === WAT_TIME_ZONE;
  } catch {
    return false;
  }
}
