import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { validateEnv } from './config/env.validation';
import { infrastructureConfig } from './shared/config/infrastructure.config';
import { RequestIdMiddleware } from './middleware/request-id.middleware';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VerificationModule } from './verification/verification.module';
import { BabalawoClientModule } from './babalawo-client/babalawo-client.module';
import { MessagingModule } from './messaging/messaging.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { DocumentsModule } from './documents/documents.module';
import { AdminModule } from './admin/admin.module';
import { ForumModule } from './forum/forum.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { AcademyModule } from './academy/academy.module';
import { WalletModule } from './wallet/wallet.module';
import { PaymentsModule } from './payments/payments.module';
import { GuidancePlansModule } from './prescriptions/prescriptions.module';
import { TemplesModule } from './temples/temples.module';
import { TutorsModule } from './tutors/tutors.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { DisputesModule } from './disputes/disputes.module';
import { VideoCallModule } from './video-call/video-call.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CirclesModule } from './circles/circles.module';
import { EventsModule } from './events/events.module';
import { ReviewsModule } from './reviews/reviews.module';
import { DemoModule } from './demo/demo.module';
// import { SpiritualJourneyModule } from './spiritual-journey/spiritual-journey.module';
import { SearchModule } from './search/search.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DatabaseModule } from './database/database.module';
import { EncryptionModule } from './encryption/encryption.module';
import { SecurityModule } from './security/security.module';
// import { CacheModule } from './cache/cache.module';  // Temporarily commented out
// import { ImageModule } from './images/image.module';  // Temporarily commented out
// import { CertificateModule } from './certificates/certificate.module';  // Temporarily commented out
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { QueueModule } from './common/queue/queue.module';
// import { TestModule } from './test/test.module';
// import { SentryModule } from './sentry/sentry.module';
// import { SentryExceptionFilter } from './common/filters/sentry-exception.filter';
// import { SentryMiddleware } from './common/middleware/sentry.middleware';

import { ScheduleModule } from '@nestjs/schedule';
import { SharedModule } from './shared/shared.module';
import { InfrastructureModule } from './shared/infrastructure.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [infrastructureConfig],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    VerificationModule,
    BabalawoClientModule,
    MessagingModule,
    AppointmentsModule,
    // DocumentsModule,  // Temporarily commented out
    AdminModule,
    ForumModule,
    MarketplaceModule,
    AcademyModule,
    WalletModule,
    PaymentsModule,
    GuidancePlansModule,
    TemplesModule,
    TutorsModule,
    RecommendationsModule,
    DisputesModule,
    VideoCallModule,
    NotificationsModule,
    CirclesModule,
    EventsModule,
    ReviewsModule,
    DemoModule,
    HealthModule,
    MetricsModule,
    QueueModule,
    SearchModule,
    DashboardModule,
    DatabaseModule,
    EncryptionModule,
    SecurityModule,
    SharedModule,
    InfrastructureModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    /*
    {
      provide: APP_FILTER,
      useClass: SentryExceptionFilter,
    },
    */
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*'); // Removed SentryMiddleware
  }
}