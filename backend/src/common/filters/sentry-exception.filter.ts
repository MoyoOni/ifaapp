import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SentryService } from '../../sentry/sentry.service';
import { mapToStandardError } from '../errors';

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  constructor(private readonly sentryService: SentryService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    const requestId = (request as any).requestId as string | undefined;

    if (status >= 500 || !(exception instanceof HttpException)) {
      this.sentryService.captureException(exception, {
        url: request.url,
        method: request.method,
        body: request.body,
        query: request.query,
        params: request.params,
        user: (request as any).user,
      });
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${status}`,
        exception instanceof Error ? exception.stack : String(exception)
      );
    }

    const errorPayload = mapToStandardError(status, rawResponse, requestId);
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
}
