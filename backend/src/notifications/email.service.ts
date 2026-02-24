import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import sgMail from '@sendgrid/mail';

/**
 * Email Service
 * Handles sending email notifications using SendGrid
 * Falls back to console logging if SendGrid is not configured
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly sendGridApiKey: string | undefined;
  private readonly fromEmail: string;
  private readonly isConfigured: boolean;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue
  ) {
    this.sendGridApiKey = this.configService.get<string>('SENDGRID_API_KEY');
    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || 'noreply@ilease.ng';
    this.isConfigured = !!this.sendGridApiKey;

    if (this.isConfigured && this.sendGridApiKey) {
      sgMail.setApiKey(this.sendGridApiKey);
      this.logger.log('SendGrid email service configured');
    } else {
      this.logger.warn('SendGrid not configured. Email notifications will be logged only.');
    }
  }

  /**
   * Queue notification email
   */
  async sendNotificationEmail(userId: string, notification: any) {
    this.logger.log(`Queueing email for user ${userId}`);
    await this.notificationsQueue.add('sendEmail', { userId, notification });
  }

  /**
   * Actual execution of email sending (called by worker)
   */
  async executeSendEmail(userId: string, notification: any) {
    try {
      // Fetch user to get email
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, yorubaName: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const template = this.getEmailTemplate(notification);
      const html = this.renderEmailTemplate(
        template,
        { name: user.name, yorubaName: user.yorubaName ?? undefined },
        notification
      );

      if (this.isConfigured) {
        await sgMail.send({
          to: user.email,
          from: this.fromEmail,
          subject: template.subject,
          html,
        });
        this.logger.log(`Email sent to ${user.email} for notification ${notification.id}`);
      } else {
        // Log email in development
        this.logger.log(`[EMAIL-MOCK] To: ${user.email} | Subject: ${template.subject}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send email: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Queue password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string, userName: string) {
    this.logger.log(`Queueing password reset for ${email}`);
    await this.notificationsQueue.add('sendPasswordReset', { email, resetToken, userName });
  }

  /**
   * Actual execution of password reset email
   */
  async executeSendPasswordReset(email: string, resetToken: string, userName: string) {
    try {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
      const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

      const html = this.renderPasswordResetTemplate(userName, resetUrl);

      if (this.isConfigured) {
        await sgMail.send({
          to: email,
          from: this.fromEmail,
          subject: 'Password Reset Request - Ilé Àṣẹ',
          html,
        });
        this.logger.log(`Password reset email sent to ${email}`);
      } else {
        // Log email in development
        this.logger.log(`[EMAIL-MOCK] Password Reset To: ${email} | URL: ${resetUrl}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send password reset email: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get email template based on notification type
   */
  private getEmailTemplate(notification: any) {
    const templates: Record<string, { subject: string; body: string; greeting?: string }> = {
      APPOINTMENT: {
        subject: 'Appointment Update - Ilé Àṣẹ',
        body: notification.message,
        greeting: 'Àṣẹ',
      },
      MESSAGE: {
        subject: 'New Message - Ilé Àṣẹ',
        body: notification.message,
        greeting: 'Àṣẹ',
      },
      ORDER: {
        subject: 'Order Update - Ilé Àṣẹ',
        body: notification.message,
        greeting: 'Àṣẹ',
      },
      PAYMENT: {
        subject: 'Payment Confirmation - Ilé Àṣẹ',
        body: notification.message,
        greeting: 'Àṣẹ',
      },
      GUIDANCE_PLAN: {
        subject: 'Guidance Plan Update - Ilé Àṣẹ',
        body: notification.message,
        greeting: 'Àṣẹ',
      },
      VERIFICATION: {
        subject: 'Verification Status Update - Ilé Àṣẹ',
        body: notification.message,
        greeting: 'Àṣẹ',
      },
      DISPUTE: {
        subject: 'Dispute Update - Ilé Àṣẹ',
        body: notification.message,
        greeting: 'Àṣẹ',
      },
      SYSTEM: {
        subject: 'System Notification - Ilé Àṣẹ',
        body: notification.message,
        greeting: 'Àṣę',
      },
      TEMPLE: {
        subject: 'Temple Update - Ilé Àṣẹ',
        body: notification.message,
        greeting: 'Àṣẹ',
      },
    };

    return (
      templates[notification.type] || {
        subject: 'Notification - Ilé Àṣẹ',
        body: notification.message,
        greeting: 'Àṣẹ',
      }
    );
  }

  /**
   * Render email template with cultural context
   */
  private renderEmailTemplate(
    template: { subject: string; body: string; greeting?: string },
    user: { name: string; yorubaName?: string },
    notification: any
  ): string {
    const displayName = user.yorubaName || user.name;
    const greeting = template.greeting || 'Àṣẹ';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #B45309 0%, #92400E 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #FDFCF0; margin: 0; font-size: 28px;">Ilé Àṣẹ</h1>
    <p style="color: #FDFCF0; margin: 5px 0 0 0; font-size: 14px;">Digital Nexus for Isese/Ifá</p>
  </div>
  
  <div style="background: #FDFCF0; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #E5E7EB;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      ${greeting} ${displayName},
    </p>
    
    <div style="background: #FFFFFF; padding: 20px; border-radius: 8px; border-left: 4px solid #B45309; margin: 20px 0;">
      <h2 style="color: #292524; margin-top: 0;">${notification.title}</h2>
      <p style="color: #4B5563; margin-bottom: 0;">${template.body}</p>
    </div>
    
    <p style="font-size: 14px; color: #6B7280; margin-top: 30px;">
      This is an automated notification from Ilé Àṣẹ. Please do not reply to this email.
    </p>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center;">
      <p style="font-size: 12px; color: #9CA3AF;">
        © ${new Date().getFullYear()} Ilé Àṣẹ. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Render password reset email template
   */
  private renderPasswordResetTemplate(userName: string, resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Request - Ilé Àṣẹ</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #B45309 0%, #92400E 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #FDFCF0; margin: 0; font-size: 28px;">Ilé Àṣẹ</h1>
    <p style="color: #FDFCF0; margin: 5px 0 0 0; font-size: 14px;">Digital Nexus for Isese/Ifá</p>
  </div>
  
  <div style="background: #FDFCF0; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #E5E7EB;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Àṣẹ ${userName},
    </p>
    
    <div style="background: #FFFFFF; padding: 20px; border-radius: 8px; border-left: 4px solid #B45309; margin: 20px 0;">
      <h2 style="color: #292524; margin-top: 0;">Password Reset Request</h2>
      <p style="color: #4B5563; margin-bottom: 15px;">
        We received a request to reset your password. Click the button below to create a new password:
      </p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #B45309; color: #FFFFFF; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
          Reset Password
        </a>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }
}
