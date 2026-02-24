import { ErrorCode } from './error-codes';

/**
 * Standard API error payload (PB-202.5).
 * All error responses use this shape for consistent frontend handling.
 */
export interface StandardErrorPayload {
  code: ErrorCode | string;
  message: string;
  userMessage: string;
  statusCode: number;
  timestamp: string;
  requestId?: string;
  details?: Record<string, unknown>;
}

export interface StandardErrorResponse {
  success: false;
  error: StandardErrorPayload;
}
