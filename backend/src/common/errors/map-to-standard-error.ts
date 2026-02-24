import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes';
import type { StandardErrorPayload } from './standard-error.response';

/** Exception response may include optional code, userMessage, details (e.g. from BadRequestException). */
interface ExceptionResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
  code?: ErrorCode | string;
  userMessage?: string;
  details?: Record<string, unknown>;
}

const DEFAULT_USER_MESSAGES: Partial<Record<HttpStatus, string>> = {
  [HttpStatus.BAD_REQUEST]: 'Invalid request. Please check your input.',
  [HttpStatus.UNAUTHORIZED]: 'Please log in to continue.',
  [HttpStatus.FORBIDDEN]: "You don't have permission for this action.",
  [HttpStatus.NOT_FOUND]: 'The requested item was not found.',
  [HttpStatus.CONFLICT]:
    'This action conflicts with the current state. Please refresh and try again.',
  [HttpStatus.UNPROCESSABLE_ENTITY]:
    'The information provided could not be accepted. Please check and try again.',
  [HttpStatus.REQUEST_TIMEOUT]: 'The request took too long. Please try again.',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Too many requests. Please slow down and try again.',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'A server error occurred. Our team has been notified.',
  [HttpStatus.BAD_GATEWAY]: 'The service is temporarily unavailable. Please try again in a moment.',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable. Please try again later.',
  [HttpStatus.GATEWAY_TIMEOUT]:
    'The service is temporarily unavailable. Please try again in a moment.',
};

const STATUS_TO_CODE: Partial<Record<HttpStatus, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
  [HttpStatus.UNPROCESSABLE_ENTITY]: ErrorCode.VALIDATION_ERROR,
  [HttpStatus.REQUEST_TIMEOUT]: ErrorCode.REQUEST_TIMEOUT,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.RATE_LIMIT_EXCEEDED,
  [HttpStatus.INTERNAL_SERVER_ERROR]: ErrorCode.INTERNAL_ERROR,
  [HttpStatus.BAD_GATEWAY]: ErrorCode.SERVICE_UNAVAILABLE,
  [HttpStatus.SERVICE_UNAVAILABLE]: ErrorCode.SERVICE_UNAVAILABLE,
  [HttpStatus.GATEWAY_TIMEOUT]: ErrorCode.SERVICE_UNAVAILABLE,
};

function normalizeMessage(msg: string | string[] | undefined): string {
  if (msg == null) return 'Internal server error';
  return Array.isArray(msg) ? msg.join('; ') : String(msg);
}

/**
 * Build standard error payload from exception and request context.
 */
export function mapToStandardError(
  status: number,
  exceptionResponse: string | ExceptionResponse,
  requestId: string | undefined
): StandardErrorPayload {
  const statusCode = status;
  const code = STATUS_TO_CODE[status as HttpStatus] ?? ErrorCode.INTERNAL_ERROR;
  const timestamp = new Date().toISOString();

  if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
    const res = exceptionResponse as ExceptionResponse;
    const message = normalizeMessage(res.message ?? res.error);
    const userMessage =
      res.userMessage ??
      DEFAULT_USER_MESSAGES[status as HttpStatus] ??
      'Something went wrong. Please try again.';
    return {
      code: res.code ?? code,
      message,
      userMessage,
      statusCode,
      timestamp,
      requestId,
      details: res.details,
    };
  }

  const message =
    typeof exceptionResponse === 'string' ? exceptionResponse : 'Internal server error';
  const userMessage =
    DEFAULT_USER_MESSAGES[status as HttpStatus] ?? 'Something went wrong. Please try again.';
  return {
    code,
    message,
    userMessage,
    statusCode,
    timestamp,
    requestId,
  };
}
