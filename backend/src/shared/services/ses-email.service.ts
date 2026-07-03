import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

/**
 * Transactional email service backed by AWS SES.
 * Uses the ECS task role for credentials (no API keys needed).
 * Falls back to console logging when not in production.
 */
@Injectable()
export class SesEmailService {
  private readonly logger = new Logger(SesEmailService.name);
  private readonly sesClient: SESClient;
  private readonly fromEmail: string;
  private readonly isProduction: boolean;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    this.sesClient = new SESClient({ region });
    this.fromEmail =
      this.configService.get<string>('SES_FROM_EMAIL') || 'noreply@iluase.com';
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.isProduction) {
      this.logger.log(`[EMAIL-DEV] To: ${to} | Subject: ${subject}`);
      return;
    }

    const command = new SendEmailCommand({
      Source: `Ilé Àṣẹ <${this.fromEmail}>`,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Html: { Data: html, Charset: 'UTF-8' } },
      },
    });

    await this.sesClient.send(command);
    this.logger.log(`Email sent via SES to ${to}`);
  }
}
