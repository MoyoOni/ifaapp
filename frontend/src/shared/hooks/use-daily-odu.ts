import { useMemo } from 'react';
import { ODU_CORPUS, type Odu } from '@/shared/data/odu-corpus';

/**
 * Yoruba day names mapped to JavaScript's Date.getDay() (0 = Sunday).
 */
const YORUBA_DAYS = [
  'Ọjọ́ Àìkú',    // Sunday - Day of Immortality
  'Ọjọ́ Ajé',     // Monday - Day of Wealth
  'Ọjọ́ Ìṣégun',  // Tuesday - Day of Victory
  'Ọjọ́ Rírú',    // Wednesday - Day of Confusion/Resolution
  'Ọjọ́ Bọ̀',      // Thursday - Day of Feeding (offerings)
  'Ọjọ́ Ẹtì',     // Friday - Day of Rest/Ears
  'Ọjọ́ Àbámẹ́ta', // Saturday - Day of Three Encounters
] as const;

/**
 * Simple string hash for deterministic Odu selection.
 * Same date string always produces the same index.
 */
function hashDateToIndex(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % ODU_CORPUS.length;
}

/**
 * Formats the day of the month with an English ordinal suffix.
 */
function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

export interface DailyOduResult {
  /** The selected Odu for today */
  odu: Odu;
  /** Yoruba day name (e.g., "Ọjọ́ Ajé") */
  yorubaDay: string;
  /** Formatted date string (e.g., "February 25th") */
  formattedDate: string;
  /** Full display string (e.g., "Ọjọ́ Ajé, February 25th — Odu: Eji Ogbe") */
  displayString: string;
}

/**
 * Returns today's Odu and formatted date with Yoruba day name.
 * Deterministic: same day always returns the same Odu.
 * Memoized so it doesn't recompute on every render.
 */
export function useDailyOdu(): DailyOduResult {
  return useMemo(() => {
    return getDailyOdu(new Date());
  }, []);
}

/**
 * Pure function for computing the daily Odu from a given date.
 * Exported for testing.
 */
export function getDailyOdu(date: Date): DailyOduResult {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();
  const dayOfWeek = date.getDay();

  // Create a stable date string for hashing
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const index = hashDateToIndex(dateStr);
  const odu = ODU_CORPUS[index];
  const yorubaDay = YORUBA_DAYS[dayOfWeek];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const formattedDate = `${months[month]} ${day}${getOrdinalSuffix(day)}`;

  const displayString = `${yorubaDay}, ${formattedDate} — Odu: ${odu.name}`;

  return { odu, yorubaDay, formattedDate, displayString };
}
