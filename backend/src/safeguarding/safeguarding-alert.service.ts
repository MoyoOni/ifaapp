import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * docs/safeguarding SAFE-04: an urgent case reaches the Safeguarding Lead
 * outside the app. Telegram is free and immediate and needs no email
 * (SES is still in the sandbox). Configure SAFEGUARDING_TELEGRAM_BOT_TOKEN
 * and SAFEGUARDING_TELEGRAM_CHAT_ID; until then this does nothing.
 *
 * The message carries only the case reference and priority -- never names,
 * accounts or what was reported, which stay on Ìlú Àṣẹ.
 */
@Injectable()
export class SafeguardingAlertService {
  private readonly logger = new Logger(SafeguardingAlertService.name);

  constructor(private config: ConfigService) {}

  get isConfigured(): boolean {
    return !!(this.config.get<string>('SAFEGUARDING_TELEGRAM_BOT_TOKEN') && this.config.get<string>('SAFEGUARDING_TELEGRAM_CHAT_ID'));
  }

  async urgentCase(ref: string): Promise<void> {
    await this.send(`Urgent safeguarding case ${ref}. Open ${this.site}/admin (Safeguarding Cases) now.`, ref);
  }

  /** "Send a test alert" on the Safeguarding Cases screen. */
  async test(): Promise<boolean> {
    return this.send('Test alert from Ìlú Àṣẹ: safeguarding alerts reach this chat.', 'test');
  }

  private get site() {
    return this.config.get<string>('FRONTEND_URL') || 'https://iluase.com';
  }

  private async send(text: string, label: string): Promise<boolean> {
    if (!this.isConfigured) return false;
    const token = this.config.get<string>('SAFEGUARDING_TELEGRAM_BOT_TOKEN');
    const chatId = this.config.get<string>('SAFEGUARDING_TELEGRAM_CHAT_ID');
    try {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text }, { timeout: 10000 });
      return true;
    } catch (err) {
      // Never block a report on the alert; the in-app alert has already gone.
      this.logger.error(`Telegram alert (${label}) failed: ${(err as Error).message}`);
      return false;
    }
  }
}
