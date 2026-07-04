import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxService } from './outbox.service';

/**
 * Bridges outbox_events (a plain Postgres table) into the retryable BullMQ
 * queue — mirrors the existing EscrowExpiryService pattern in the wallet
 * module (a @Cron sweep over a DB table). Runs every minute: outbox rows are
 * written synchronously inside the same transaction as the balance change
 * they came from, so a short delay before the actual notification goes out
 * is an acceptable trade for never losing the "notify" intent.
 */
@Injectable()
export class OutboxPollerService {
  private readonly logger = new Logger(OutboxPollerService.name);

  constructor(private readonly outboxService: OutboxService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async pollPendingEvents() {
    try {
      const enqueued = await this.outboxService.enqueuePendingEvents();
      if (enqueued > 0) {
        this.logger.log(`Enqueued ${enqueued} pending outbox event(s) for dispatch`);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Outbox poll failed: ${err.message}`, err.stack);
    }
  }

  /** Manual trigger for testing. */
  async triggerPoll() {
    return this.pollPendingEvents();
  }
}
