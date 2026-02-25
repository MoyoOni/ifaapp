/**
 * Seeded random number generator.
 * Given the same seed string, always returns the same sequence of numbers.
 * Used to replace Math.random() in render paths so values don't flicker.
 */

/**
 * Simple hash function that converts a string seed into a 32-bit integer.
 * Based on the djb2 algorithm.
 */
function hashSeed(seed: string): number {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Returns a deterministic number between 0 (inclusive) and 1 (exclusive)
 * for the given seed string. Same seed always returns the same number.
 *
 * @param seed - A string identifier (e.g., user ID, entity ID)
 * @returns A number between 0 and 1
 */
export function seededRandom(seed: string): number {
  const hash = hashSeed(seed);
  // Use the hash to produce a float between 0 and 1
  return (hash % 10000) / 10000;
}

/**
 * Returns a deterministic integer in [min, max] (inclusive) for the given seed.
 *
 * @param seed - A string identifier
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns A deterministic integer
 */
export function seededRandomInt(seed: string, min: number, max: number): number {
  const r = seededRandom(seed);
  return Math.floor(r * (max - min + 1)) + min;
}

/**
 * Returns a deterministic float in [min, max) for the given seed,
 * rounded to the specified number of decimal places.
 *
 * @param seed - A string identifier
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (exclusive)
 * @param decimals - Number of decimal places (default: 1)
 * @returns A deterministic float
 */
export function seededRandomFloat(seed: string, min: number, max: number, decimals = 1): number {
  const r = seededRandom(seed);
  const value = r * (max - min) + min;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Generates a deterministic ID suffix from a seed. Useful for generating
 * confirmation codes or slugs without Math.random().
 *
 * @param seed - A string identifier
 * @param length - Length of the output string (default: 6)
 * @returns An alphanumeric string
 */
export function seededId(seed: string, length = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  let hash = hashSeed(seed);
  for (let i = 0; i < length; i++) {
    result += chars[hash % chars.length];
    hash = hashSeed(seed + result);
  }
  return result;
}

/**
 * Returns a deterministic future date within a range of days from now.
 * The date is stable for the same seed on the same day.
 *
 * @param seed - A string identifier
 * @param maxDays - Maximum days in the future (default: 7)
 * @returns An ISO date string
 */
export function seededFutureDate(seed: string, maxDays = 7): string {
  // Include today's date in the seed so it changes daily but not per-render
  const today = new Date().toISOString().split('T')[0];
  const days = seededRandomInt(`${seed}-${today}`, 1, maxDays);
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(10, 0, 0, 0); // Normalize time
  return date.toISOString();
}
