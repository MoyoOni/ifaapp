import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SecretsService } from '../secrets/secrets.service';
import { ConfigService } from '@nestjs/config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SentryModule: any = null;

function getSentry() {
  if (SentryModule) return SentryModule;
  try {
    // Check required peer deps before loading @sentry/node to avoid crash at init time
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require.resolve('@opentelemetry/core');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    SentryModule = require('@sentry/node');
  } catch {
    // @opentelemetry peer deps missing — Sentry unavailable
  }
  return SentryModule;
}

@Injectable()
export class SentryInitializerService implements OnModuleInit {
  private readonly logger = new Logger(SentryInitializerService.name);

  constructor(
    private secretsService: SecretsService,
    private configService: ConfigService
  ) {}

  async onModuleInit() {
    // Only initialize in production or staging environments
    const env = this.configService.get<string>('NODE_ENV') || 'development';
    if (env !== 'production' && env !== 'staging') {
      this.logger.log('Sentry disabled in development environment');
      return;
    }

    try {
      const dsn = await this.secretsService.getSecret('iluase/prod/sentry-dsn');

      if (!dsn || dsn.trim() === '') {
        this.logger.warn('Sentry DSN is not set, skipping Sentry initialization');
        return;
      }

      const sentry = getSentry();
      if (!sentry) {
        this.logger.warn('Sentry module could not be loaded, skipping initialization');
        return;
      }

      const isProd = env === 'production';

      sentry.init({
        dsn,
        environment: env,
        tracesSampleRate: isProd ? 0.1 : 1.0,
        ignoreErrors: ['ValidationError'],
        // Add Nigeria-specific context
        integrations: [
          new sentry.Integrations.Http({ tracing: true }),
          new sentry.Integrations.Prisma({ client: 'prisma' }),
        ],
        beforeSend(event: any, hint: any) {
          // Filter events by country if possible
          if (event.user?.country === 'NG' || !event.user?.country) {
            return event;
          }
          return null;
        },
      });

      this.logger.log(`Sentry initialized for environment: ${env}`);
    } catch (error: any) {
      this.logger.error(`Failed to initialize Sentry: ${error.message}`);
    }
  }
}
