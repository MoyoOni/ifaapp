import { AxiosError } from 'axios';
import { logger, getLogContext } from './logger';
import { captureException } from '@/shared/config/sentry';

/** Standard API error shape (PB-202.5); backend returns { success: false, error: StandardApiError }. */
export interface StandardApiError {
  code?: string;
  message?: string;
  userMessage?: string;
  statusCode?: number;
  timestamp?: string;
  requestId?: string;
  details?: Record<string, unknown>;
}

export interface ParsedApiError {
  /** User-facing message; safe to show in UI */
  userMessage: string;
  /** Short list of actionable suggestions */
  recoverySuggestions: string[];
  /** True when no response received (network/connection issue) */
  isNetworkError: boolean;
  /** HTTP status when server responded */
  statusCode?: number;
  /** Original error for logging or rethrow */
  originalError: unknown;
}

/**
 * Parse any API error into a consistent, user-friendly shape.
 * Supports standardized format (success: false, error: { userMessage, code, ... }) and legacy shapes.
 * Use in catch blocks or via useApiErrorHandler() for toasts.
 */
export function parseApiError(error: unknown): ParsedApiError {
  const defaultResult: ParsedApiError = {
    userMessage: 'Something went wrong. Please try again.',
    recoverySuggestions: [
      'Please try again in a moment',
      'Refresh the page if the problem persists',
      'Check your internet connection',
    ],
    isNetworkError: false,
    originalError: error,
  };

  if (!error) return defaultResult;

  type ResponseData = { success?: boolean; error?: StandardApiError | string; message?: string };
  const axiosError = error as AxiosError<ResponseData>;
  const data = axiosError.response?.data;
  const isStandardError = (err: any): err is StandardApiError =>
    err !== null && typeof err === 'object' && ('message' in err || 'userMessage' in err);

  const standardError = data?.success === false && isStandardError(data.error) ? data.error : null;
  const serverMessage =
    standardError?.userMessage ??
    standardError?.message ??
    (typeof data?.message === 'string' ? data?.message : null) ??
    (typeof data?.error === 'string' ? data?.error : null);

  if (axiosError.response) {
    const status = axiosError.response.status;
    let userMessage = serverMessage ?? defaultResult.userMessage;
    let recoverySuggestions = defaultResult.recoverySuggestions;

    if (!serverMessage) {
      switch (status) {
        case 400:
          userMessage = 'Invalid request. Please check your input.';
          break;
        case 401:
          userMessage = 'Please log in to continue.';
          recoverySuggestions = ['Log in again', 'Check if your session has expired'];
          break;
        case 403:
          userMessage = "You don't have permission for this action.";
          recoverySuggestions = [
            'Contact an administrator if you believe this is an error',
          ];
          break;
        case 404:
          userMessage = 'The requested item was not found.';
          recoverySuggestions = [
            'Check the link or return to the homepage to navigate',
          ];
          break;
        case 408:
          userMessage = 'The request took too long. Please try again.';
          break;
        case 409:
          userMessage = 'This action conflicts with the current state. Please refresh and try again.';
          break;
        case 422:
          userMessage = 'The information provided could not be accepted. Please check and try again.';
          break;
        case 500:
          userMessage = 'A server error occurred. Our team has been notified.';
          recoverySuggestions = [
            'Try again later',
            ...(import.meta.env.DEV && (data?.error || standardError?.message)
              ? ['Check Network tab → failed request → Response for backend error details']
              : []),
          ];
          break;
        case 502:
        case 504:
          userMessage = 'The service is temporarily unavailable. Please try again in a moment.';
          break;
        case 503:
          userMessage = 'Service is temporarily unavailable. Please try again later.';
          break;
        default:
          userMessage =
            status >= 500
              ? 'A server error occurred. Please try again later.'
              : `Request failed (${status}). Please try again.`;
      }
    }

    return {
      userMessage,
      recoverySuggestions,
      isNetworkError: false,
      statusCode: status,
      originalError: error,
    };
  }

  if (axiosError.request) {
    // No response received — network/connection issue
    return {
      userMessage: 'Unable to connect. Please check your internet connection and try again.',
      recoverySuggestions: [
        'Check your internet connection',
        'Try again in a moment',
      ],
      isNetworkError: true,
      originalError: error,
    };
  }

  return {
    ...defaultResult,
    userMessage: 'An unexpected error occurred. Please try again.',
    originalError: error,
  };
}

/**
 * Report API error for logging and optional error tracking (e.g. Sentry).
 * Call from catch blocks or in the API response interceptor.
 */
export function reportApiError(
  error: unknown,
  context?: { action?: string; endpoint?: string }
): void {
  const parsed = parseApiError(error);
  const axiosError = error as AxiosError;
  const detail =
    axiosError.response?.status != null
      ? `status ${axiosError.response.status}`
      : parsed.isNetworkError
        ? 'network error'
        : 'unknown';
  const ctx = context?.action ?? context?.endpoint ?? '';
  logger.error(`API error ${ctx} (${detail}):`, parsed.userMessage, error);
  const logCtx = getLogContext();
  captureException(error, {
    action: context?.action,
    endpoint: context?.endpoint,
    statusCode: parsed.statusCode,
    userMessage: parsed.userMessage,
    isNetworkError: parsed.isNetworkError,
    traceId: logCtx.traceId,
    userId: logCtx.userId,
  });
}
