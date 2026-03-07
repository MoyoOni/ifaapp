import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { JobQueueService, JobData } from '../../queues/job-queue.service';
import { User } from '../../shared/types/prisma-models';

export interface EmailPayload {
  to: string | string[];
  subject: string;
  template?: string;
  context?: any;
  html?: string;
  text?: string;
  attachments?: any[];
}

export interface EmailTemplateData {
  user: Partial<User>;
  message: string;
  actionUrl?: string;
  supportEmail?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
    @Inject(forwardRef(() => JobQueueService))
    private jobQueueService: JobQueueService
  ) {}

  /**
   * Send an email directly (not queued)
   */
  async sendEmail(payload: EmailPayload): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: payload.subject,
        template: payload.template,
        context: payload.context,
        html: payload.html,
        text: payload.text,
        attachments: payload.attachments,
      });

      this.logger.log(
        `Email sent successfully to ${Array.isArray(payload.to) ? payload.to.join(', ') : payload.to}`
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to send email to ${Array.isArray(payload.to) ? payload.to.join(', ') : payload.to}: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Queue an email for sending
   */
  async queueEmail(payload: EmailPayload): Promise<void> {
    const emailJob: JobData = {
      id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'send-email',
      payload: {
        ...payload,
        queuedAt: new Date().toISOString(),
      },
      priority: 'normal',
    };

    try {
      await this.jobQueueService.addJob('email', emailJob);
      this.logger.log(
        `Email queued for ${Array.isArray(payload.to) ? payload.to.join(', ') : payload.to}`
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to queue email for ${Array.isArray(payload.to) ? payload.to.join(', ') : payload.to}: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Send a welcome email to a new user
   */
  async sendWelcomeEmail(user: Partial<User>): Promise<void> {
    const templateData: EmailTemplateData = {
      user,
      message: `Welcome to Ilé Àṣẹ, ${(user as any).firstName || user.name || 'friend'}! We're excited to have you join our community.`,
      actionUrl: `${this.configService.get('FRONTEND_URL')}/dashboard`,
      supportEmail: this.configService.get('SUPPORT_EMAIL'),
    };

    const payload: EmailPayload = {
      to: user.email!,
      subject: 'Welcome to Ilé Àṣẹ - Your Digital Sanctuary for Ancient Wisdom',
      template: './welcome',
      context: templateData,
    };

    await this.queueEmail(payload);
  }

  /**
   * Send a booking confirmation email
   */
  async sendBookingConfirmation(user: Partial<User>, bookingDetails: any): Promise<void> {
    const templateData: EmailTemplateData = {
      user,
      message: `Your booking with ${bookingDetails.practitionerName} has been confirmed.`,
      actionUrl: `${this.configService.get('FRONTEND_URL')}/bookings/${bookingDetails.id}`,
      supportEmail: this.configService.get('SUPPORT_EMAIL'),
    };

    const payload: EmailPayload = {
      to: user.email!,
      subject: `Booking Confirmation - ${bookingDetails.serviceName}`,
      template: './booking-confirmation',
      context: {
        ...templateData,
        booking: bookingDetails,
      },
    };

    await this.queueEmail(payload);
  }

  /**
   * Send a notification email
   */
  async sendNotificationEmail(user: Partial<User>, notification: any): Promise<void> {
    const templateData: EmailTemplateData = {
      user,
      message: notification.message,
      actionUrl:
        notification.actionUrl || `${this.configService.get('FRONTEND_URL')}/notifications`,
      supportEmail: this.configService.get('SUPPORT_EMAIL'),
    };

    const payload: EmailPayload = {
      to: user.email!,
      subject: notification.subject || 'New Notification',
      template: './notification',
      context: {
        ...templateData,
        notification,
      },
    };

    await this.queueEmail(payload);
  }

  /**
   * Send a password reset email
   */
  async sendPasswordResetEmail(user: Partial<User>, resetToken: string): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;

    const templateData: EmailTemplateData = {
      user,
      message: 'You requested a password reset. Click the link below to reset your password.',
      actionUrl: resetUrl,
      supportEmail: this.configService.get('SUPPORT_EMAIL'),
    };

    const payload: EmailPayload = {
      to: user.email!,
      subject: 'Password Reset Request',
      template: './password-reset',
      context: templateData,
    };

    await this.queueEmail(payload);
  }

  /**
   * Send an account verification email
   */
  async sendVerificationEmail(user: Partial<User>, verificationToken: string): Promise<void> {
    const verifyUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${verificationToken}`;

    const templateData: EmailTemplateData = {
      user,
      message: 'Please verify your email address to complete your registration.',
      actionUrl: verifyUrl,
      supportEmail: this.configService.get('SUPPORT_EMAIL'),
    };

    const payload: EmailPayload = {
      to: user.email!,
      subject: 'Email Verification Required',
      template: './verification',
      context: templateData,
    };

    await this.queueEmail(payload);
  }

  /**
   * Initialize the email queue processor
   */
  async initializeQueueProcessor() {
    await this.jobQueueService.processQueue('email', async (job) => {
      const payload = job.data as EmailPayload;

      try {
        await this.sendEmail(payload);
        return { success: true };
      } catch (error: any) {
        this.logger.error(`Failed to send queued email: ${error.message}`);
        return { success: false, error: error.message };
      }
    });

    this.logger.log('Email queue processor initialized');
  }
}
