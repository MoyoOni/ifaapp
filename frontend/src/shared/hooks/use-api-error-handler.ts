import { useCallback } from 'react';
import { parseApiError, type ParsedApiError } from '@/shared/utils/api-error';
import { useToast } from '@/shared/components/toast';

/**
 * Unified API error handling hook.
 * Use in components that call the API and want consistent user messages and optional toast.
 * Errors are already reported by the api client interceptor; this hook adds parsing + optional UI feedback.
 */
export function useApiErrorHandler() {
  const toast = useToast();

  const parseError = useCallback((error: unknown): ParsedApiError => {
    return parseApiError(error);
  }, []);

  /** Parse error and show user message in a toast. Use in catch blocks. */
  const showError = useCallback(
    (error: unknown, title?: string) => {
      const parsed = parseApiError(error);
      toast.error(parsed.userMessage, title ?? 'Request failed');
    },
    [toast]
  );

  /**
   * Get user message from any API error (including already-normalized axios error with .userMessage).
   */
  const getUserMessage = useCallback((error: unknown): string => {
    const err = error as Error & { userMessage?: string };
    if (err?.userMessage) return err.userMessage;
    return parseApiError(error).userMessage;
  }, []);

  return { parseError, showError, getUserMessage };
}
