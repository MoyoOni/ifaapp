import { Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';

const logger = new Logger('ApiError');

export function reportApiError(error: any): void {
  logger.error('API Error:', error);
  Sentry.captureException(error); // Add Sentry integration
}
