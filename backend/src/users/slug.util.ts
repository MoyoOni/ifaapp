/**
 * Generates a URL-safe slug from a display name.
 * Strips non-alphanumeric characters, lowercases, trims to 28 chars.
 * Optionally appends a suffix (e.g. short timestamp) to resolve conflicts.
 */
export function generateSlug(base: string, suffix?: string): string {
  const clean = base
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 28);
  return suffix ? `${clean}${suffix}` : clean;
}
