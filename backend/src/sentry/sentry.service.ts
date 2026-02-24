import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

@Injectable()
export class SentryService {
  private readonly logger = new Logger(SentryService.name);
  private readonly isEnabled: boolean;

  constructor(private configService: ConfigService) {
    const dsn = this.configService.get<string>('SENTRY_DSN');
    const environment = this.configService.get<string>('NODE_ENV') || 'development';

    this.isEnabled = !!dsn && environment !== 'development';

    if (this.isEnabled) {
      Sentry.init({
        dsn,
        environment,
        integrations: [nodeProfilingIntegration()],
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
        profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
        beforeSend(event, hint) {
          // Filter out sensitive data
          if (event.request) {
            delete event.request.cookies;
            if (event.request.headers) {
              delete event.request.headers.authorization;
              delete event.request.headers.cookie;
            }
          }
          return event;
        },
      });

      this.logger.log(`Sentry initialized for ${environment}`);
    } else {
      this.logger.warn('Sentry disabled (no DSN or development mode)');
    }
  }

  captureException(exception: any, context?: Record<string, any>) {
    if (this.isEnabled) {
      Sentry.captureException(exception, { extra: context });
    } else {
      this.logger.error('Exception:', exception);
      if (context) {
        this.logger.error('Context:', context);
      }
    }
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    if (this.isEnabled) {
      Sentry.captureMessage(message, level);
    } else {
      this.logger.log(message);
    }
  }

  setUser(user: { id: string; email?: string; role?: string }) {
    if (this.isEnabled) {
      Sentry.setUser(user);
    }
  }

  clearUser() {
    if (this.isEnabled) {
      Sentry.setUser(null);
    }
  }

  addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
    if (this.isEnabled) {
      Sentry.addBreadcrumb(breadcrumb);
    }
  }
}
