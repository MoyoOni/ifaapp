import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =============================================================================
// Date Formatting Utilities
// =============================================================================

/**
 * Format a date string to a human-readable format
 * @param dateString - ISO date string or Date object
 * @param options - Intl.DateTimeFormatOptions
 */
export function formatDate(
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format date with time
 */
export function formatDateTime(dateString: string | Date): string {
  return formatDate(dateString, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Get day, month, and time from a date (for event cards)
 */
export function getDayAndMonth(dateString: string | Date): {
  day: number;
  month: string;
  time: string;
} {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return {
    day: date.getDate(),
    month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
    time: date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffWeek < 4) return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`;
  if (diffMonth < 12) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
  return formatDate(date, { year: 'numeric', month: 'short', day: 'numeric' });
}

// =============================================================================
// Price/Currency Formatting Utilities
// =============================================================================

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  EUR: '€',
  GBP: '£',
  GHS: '₵',
  KES: 'KSh',
};

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
}

/**
 * Format a price with currency symbol
 * @param price - The price value
 * @param currency - Currency code (e.g., 'NGN', 'USD')
 * @param options - Additional options
 */
export function formatPrice(
  price: number,
  currency: string = 'NGN',
  options: { showFree?: boolean; decimals?: number } = {}
): string {
  const { showFree = true, decimals = 0 } = options;

  if (price === 0 && showFree) {
    return 'Free';
  }

  const symbol = getCurrencySymbol(currency);
  const formattedNumber = price.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${symbol}${formattedNumber}`;
}

/**
 * Format a price range
 */
export function formatPriceRange(
  minPrice: number,
  maxPrice: number,
  currency: string = 'NGN'
): string {
  if (minPrice === maxPrice) {
    return formatPrice(minPrice, currency);
  }
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${minPrice.toLocaleString()} - ${symbol}${maxPrice.toLocaleString()}`;
}

// =============================================================================
// String Utilities
// =============================================================================

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert enum-style string to readable format
 * e.g., "UNDER_REVIEW" -> "Under Review"
 */
export function formatEnumLabel(value: string): string {
  return titleCase(value.replace(/_/g, ' '));
}

// =============================================================================
// Validation Utilities
// =============================================================================

/**
 * Check if a string is a valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if a password meets minimum requirements
 */
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  return { valid: true };
}
