/**
 * Yoruba Validation Utilities
 * Handles Unicode NFC normalization and validation for Yoruba text
 */

/**
 * Normalize Yoruba text to Unicode NFC form
 * Ensures proper diacritic handling (e.g., "ọ" vs "o")
 */
export function normalizeYorubaText(text: string): string {
  if (!text) return text;

  // Normalize to Unicode NFC (Canonical Composition)
  // This ensures that characters like "ọ" (U+1ECD) are properly composed
  return text.normalize('NFC');
}

/**
 * Validate Yoruba name input
 * Checks for proper Yoruba characters and diacritics
 */
export function validateYorubaName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: true }; // Empty is allowed (optional field)
  }

  // Normalize first
  const normalized = normalizeYorubaText(name);

  // Check for invalid characters (only allow letters, spaces, hyphens, apostrophes, and Yoruba diacritics)
  const validPattern = /^[\p{L}\s\-'ẹọṣẹọàáâãäèéêëìíîïòóôõöùúûü]+$/u;

  if (!validPattern.test(normalized)) {
    return {
      valid: false,
      error: 'Name contains invalid characters. Please use proper Yoruba diacritics.',
    };
  }

  // Check length
  if (normalized.length > 100) {
    return {
      valid: false,
      error: 'Name must be 100 characters or less.',
    };
  }

  return { valid: true };
}

/**
 * Get diacritic helper text for input fields
 */
export function getDiacriticHelperText(): string {
  return `💡 Tip: Use proper Yoruba diacritics:
  • ẹ (e with dot below) - not "e"
  • ọ (o with dot below) - not "o"
  • ṣ (s with dot below) - not "s"
  • à, á, â, ã, ä (a with accents)
  • è, é, ê, ë (e with accents)
  • ì, í, î, ï (i with accents)
  • ò, ó, ô, õ, ö (o with accents)
  • ù, ú, û, ü (u with accents)`;
}
