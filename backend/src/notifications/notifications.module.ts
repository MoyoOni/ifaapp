import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './email/email.service';
import { PushNotificationService } from './push/push-notification.service';
import { JobQueueService } from '../queues/job-queue.service';
import { DatabaseModule } from '../database/database.module';
// Redis pulled in via InfrastructureModule/QueueService; explicit module removed
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Module({
  imports: [
    DatabaseModule,
    // Redis/queue functionality is provided by InfrastructureModule (imported elsewhere)
    // JobQueueService is provided via providers and injected with forwardRef in consuming
    // classes; it must not appear under imports (Nest restriction).
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get('SMTP_HOST'),
          port: configService.get('SMTP_PORT'),
          secure: configService.get('SMTP_SECURE'), // true for 465, false for other ports
          auth: {
            user: configService.get('SMTP_USER'),
            pass: configService.get('SMTP_PASS'),
          },
        },
        defaults: {
          from: `"Ilé Àṣẹ" <${configService.get('SMTP_FROM')}>`, // outgoing email ID
        },
        template: {
          dir: process.cwd() + '/templates/',
          adapter: new HandlebarsAdapter(), // or new PugAdapter() or new EjsAdapter()
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationService,
    EmailService,
    PushNotificationService,
    JobQueueService, // service available for injection by others
  ],
  exports: [NotificationService, EmailService, PushNotificationService],
})
export class NotificationsModule {}
