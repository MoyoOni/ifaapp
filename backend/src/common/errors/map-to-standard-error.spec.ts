/**
 * PB-201.1: Unit tests for mapToStandardError (standard error response).
 */
import { HttpStatus } from '@nestjs/common';
import { mapToStandardError } from './map-to-standard-error';
import { ErrorCode } from './error-codes';

describe('mapToStandardError', () => {
  it('returns payload with status-based code and userMessage for string response', () => {
    const out = mapToStandardError(404, 'Not found', undefined);
    expect(out.statusCode).toBe(404);
    expect(out.code).toBe(ErrorCode.NOT_FOUND);
    expect(out.message).toBe('Not found');
    expect(out.userMessage).toBe('The requested item was not found.');
    expect(out.timestamp).toBeDefined();
    expect(out.requestId).toBeUndefined();
  });

  it('includes requestId when provided', () => {
    const out = mapToStandardError(500, 'Server error', 'req-123');
    expect(out.requestId).toBe('req-123');
  });

  it('uses object response message and optional userMessage', () => {
    const out = mapToStandardError(400, {
      message: 'Validation failed',
      userMessage: 'Please fix the form.',
    }, undefined);
    expect(out.code).toBe(ErrorCode.BAD_REQUEST);
    expect(out.message).toBe('Validation failed');
    expect(out.userMessage).toBe('Please fix the form.');
  });

  it('uses object code and details when provided', () => {
    const out = mapToStandardError(400, {
      message: 'Insufficient funds',
      code: ErrorCode.INSUFFICIENT_FUNDS,
      userMessage: 'Add funds to continue.',
      details: { required: 10000, available: 5000 },
    }, 'req-abc');
    expect(out.code).toBe(ErrorCode.INSUFFICIENT_FUNDS);
    expect(out.details).toEqual({ required: 10000, available: 5000 });
  });

  it('normalizes array message to string', () => {
    const out = mapToStandardError(400, { message: ['err1', 'err2'] }, undefined);
    expect(out.message).toBe('err1; err2');
  });

  it('falls back to INTERNAL_ERROR for unknown status', () => {
    const out = mapToStandardError(499, 'Custom', undefined);
    expect(out.code).toBe(ErrorCode.INTERNAL_ERROR);
  });
});
