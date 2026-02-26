import { Module } from '@nestjs/common';
import { SentryInterceptor } from './sentry.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  providers: [
    SentryInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryInterceptor,
    },
  ],
  exports: [SentryInterceptor],
})
export class SentryModule {}
