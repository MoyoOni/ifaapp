import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

/** The anonymised address an erased account is given (GdprService.deleteUser). */
export const erasedEmail = (userId: string) =>
  `deleted_${Date.now()}_${userId}@deleted.iluase.invalid`;

/**
 * Reserved domains (RFC 2606/6761) can never receive mail: sending there is a
 * guaranteed bounce, and bounces count against SES sending reputation.
 * Erased accounts used to be given @example.com addresses.
 */
export function isUndeliverable(to: string): boolean {
  const domain = to.split('@').pop()?.toLowerCase() ?? '';
  return (
    /(^|\.)example\.(com|net|org)$/.test(domain) ||
    /\.(invalid|test|example|localhost)$/.test(domain)
  );
}

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
    this.fromEmail = this.configService.get<string>('SES_FROM_EMAIL') || 'noreply@iluase.com';
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.isProduction) {
      this.logger.log(`[EMAIL-DEV] To: ${to} | Subject: ${subject}`);
      return;
    }
    if (isUndeliverable(to)) {
      this.logger.warn(`Not sending "${subject}" to undeliverable address ${to}`);
      return;
    }

    const command = new SendEmailCommand({
      Source: `Ìlú Àṣẹ <${this.fromEmail}>`,
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
