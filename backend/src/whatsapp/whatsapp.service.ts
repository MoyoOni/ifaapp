import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { retryWithBackoff } from '../utils/retry-with-backoff.util';

export type WhatsAppTemplate =
  | 'new_booking_babalawo'
  | 'booking_confirmed_client'
  | 'booking_reminder_client'
  | 'new_message_received'
  | 'new_order_vendor'
  | 'order_confirmed_client'
  | 'guidance_plan_ready'
  | 'payment_received';

interface TemplateComponent {
  type: 'body' | 'header';
  parameters: Array<{ type: 'text'; text: string }>;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly apiUrl: string;
  private readonly enabled: boolean;

  constructor(private config: ConfigService) {
    this.phoneNumberId = config.get<string>('WHATSAPP_PHONE_NUMBER_ID') || '';
    this.accessToken = config.get<string>('WHATSAPP_ACCESS_TOKEN') || '';
    this.apiUrl = `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`;
    this.enabled = !!(this.phoneNumberId && this.accessToken);
    if (!this.enabled) {
      this.logger.warn('WhatsApp not configured — WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN missing');
    }
  }

  private formatPhone(phone: string): string {
    // Normalize to E.164 digits only (no +)
    const digits = phone.replace(/\D/g, '');
    // Nigerian numbers: 080/090/070 → 2348/2349/2347
    if (digits.startsWith('0') && digits.length === 11) {
      return `234${digits.slice(1)}`;
    }
    // Already has country code
    return digits;
  }

  async sendTemplateMessage(
    to: string,
    templateName: WhatsAppTemplate,
    components: TemplateComponent[],
  ): Promise<void> {
    if (!this.enabled) {
      this.logger.debug(`[WhatsApp SKIP] ${templateName} → ${to} (not configured)`);
      return;
    }
    try {
      // P1-02: 15s timeout (was unset — a slow WhatsApp Business API response
      // used to hang this request thread indefinitely) + retry with
      // exponential backoff on retryable failures (network errors, timeouts,
      // 5xx). A 4xx (e.g. bad template params) fails on the first attempt —
      // retrying it would just get the same rejection three times.
      await retryWithBackoff(() =>
        axios.post(
          this.apiUrl,
          {
            messaging_product: 'whatsapp',
            to: this.formatPhone(to),
            type: 'template',
            template: {
              name: templateName,
              language: { code: 'en' },
              components,
            },
          },
          {
            timeout: 15000,
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        )
      );
      this.logger.log(`[WhatsApp OK] ${templateName} → ${to}`);
    } catch (err: any) {
      // Never throw — WhatsApp failure must not break main flow. This is a
      // best-effort, direct send (used by non-payment flows); the specific
      // "payment received" WhatsApp notification path referenced in the
      // original finding now goes through the outbox pattern (P1-01)
      // instead, which is retried independently of this method's own retry.
      this.logger.error(
        `[WhatsApp FAIL] ${templateName} → ${to}: ${err?.response?.data?.error?.message || err.message}`,
      );
    }
  }

  // ── Babalawo notifications ──────────────────────────────────────────────

  async notifyBabalawoNewBooking(opts: {
    phone: string;
    clientName: string;
    date: string;
    time: string;
    url: string;
  }): Promise<void> {
    await this.sendTemplateMessage(opts.phone, 'new_booking_babalawo', [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: opts.clientName },
          { type: 'text', text: opts.date },
          { type: 'text', text: opts.time },
          { type: 'text', text: opts.url },
        ],
      },
    ]);
  }

  async notifyPaymentReceived(opts: {
    phone: string;
    amount: string;
    fromName: string;
    url: string;
  }): Promise<void> {
    await this.sendTemplateMessage(opts.phone, 'payment_received', [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: opts.amount },
          { type: 'text', text: opts.fromName },
          { type: 'text', text: opts.url },
        ],
      },
    ]);
  }

  // ── Client notifications ────────────────────────────────────────────────

  async notifyClientBookingConfirmed(opts: {
    phone: string;
    babalawoName: string;
    date: string;
    time: string;
    url: string;
  }): Promise<void> {
    await this.sendTemplateMessage(opts.phone, 'booking_confirmed_client', [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: opts.babalawoName },
          { type: 'text', text: opts.date },
          { type: 'text', text: opts.time },
          { type: 'text', text: opts.url },
        ],
      },
    ]);
  }

  async notifyClientBookingReminder(opts: {
    phone: string;
    babalawoName: string;
    date: string;
    time: string;
  }): Promise<void> {
    await this.sendTemplateMessage(opts.phone, 'booking_reminder_client', [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: opts.babalawoName },
          { type: 'text', text: opts.date },
          { type: 'text', text: opts.time },
        ],
      },
    ]);
  }

  async notifyClientGuidancePlanReady(opts: {
    phone: string;
    babalawoName: string;
    url: string;
  }): Promise<void> {
    await this.sendTemplateMessage(opts.phone, 'guidance_plan_ready', [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: opts.babalawoName },
          { type: 'text', text: opts.url },
        ],
      },
    ]);
  }

  async notifyClientOrderConfirmed(opts: {
    phone: string;
    productName: string;
    vendorName: string;
    url: string;
  }): Promise<void> {
    await this.sendTemplateMessage(opts.phone, 'order_confirmed_client', [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: opts.productName },
          { type: 'text', text: opts.vendorName },
          { type: 'text', text: opts.url },
        ],
      },
    ]);
  }

  // ── Shared notifications ────────────────────────────────────────────────

  async notifyNewMessage(opts: {
    phone: string;
    senderName: string;
    url: string;
  }): Promise<void> {
    await this.sendTemplateMessage(opts.phone, 'new_message_received', [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: opts.senderName },
          { type: 'text', text: opts.url },
        ],
      },
    ]);
  }

  // ── Vendor notifications ────────────────────────────────────────────────

  async notifyVendorNewOrder(opts: {
    phone: string;
    productName: string;
    qty: number;
    amount: string;
    url: string;
  }): Promise<void> {
    await this.sendTemplateMessage(opts.phone, 'new_order_vendor', [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: opts.productName },
          { type: 'text', text: String(opts.qty) },
          { type: 'text', text: opts.amount },
          { type: 'text', text: opts.url },
        ],
      },
    ]);
  }
}
