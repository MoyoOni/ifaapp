import { Injectable, Logger } from '@nestjs/common';
import { SesEmailService } from '../shared/services/ses-email.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

/**
 * Email notification service.
 * Sends transactional emails via AWS SES through SesEmailService.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private sesEmailService: SesEmailService
  ) {}

  async sendNotificationEmail(userId: string, notification: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, yorubaName: true },
    });

    if (!user) {
      this.logger.warn(`sendNotificationEmail: user ${userId} not found`);
      return;
    }

    const template = this.getEmailTemplate(notification);
    const displayName = user.yorubaName || user.name;
    const html = this.renderEmailTemplate(template, displayName, notification);

    await this.sesEmailService.sendEmail(user.email, template.subject, html);
  }

  async sendPasswordResetEmail(email: string, resetToken: string, userName: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    const html = this.renderPasswordResetTemplate(userName, resetUrl);

    await this.sesEmailService.sendEmail(email, 'Password Reset Request - Ilé Àṣẹ', html);
    this.logger.log(`Password reset email sent to ${email}`);
  }

  /** Send an arbitrary HTML email directly — used for bulk digest and similar. */
  async sendDirectEmail(to: string, subject: string, html: string): Promise<void> {
    await this.sesEmailService.sendEmail(to, subject, html);
  }

  private getEmailTemplate(notification: any): { subject: string; body: string; greeting: string } {
    const templates: Record<string, { subject: string; body: string; greeting: string }> = {
      APPOINTMENT: { subject: 'Appointment Update - Ilé Àṣẹ', body: notification.message, greeting: 'Àṣẹ' },
      MESSAGE: { subject: 'New Message - Ilé Àṣẹ', body: notification.message, greeting: 'Àṣẹ' },
      ORDER: { subject: 'Order Update - Ilé Àṣẹ', body: notification.message, greeting: 'Àṣẹ' },
      PAYMENT: { subject: 'Payment Confirmation - Ilé Àṣẹ', body: notification.message, greeting: 'Àṣẹ' },
      GUIDANCE_PLAN: { subject: 'Guidance Plan Update - Ilé Àṣẹ', body: notification.message, greeting: 'Àṣẹ' },
      VERIFICATION: { subject: 'Verification Status Update - Ilé Àṣẹ', body: notification.message, greeting: 'Àṣẹ' },
      DISPUTE: { subject: 'Dispute Update - Ilé Àṣẹ', body: notification.message, greeting: 'Àṣẹ' },
      SYSTEM: { subject: 'System Notification - Ilé Àṣẹ', body: notification.message, greeting: 'Àṣẹ' },
      TEMPLE: { subject: 'Temple Update - Ilé Àṣẹ', body: notification.message, greeting: 'Àṣẹ' },
    };

    return templates[notification.type] || { subject: 'Notification - Ilé Àṣẹ', body: notification.message, greeting: 'Àṣẹ' };
  }

  private renderEmailTemplate(
    template: { subject: string; body: string; greeting: string },
    displayName: string,
    notification: any
  ): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${template.subject}</title></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#B45309 0%,#92400E 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
    <h1 style="color:#FDFCF0;margin:0;font-size:28px;">Ilé Àṣẹ</h1>
    <p style="color:#FDFCF0;margin:5px 0 0 0;font-size:14px;">Digital Nexus for Isese/Ifá</p>
  </div>
  <div style="background:#FDFCF0;padding:30px;border-radius:0 0 10px 10px;border:1px solid #E5E7EB;">
    <p>${template.greeting} ${displayName},</p>
    <div style="background:#FFFFFF;padding:20px;border-radius:8px;border-left:4px solid #B45309;margin:20px 0;">
      <h2 style="color:#292524;margin-top:0;">${notification.title || template.subject}</h2>
      <p style="color:#4B5563;margin-bottom:0;">${template.body}</p>
    </div>
    <p style="font-size:12px;color:#9CA3AF;margin-top:30px;">© ${new Date().getFullYear()} Ilé Àṣẹ. All rights reserved.</p>
  </div>
</body></html>`;
  }

  private renderPasswordResetTemplate(userName: string, resetUrl: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Password Reset - Ilé Àṣẹ</title></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#B45309 0%,#92400E 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
    <h1 style="color:#FDFCF0;margin:0;font-size:28px;">Ilé Àṣẹ</h1>
  </div>
  <div style="background:#FDFCF0;padding:30px;border-radius:0 0 10px 10px;border:1px solid #E5E7EB;">
    <p>Àṣẹ ${userName},</p>
    <div style="background:#FFFFFF;padding:20px;border-radius:8px;border-left:4px solid #B45309;margin:20px 0;">
      <h2 style="color:#292524;margin-top:0;">Password Reset Request</h2>
      <p style="color:#4B5563;">We received a request to reset your password. Click the button below:</p>
      <div style="text-align:center;margin:25px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:#B45309;color:#FFFFFF;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:bold;">Reset Password</a>
      </div>
      <p style="font-size:14px;color:#6B7280;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </div>
  </div>
</body></html>`;
  }
}
