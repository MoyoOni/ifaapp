import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SesEmailService } from '../../shared/services/ses-email.service';

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

/**
 * Email service used by job queue workers.
 * Delegates all sending to SesEmailService.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private configService: ConfigService,
    private sesEmailService: SesEmailService
  ) {}

  async sendEmail(payload: EmailPayload): Promise<void> {
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    for (const to of recipients) {
      await this.sesEmailService.sendEmail(to, payload.subject, payload.html || payload.text || '');
    }
    this.logger.log(`Email sent to ${recipients.join(', ')}`);
  }

  async sendWelcomeEmail(user: { email: string; name?: string }): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://iluase.com';
    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#B45309 0%,#92400E 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
    <h1 style="color:#FDFCF0;margin:0;">Ilé Àṣẹ</h1>
  </div>
  <div style="background:#FDFCF0;padding:30px;border-radius:0 0 10px 10px;border:1px solid #E5E7EB;">
    <p>E kàábọ̀ ${user.name || 'friend'},</p>
    <p>Welcome to Ilé Àṣẹ — your digital sanctuary for Isese/Ifá wisdom.</p>
    <div style="text-align:center;margin:30px 0;">
      <a href="${frontendUrl}/dashboard" style="background:#B45309;color:#FFFFFF;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:bold;">Go to Dashboard</a>
    </div>
  </div>
</body></html>`;
    await this.sesEmailService.sendEmail(
      user.email,
      'Welcome to Ilé Àṣẹ - Your Digital Sanctuary',
      html
    );
  }
}
