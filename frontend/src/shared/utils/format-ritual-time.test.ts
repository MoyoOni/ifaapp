import { describe, it, expect } from 'vitest';
import { formatRitualDateTime } from './format-ritual-time';

// COMMUNITY_BACKLOG.md FOR-013: cross-timezone ritual display (platform
// owner decision, July 29, 2026).
describe('formatRitualDateTime', () => {
  it('formats the same instant differently for local vs. WAT when they differ', () => {
    // 2026-01-15T02:00:00Z is 2026-01-15 03:00 WAT (UTC+1, no DST)
    const { wat } = formatRitualDateTime('2026-01-15T02:00:00Z');
    expect(wat).toContain('3:00');
    expect(wat).toContain('Jan');
  });

  it('accepts a Date object as well as a string', () => {
    const result = formatRitualDateTime(new Date('2026-06-01T12:00:00Z'));
    expect(result.local).toBeTruthy();
    expect(result.wat).toBeTruthy();
  });

  it('WAT formatting is stable regardless of the viewer\'s own local timezone', () => {
    const a = formatRitualDateTime('2026-03-20T18:30:00Z');
    const b = formatRitualDateTime('2026-03-20T18:30:00Z');
    expect(a.wat).toBe(b.wat);
  });
});
