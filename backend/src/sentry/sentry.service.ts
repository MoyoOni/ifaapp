import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initSentry, captureException, captureMessage as sentryCaptureMessage, setUser as sentrySetUser, addBreadcrumb as sentryAddBreadcrumb } from '../sentry';

@Injectable()
export class SentryService {
  private readonly logger = new Logger(SentryService.name);
  private readonly isEnabled: boolean;

  constructor(private configService: ConfigService) {
    const dsn = this.configService.get<string>('SENTRY_DSN');
    const environment = this.configService.get<string>('NODE_ENV') || 'development';

    this.isEnabled = !!dsn && environment !== 'development';

    if (this.isEnabled) {
      initSentry();

      this.logger.log(`Sentry initialized for ${environment}`);
    } else {
      this.logger.warn('Sentry disabled (no DSN or development mode)');
    }
  }

  captureException(exception: any, context?: Record<string, any>) {
    if (this.isEnabled) {
      captureException(exception, context);
    } else {
      this.logger.error('Exception:', exception);
      if (context) {
        this.logger.error('Context:', context);
      }
    }
  }

  captureMessage(message: string, level = 'info') {
    if (this.isEnabled) {
      sentryCaptureMessage(message, level);
    } else {
      this.logger.log(message);
    }
  }

  setUser(user: { id: string; email?: string; role?: string }) {
    if (this.isEnabled) {
      sentrySetUser(user as Record<string, unknown>);
    }
  }

  clearUser() {
    if (this.isEnabled) {
      sentrySetUser(null);
    }
  }

  addBreadcrumb(breadcrumb: Record<string, unknown>) {
    if (this.isEnabled) {
      sentryAddBreadcrumb(breadcrumb);
    }
  }
}
