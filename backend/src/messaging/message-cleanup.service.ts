import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Message Cleanup Service
 * Scheduled job to auto-delete messages based on autoDeleteAt date
 * Runs daily at 2 AM
 */
@Injectable()
export class MessageCleanupService {
  private readonly logger = new Logger(MessageCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredMessages() {
    this.logger.log('Starting message cleanup job...');

    try {
      const now = new Date();

      // Find messages that should be auto-deleted
      const expiredMessages = await this.prisma.message.findMany({
        where: {
          autoDeleteAt: {
            lte: now,
          },
          deletedAt: null, // Not already deleted
        },
        select: {
          id: true,
        },
      });

      if (expiredMessages.length === 0) {
        this.logger.log('No messages to delete');
        return { deleted: 0 };
      }

      // Soft delete messages (set deletedAt timestamp)
      const result = await this.prisma.message.updateMany({
        where: {
          id: {
            in: expiredMessages.map((m) => m.id),
          },
        },
        data: {
          deletedAt: now,
        },
      });

      this.logger.log(`Message cleanup completed. Deleted ${result.count} messages.`);

      return { deleted: result.count };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Message cleanup job failed: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Manual trigger for testing
   */
  async triggerCleanup() {
    return this.cleanupExpiredMessages();
  }
}
