import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WalletService } from './wallet.service';

/**
 * Escrow Expiry Service
 * Scheduled job to auto-expire escrows and refund to sender
 * Runs daily at midnight
 */
@Injectable()
export class EscrowExpiryService {
  private readonly logger = new Logger(EscrowExpiryService.name);

  constructor(private readonly walletService: WalletService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredEscrows() {
    this.logger.log('Starting escrow expiry job...');

    try {
      const result = await this.walletService.expireEscrows();

      this.logger.log(
        `Escrow expiry job completed. Processed: ${result.processed}, Results: ${JSON.stringify(result.results)}`
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Escrow expiry job failed: ${err.message}`, err.stack);
    }
  }

  /**
   * Manual trigger for testing
   */
  async triggerExpiry() {
    return this.handleExpiredEscrows();
  }
}
