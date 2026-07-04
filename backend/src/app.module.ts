import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerBehindProxyFix } from './throttler-behind-proxy.guard';
import { getThrottlerConfig } from './config/throttler.config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { AcademyModule } from './academy/academy.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { BabalawoClientModule } from './babalawo-client/babalawo-client.module';
import { CacheModule } from './cache/cache.module';
import { CertificateModule } from './certificates/certificate.module';
import { CirclesModule } from './circles/circles.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DisputesModule } from './disputes/disputes.module';
import { DocumentsModule } from './documents/documents.module';
import { EventsModule } from './events/events.module';
import { ForumModule } from './forum/forum.module';
import { HealthModule } from './health/health.module';
import { ImageModule } from './images/image.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { MessagingModule } from './messaging/messaging.module';
import { MetricsModule } from './metrics/metrics.module';
import { LoggerModule } from './common/logger/logger.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { GuidancePlansModule } from './prescriptions/prescriptions.module';
import { PrismaModule } from './prisma/prisma.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SearchModule } from './search/search.module';
import { SecurityModule } from './security/security.module';
import { SharedModule } from './shared/shared.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TemplesModule } from './temples/temples.module';
import { TutorsModule } from './tutors/tutors.module';
import { VerificationModule } from './verification/verification.module';
import { VideoCallModule } from './video-call/video-call.module';
import { WalletModule } from './wallet/wallet.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { AdminModule } from './admin/admin.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SecretsModule } from './secrets/secrets.module';
import { SentryModule } from './sentry/sentry.module';
import { PractitionerAnalyticsModule } from './practitioners/practitioner-analytics.module';
import { SentryInitializerService } from './sentry/sentry-initializer.service';
import { OralHistorySeedService } from './seeding/oral-history.seed.service';
import { RequestIdMiddleware } from './middleware/request-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // P1-01: ScheduleModule.forRoot() was never actually registered anywhere
    // in the module tree — both prior references to it (wallet.module.ts,
    // messaging.module.ts) are commented out. Every @Cron job in the app,
    // including EscrowExpiryService's daily auto-expiry sweep, has been
    // silently inert as a result: the decorator was there, but nothing ever
    // initialized the scheduler that reads it. Registering it here (the root
    // module) fixes that for every existing and future @Cron job at once,
    // and is required for the new OutboxPollerService below.
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getThrottlerConfig,
    }),
    AuthModule,
    UserModule,
    AcademyModule,
    AppointmentsModule,
    BabalawoClientModule,
    CacheModule,
    CertificateModule,
    CirclesModule,
    DashboardModule,
    DisputesModule,
    DocumentsModule,
    EventsModule,
    ForumModule,
    HealthModule,
    ImageModule,
    MarketplaceModule,
    MessagingModule,
    MetricsModule,
    NotificationsModule,
    PaymentsModule,
    GuidancePlansModule,
    PrismaModule,
    RecommendationsModule,
    ReviewsModule,
    SearchModule,
    SecurityModule,
    SharedModule,
    SubscriptionsModule,
    TemplesModule,
    TutorsModule,
    VerificationModule,
    VideoCallModule,
    WalletModule,
    WhatsAppModule,
    AdminModule,
    AnalyticsModule,
    SecretsModule,
    SentryModule,
    PractitionerAnalyticsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyFix,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    SentryInitializerService, // Ensure Sentry initializer service is registered
    OralHistorySeedService,  // Register the oral history seed service
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*'); // Removed SentryMiddleware
  }
}