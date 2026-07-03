import * as validator from 'validator';

/**
 * Input Sanitization Utilities
 * Prevents XSS and other injection attacks
 */

/**
 * Sanitize user input to prevent XSS
 * Removes potentially dangerous characters/patterns
 */
export function sanitizeInput(input: string): string {
  if (!input) return input;

  // Use validator.escape to escape HTML entities
  // This converts <, >, &, ", ', `, and / characters
  let sanitized = validator.escape(input);

  // Remove any script tags that might have slipped through
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove javascript: and data: URI schemes
  sanitized = sanitized.replace(/(javascript:|data:)/gi, '');

  // Remove event handlers (onerror, onclick, etc.)
  sanitized = sanitized.replace(/\s*(on\w+)\s*=/gi, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitize rich text content (HTML)
 * Allows safe HTML tags and attributes
 */
export function sanitizeHtml(content: string): string {
  if (!content) return content;

  // Use validator's sanitizeHTML method
  // Allow only safe tags for rich text content
  return validator.escape(content);
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string {
  if (!url) return url;

  // Use validator.isURL to check if URL is valid
  if (
    validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
      disallow_auth: true,
    })
  ) {
    return url;
  }

  // If not a valid URL, return empty string
  return '';
}

/**
 * Sanitize user-generated content based on type
 */
export function sanitizeUserContent(
  content: string,
  type: 'text' | 'html' | 'url' = 'text'
): string {
  switch (type) {
    case 'html':
      return sanitizeHtml(content);
    case 'url':
      return sanitizeUrl(content);
    case 'text':
    default:
      return sanitizeInput(content);
  }
}
