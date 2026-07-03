import { AxiosError } from 'axios';
import { parseApiError, type ParsedApiError } from '@/shared/utils/api-error';

/**
 * Custom HTTP error handler for API requests.
 * Delegates to shared parseApiError for consistent, user-friendly messages.
 * Use parseApiError() or useApiErrorHandler() from shared/utils for new code.
 */
export class CustomHttpErrorHandler {
  /**
   * Generates a user-friendly error message based on the HTTP status code.
   * @param error The Axios error object (or any thrown value)
   * @returns An object containing a user-friendly message and recovery suggestions
   */
  static handle(error: AxiosError | unknown): {
    userMessage: string;
    recoverySuggestions: string[];
    originalError: unknown;
  } {
    const parsed: ParsedApiError = parseApiError(error);
    return {
      userMessage: parsed.userMessage,
      recoverySuggestions: parsed.recoverySuggestions,
      originalError: parsed.originalError,
    };
  }
}
