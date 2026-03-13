import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@/shared/services/redis.service';

export interface JobData {
  id: string;
  type: string;
  payload: any;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
}

@Injectable()
export class JobQueueService implements OnModuleInit {
  private readonly logger = new Logger(JobQueueService.name);

  // Queue instances
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();

  constructor(
    private configService: ConfigService,
    private redisService: RedisService
  ) {}

  async onModuleInit() {
    await this.initializeDefaultQueues();
  }

  /**
   * Initialize default queues that are commonly used
   */
  private async initializeDefaultQueues() {
    // Initialize common queues
    await this.createQueue('email');
    await this.createQueue('notification');
    await this.createQueue('image-processing');
    await this.createQueue('data-export');

    this.logger.log(
      'Initialized default queues: email, notification, image-processing, data-export'
    );
  }

  /**
   * Create a new queue
   */
  async createQueue(queueName: string) {
    if (this.queues.has(queueName)) {
      return this.queues.get(queueName);
    }

    const queue = new Queue(queueName, {
      connection: this.redisService.getConnection() as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });

    this.queues.set(queueName, queue);

    // Setup queue events listener
    const queueEvents = new QueueEvents(queueName, {
      connection: this.redisService.getConnection() as any,
    });

    this.queueEvents.set(queueName, queueEvents);

    queueEvents.on('completed', (jobId) => {
      this.logger.log(`Job ${jobId} completed in queue ${queueName}`);
    });

    queueEvents.on('failed', (jobId, failedReason) => {
      this.logger.error(`Job ${jobId} failed in queue ${queueName}: ${failedReason}`);
    });

    return queue;
  }

  /**
   * Add a job to a queue
   */
  async addJob(queueName: string, jobData: JobData, delay?: number) {
    const queue = await this.getQueue(queueName);

    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.add(jobData.type, jobData.payload, {
      jobId: jobData.id,
      priority: this.convertPriority(jobData.priority),
      delay,
    });

    this.logger.log(`Added job ${job.id} to queue ${queueName}`);
    return job;
  }

  /**
   * Process jobs in a queue
   */
  async processQueue(queueName: string, processor: (job: Job) => Promise<JobResult>) {
    if (this.workers.has(queueName)) {
      // Stop the existing worker if it exists
      await this.workers.get(queueName)?.close();
    }

    const queue = await this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const worker = new Worker(
      queueName,
      async (job: Job) => {
        this.logger.log(`Processing job ${job.id} in queue ${queueName}`);
        try {
          const result = await processor(job);
          this.logger.log(`Successfully processed job ${job.id} in queue ${queueName}`);
          return result;
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          this.logger.error(`Error processing job ${job.id} in queue ${queueName}: ${msg}`);
          throw error;
        }
      },
      {
        connection: this.redisService.getConnection() as any,
        concurrency: 5, // Process up to 5 jobs concurrently
      }
    );

    this.workers.set(queueName, worker);

    worker.on('completed', (job) => {
      this.logger.log(`Worker completed job ${job.id} in queue ${queueName}`);
    });

    worker.on('failed', (job, err) => {
      this.logger.error(`Worker failed job ${job?.id} in queue ${queueName}: ${err.message}`);
    });

    return worker;
  }

  /**
   * Get a queue instance
   */
  async getQueue(queueName: string): Promise<Queue | undefined> {
    if (this.queues.has(queueName)) {
      return this.queues.get(queueName);
    }

    // Try to create the queue if it doesn't exist
    return await this.createQueue(queueName);
  }

  /**
   * Get job by ID from a queue
   */
  async getJob(queueName: string, jobId: string): Promise<Job | undefined> {
    const queue = await this.getQueue(queueName);
    if (!queue) return undefined;

    return await queue.getJob(jobId);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string) {
    const queue = await this.getQueue(queueName);
    if (!queue) return null;

    const waiting = await queue.getWaitingCount();
    const active = await queue.getActiveCount();
    const completed = await queue.getCompletedCount();
    const failed = await queue.getFailedCount();
    const delayed = await queue.getDelayedCount();

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: string) {
    const queue = await this.getQueue(queueName);
    if (queue) {
      await queue.pause();
      this.logger.log(`Paused queue ${queueName}`);
    }
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName: string) {
    const queue = await this.getQueue(queueName);
    if (queue) {
      await queue.resume();
      this.logger.log(`Resumed queue ${queueName}`);
    }
  }

  /**
   * Clean up queues and workers
   */
  async cleanup() {
    // Close all workers
    for (const [name, worker] of this.workers) {
      await worker.close();
      this.logger.log(`Closed worker for queue ${name}`);
    }

    // Close all queue event listeners
    for (const [name, queueEvents] of this.queueEvents) {
      await queueEvents.close();
      this.logger.log(`Closed queue events for queue ${name}`);
    }

    // Close all queues
    for (const [name, queue] of this.queues) {
      await queue.close();
      this.logger.log(`Closed queue ${name}`);
    }

    this.workers.clear();
    this.queueEvents.clear();
    this.queues.clear();
  }

  /**
   * Convert priority string to bullmq priority number
   */
  private convertPriority(priority?: 'low' | 'normal' | 'high' | 'critical'): number {
    switch (priority) {
      case 'critical':
        return 1;
      case 'high':
        return 2;
      case 'normal':
        return 3;
      case 'low':
      default:
        return 4;
    }
  }
}
