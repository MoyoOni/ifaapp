import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { mapToStandardError } from '../errors';

/**
 * Global exception filter that catches ALL unhandled exceptions and maps them
 * to appropriate HTTP status codes. Prevents generic 500s for known error types.
 *
 * Error mapping:
 *   - Prisma connection errors  → 503 Service Unavailable
 *   - Prisma "not found" (P2025) → 404 Not Found
 *   - Prisma unique constraint (P2002) → 409 Conflict
 *   - Auth/JWT errors → 401 Unauthorized
 *   - HttpException subclasses → their native status
 *   - Everything else → 500 Internal Server Error
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request as any).requestId as string | undefined;

    const { status, message } = this.resolveStatusAndMessage(exception);

    // Log server errors with full stack; client errors at warn level
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${status} — ${message}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else if (status >= 400) {
      this.logger.warn(`${request.method} ${request.url} ${status} — ${message}`);
    }

    const rawResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : message;

    const errorPayload = mapToStandardError(status, rawResponse, requestId);

    // Include stack trace in non-production for debugging
    if (
      process.env.NODE_ENV !== 'production' &&
      status >= 500 &&
      exception instanceof Error &&
      exception.stack
    ) {
      errorPayload.details = { ...errorPayload.details, stack: exception.stack };
    }

    response.status(status).json({
      success: false,
      error: errorPayload,
    });
  }

  private resolveStatusAndMessage(exception: unknown): { status: number; message: string } {
    // 1. NestJS HttpException (includes BadRequest, Unauthorized, Forbidden, NotFound, etc.)
    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        message: exception.message,
      };
    }

    if (exception instanceof Error) {
      const err = exception as any;

      // 2. Prisma connection / initialization errors → 503
      if (
        err.constructor?.name === 'PrismaClientInitializationError' ||
        err.constructor?.name === 'PrismaClientRustPanicError' ||
        err.code === 'ECONNREFUSED' ||
        err.code === 'ENOTFOUND' ||
        err.code === 'ETIMEDOUT'
      ) {
        return {
          status: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Database service unavailable',
        };
      }

      // 3. Prisma known request errors
      if (err.constructor?.name === 'PrismaClientKnownRequestError') {
        return this.handlePrismaError(err);
      }

      // 4. Prisma validation errors (bad query shape)
      if (err.constructor?.name === 'PrismaClientValidationError') {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid database query',
        };
      }

      // 5. JWT / Auth errors
      if (
        err.name === 'JsonWebTokenError' ||
        err.name === 'TokenExpiredError' ||
        err.name === 'NotBeforeError'
      ) {
        return {
          status: HttpStatus.UNAUTHORIZED,
          message: err.name === 'TokenExpiredError'
            ? 'Token has expired'
            : 'Invalid authentication token',
        };
      }

      // 6. Generic Error → 500
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message || 'Internal server error',
      };
    }

    // 7. Non-Error throw (string, number, etc.)
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }

  private handlePrismaError(err: any): { status: number; message: string } {
    switch (err.code) {
      case 'P2025': // Record not found
        return { status: HttpStatus.NOT_FOUND, message: 'Resource not found' };
      case 'P2002': // Unique constraint violation
        return { status: HttpStatus.CONFLICT, message: 'Resource already exists' };
      case 'P2003': // Foreign key constraint violation
        return { status: HttpStatus.BAD_REQUEST, message: 'Referenced resource does not exist' };
      case 'P2014': // Required relation violation
        return { status: HttpStatus.BAD_REQUEST, message: 'Required relation violation' };
      default:
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: `Database error: ${err.code}` };
    }
  }
}
