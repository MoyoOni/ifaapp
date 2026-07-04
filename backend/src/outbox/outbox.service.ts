import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker, ConnectionOptions } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { captureException } from '../sentry';

export interface OutboxEventInput {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

const OUTBOX_QUEUE_NAME = 'outbox';
const MAX_RETRIES = 3;

/**
 * P1-01: Outbox pattern for payment/wallet -> notification writes.
 *
 * Two other BullMQ wrapper services already exist in this codebase
 * (queues/job-queue.service.ts and shared/services/queue.service.ts) but
 * neither is actually wired into a running module — job-queue.service.ts
 * has no .module.ts at all, and queue.service.ts's only consumer
 * (AppService.onModuleInit -> setupCommonProcessors) is never registered as
 * a provider in AppModule, so it never runs. Rather than resurrecting either
 * (a larger, separate cleanup), this owns its own minimal Queue + Worker
 * directly, using plain host/port connection options the way BullMQ expects
 * (job-queue.service.ts passes a node-redis client where BullMQ needs an
 * ioredis-compatible one, which would fail at runtime the moment it's used).
 */
@Injectable()
export class OutboxService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxService.name);
  private queue!: Queue;
  private worker!: Worker;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService
  ) {}

  private getConnectionOptions(): ConnectionOptions {
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
    };
  }

  async onModuleInit() {
    const connection = this.getConnectionOptions();

    this.queue = new Queue(OUTBOX_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: MAX_RETRIES,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 100 },
      },
    });

    this.worker = new Worker(
      OUTBOX_QUEUE_NAME,
      async (job) => {
        const { eventId } = job.data as { eventId: string };
        await this.dispatchEvent(eventId);
      },
      { connection, concurrency: 5 }
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        `Outbox job ${job?.id} failed (attempt ${job?.attemptsMade}/${MAX_RETRIES}): ${err.message}`
      );
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
  }

  /**
   * Write an outbox row inside an already-open Prisma transaction — atomic
   * with whatever balance/state change it's paired with. `tx` is the
   * transaction client passed into a `prisma.$transaction(async (tx) => ...)`
   * callback elsewhere (e.g. WalletService.depositFunds).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createEventInTx(tx: any, input: OutboxEventInput) {
    return tx.outboxEvent.create({ data: input });
  }

  /**
   * Scans for PENDING outbox events and enqueues each into the retryable
   * BullMQ queue. Called by OutboxPollerService's @Cron job. Marks each row
   * PROCESSING atomically (conditional update) so a concurrent/overlapping
   * poll tick can't enqueue the same row twice.
   */
  async enqueuePendingEvents(batchSize = 20): Promise<number> {
    const pending = await this.prisma.outboxEvent.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: batchSize,
    });

    let enqueued = 0;
    for (const event of pending) {
      const claimed = await this.prisma.outboxEvent.updateMany({
        where: { id: event.id, status: 'PENDING' },
        data: { status: 'PROCESSING' },
      });
      if (claimed.count === 0) {
        continue; // another poll tick (or worker) already claimed it
      }

      await this.queue.add(event.eventType, { eventId: event.id }, { jobId: event.id });
      enqueued++;
    }

    return enqueued;
  }

  /**
   * Actually dispatches one outbox event's side effect. Idempotent against
   * duplicate delivery (BullMQ or the poller both retrying the same event) —
   * a row already PROCESSED is a silent no-op.
   */
  private async dispatchEvent(eventId: string): Promise<void> {
    const event = await this.prisma.outboxEvent.findUnique({ where: { id: eventId } });
    if (!event || event.status === 'PROCESSED') {
      return;
    }

    try {
      await this.dispatch(event.eventType, event.payload as Record<string, unknown>);
      await this.prisma.outboxEvent.update({
        where: { id: eventId },
        data: { status: 'PROCESSED', processedAt: new Date() },
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const retries = event.retries + 1;

      if (retries >= MAX_RETRIES) {
        await this.prisma.outboxEvent.update({
          where: { id: eventId },
          data: { status: 'DEAD_LETTER', retries, lastError: err.message },
        });
        this.logger.error(
          `Outbox event ${eventId} (${event.eventType}) moved to DEAD_LETTER after ${retries} attempts: ${err.message}`,
          err.stack
        );
        captureException(err, {
          outboxEventId: eventId,
          eventType: event.eventType,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
        });
      } else {
        await this.prisma.outboxEvent.update({
          where: { id: eventId },
          data: { retries, lastError: err.message },
        });
      }
      throw err; // let BullMQ's own backoff/attempt tracking apply too
    }
  }

  private async dispatch(eventType: string, payload: Record<string, unknown>): Promise<void> {
    switch (eventType) {
      case 'PAYMENT_RECEIVED':
        await this.notificationService.notifyPaymentReceived(
          payload.userId as string,
          payload.amount as number,
          payload.currency as string,
          payload.reference as string
        );
        return;
      default:
        throw new Error(`Unknown outbox event type: ${eventType}`);
    }
  }

  /** Admin visibility (P1-01 acceptance criterion). */
  async getOutboxEvents(filter: { status?: string; limit?: number } = {}) {
    return this.prisma.outboxEvent.findMany({
      where: filter.status ? { status: filter.status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: filter.limit ?? 50,
    });
  }

  /**
   * Manual admin retry for a DEAD_LETTER (or stuck PROCESSING) event —
   * resets it to PENDING so the next poll tick picks it up again.
   */
  async retryEvent(eventId: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id: eventId },
      data: { status: 'PENDING', retries: 0, lastError: null },
    });
  }
}
