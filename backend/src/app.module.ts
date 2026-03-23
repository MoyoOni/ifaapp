import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER, Reflector } from '@nestjs/core';
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
// import { DocumentsModule } from './documents/documents.module';  // DISABLED: file storage (S3/local) not yet configured for production
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
// import { SpiritualJourneyModule } from './spiritual-journey/spiritual-journey.module';  // DEFERRED: post-launch feature (see SPIRITUAL_JOURNEY_EVALUATION.md)
import { SearchModule } from './search/search.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DatabaseModule } from './database/database.module';
import { EncryptionModule } from './encryption/encryption.module';
import { SecurityModule } from './security/security.module';
// import { CacheModule } from './cache/cache.module';  // DISABLED: Redis cache layer not yet wired to ConfigService — enable post-launch
// import { ImageModule } from './images/image.module';  // DISABLED: image processing (sharp) not bundled in prod Docker image — enable post-launch
// import { CertificateModule } from './certificates/certificate.module';  // DISABLED: pdfkit not installed; placeholder PDF generation only — enable post-launch
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
// import { QueueModule } from './common/queue/queue.module';  // DISABLED: BullMQ peer dep version mismatch with current NestJS version — enable post-launch
// import { TestModule } from './test/test.module';  // DISABLED: development-only test helper, never load in production
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { SentryModule } from './sentry/sentry.module';

// import { ScheduleModule } from '@nestjs/schedule';  // DISABLED: circular Reflector injection issue — enable post-launch after upgrading @nestjs/schedule
import { DiscoveryModule } from '@nestjs/core';
import { SharedModule } from './shared/shared.module';
import { InfrastructureModule } from './shared/infrastructure.module';
import { WhatsAppModule } from './whatsapp';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [infrastructureConfig],
    }),
    DiscoveryModule,
    // ScheduleModule.forRoot(), // DISABLED: see import comment above
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
    // DocumentsModule,  // DISABLED: see import comment above
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
    SubscriptionsModule,
    HealthModule,
    MetricsModule,
    // QueueModule, // DISABLED: see import comment above
    SearchModule,
    DashboardModule,
    DatabaseModule,
    EncryptionModule,
    SecurityModule,
    SharedModule,
    InfrastructureModule,
    WhatsAppModule,
    SentryModule,
  ],
  controllers: [],
  providers: [
    Reflector,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*'); // Removed SentryMiddleware
  }
}
