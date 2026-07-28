import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionsService } from './subscriptions.service';

// V8-404/V8-504: the renewal reminder and win-back emails previously had no
// automatic trigger at all -- reminders only fired as a side effect of a
// user loading GET /subscriptions/me, and win-back only fired when an admin
// manually clicked a button. These three daily sweeps (expiry first, since
// win-back keys off a subscription actually being marked EXPIRED) are the
// real automation, following the same @Cron pattern already used elsewhere
// in this backend (see low-stock-alert.service.ts, escrow-expiry.service.ts).
@Injectable()
export class SubscriptionLifecycleCronService {
  private readonly logger = new Logger(SubscriptionLifecycleCronService.name);

  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runExpirySweep() {
    try {
      await this.subscriptionsService.runExpirySweep();
    } catch (err) {
      this.logger.error('Subscription expiry sweep failed', err);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async runRenewalReminderSweep() {
    try {
      await this.subscriptionsService.runRenewalReminderSweep();
    } catch (err) {
      this.logger.error('Renewal reminder sweep failed', err);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async runWinBackSweep() {
    try {
      await this.subscriptionsService.runWinBackSweep();
    } catch (err) {
      this.logger.error('Win-back sweep failed', err);
    }
  }
}
