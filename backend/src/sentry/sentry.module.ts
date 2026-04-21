import { Module } from '@nestjs/common';
import { SentryInitializerService } from './sentry-initializer.service';
import { SecretsModule } from '../secrets/secrets.module';

@Module({
  imports: [SecretsModule],
  providers: [SentryInitializerService],
  exports: [SentryInitializerService],
})
export class SentryModule {}