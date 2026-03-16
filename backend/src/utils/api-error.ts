import { Logger } from '@nestjs/common';
import { captureException } from '../sentry';

const logger = new Logger('ApiError');

export function reportApiError(error: any): void {
  logger.error('API Error:', error);
  captureException(error);
}
