import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PaymentsService } from './payments.service';
import { captureException } from '../sentry';

/**
 * Webhook Monitor Service
 * Scheduled job to flag payments missing webhooks
 * Runs every 6 hours
 */
@Injectable()
export class WebhookMonitorService {
  private readonly logger = new Logger(WebhookMonitorService.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Cron('0 */6 * * *') // Every 6 hours
  async checkMissingWebhooks() {
    this.logger.log('Starting webhook monitoring job...');

    try {
      const unverifiedPayments = await this.paymentsService.getUnverifiedPayments(24);

      if (unverifiedPayments.length > 0) {
        this.logger.warn(
          `Found ${unverifiedPayments.length} payments without webhook confirmation after 24 hours`
        );

        // Most are abandoned checkouts, so this logs rather than alerts;
        // telling those from a missed webhook needs the provider's answer.
        unverifiedPayments.forEach((payment) => {
          this.logger.warn(
            `Unverified payment: ${payment.transactionId} - ${payment.amount} ${payment.currency} - user ${payment.userId}`
          );
        });
      } else {
        this.logger.log('All payments have webhook confirmations');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Webhook monitoring job failed: ${err.message}`, err.stack);
      captureException(err, { job: 'webhook-monitor' });
    }
  }

  /**
   * Manual trigger for testing
   */
  async triggerCheck() {
    return this.checkMissingWebhooks();
  }
}
