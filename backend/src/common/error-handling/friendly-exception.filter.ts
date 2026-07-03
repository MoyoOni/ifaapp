import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FriendlyErrorHandlerService } from './friendly-error-handler.service';

@Catch()
export class FriendlyExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(FriendlyExceptionFilter.name);

  constructor(private friendlyErrorHandler: FriendlyErrorHandlerService) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Log the error for debugging
    this.friendlyErrorHandler.logErrorForDebugging(
      exception,
      `${request.method} ${request.url}`,
      { userId: (request as any).user?.sub || 'anonymous' }
    );

    // Convert the error to a user-friendly format
    const friendlyError = this.friendlyErrorHandler.convertToUserFriendly(exception);

    // Determine status code
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
    } else if (exception.status) {
      statusCode = exception.status;
    }

    // Prepare response
    const errorResponse = {
      statusCode,
      error: {
        userMessage: friendlyError.userMessage,
        suggestion: friendlyError.suggestion,
        errorCode: friendlyError.errorCode,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
      // Include technical details only in development
      ...(process.env.NODE_ENV === 'development' && {
        details: {
          technicalMessage: friendlyError.technicalMessage,
          stack: exception.stack,
        },
      }),
    };

    this.logger.warn(
      `Error handled for ${request.method} ${request.url}: ${friendlyError.userMessage}`
    );

    response.status(statusCode).json(errorResponse);
  }
}