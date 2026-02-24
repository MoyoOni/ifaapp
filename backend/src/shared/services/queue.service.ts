import { Injectable, Logger } from '@nestjs/common';
import { Queue, Worker, Job, ConnectionOptions } from 'bullmq';
import { RedisService } from './redis.service';

export interface QueueJobData {
  type: string;
  payload: any;
  metadata?: any;
}

export interface QueueJobOptions {
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  priority?: 'low' | 'normal' | 'medium' | 'high' | number;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private queues: Map<string, Queue> = new Map();

  constructor(private readonly redisService: RedisService) {}

  /**
   * Gets the connection options for BullMQ
   * BullMQ uses ioredis-style connection options, not the node-redis client
   */
  private getConnectionOptions(): ConnectionOptions {
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
    };
  }

  /**
   * Creates or retrieves a queue instance
   */
  getQueue(queueName: string): Queue {
    if (this.queues.has(queueName)) {
      return this.queues.get(queueName)!;
    }

    const connection = this.getConnectionOptions();
    
    const queue = new Queue(queueName, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    this.queues.set(queueName, queue);
    return queue;
  }

  /**
   * Adds a job to the specified queue
   */
  async addJob(queueName: string, jobName: string, data: QueueJobData, options?: QueueJobOptions): Promise<Job> {
    const queue = this.getQueue(queueName);
    
    const bullOptions: any = {};
    if (options) {
      if (options.delay) bullOptions.delay = options.delay;
      if (options.attempts) bullOptions.attempts = options.attempts;
      if (options.backoff) bullOptions.backoff = options.backoff;
      if (options.priority) bullOptions.priority = options.priority;
    }

    const job = await queue.add(jobName, data, bullOptions);
    
    this.logger.log(`Added job ${jobName} to queue ${queueName}, jobId: ${job.id}`);
    return job;
  }

  /**
   * Processes jobs in a queue
   */
  async processQueue<T = any>(
    queueName: string,
    processor: (job: Job) => Promise<T>, // Fixed type
    concurrency: number = 1
  ): Promise<Worker> {
    const connection = this.getConnectionOptions();
    const worker = new Worker(
      queueName,
      processor,
      {
        connection,
        concurrency,
      }
    );

    worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed in queue ${queueName}`);
    });

    worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed in queue ${queueName}: ${err.message}`);
    });

    return worker;
  }

  /**
   * Predefined processors for common tasks
   */
  async setupCommonProcessors() {
    // Notification processor
    await this.processQueue('notifications', async (job) => {
      const { type, payload } = job.data as QueueJobData;
      
      switch (type) {
        case 'EMAIL_NOTIFICATION':
          // Process email notification
          this.logger.log(`Processing email notification for ${payload.recipient}`);
          // In a real implementation, this would send an email
          /*
          try {
            await this.emailService.send({
              to: payload.recipient,
              subject: payload.subject,
              html: payload.body,
            });
            return { success: true, messageId: '...' };
          } catch (error) {
            this.logger.error(`Failed to send email: ${error.message}`);
            throw error; // This will trigger retry logic
          }
          */
          break;
          
        case 'PUSH_NOTIFICATION':
          // Process push notification
          this.logger.log(`Processing push notification for ${payload.deviceToken}`);
          // In a real implementation, this would send a push notification
          /*
          try {
            await this.pushService.send({
              deviceToken: payload.deviceToken,
              title: payload.title,
              body: payload.body,
            });
            return { success: true, messageId: '...' };
          } catch (error) {
            this.logger.error(`Failed to send push notification: ${error.message}`);
            throw error; // This will trigger retry logic
          }
          */
          break;
          
        default:
          this.logger.warn(`Unknown notification type: ${type}`);
          throw new Error(`Unknown notification type: ${type}`);
      }
      
      return { success: true };
    });

    // Image processing processor
    await this.processQueue('image-processing', async (job) => {
      const { type, payload } = job.data as QueueJobData;
      
      switch (type) {
        case 'IMAGE_OPTIMIZE':
          this.logger.log(`Optimizing image: ${payload.imageId}`);
          // In a real implementation, this would optimize an image
          /*
          try {
            const result = await this.imageOptimizer.optimize({
              imageId: payload.imageId,
              imagePath: payload.filePath,
              quality: payload.quality || 80,
            });
            return { success: true, optimizedImageId: result.id };
          } catch (error) {
            this.logger.error(`Failed to optimize image: ${error.message}`);
            throw error;
          }
          */
          break;
          
        case 'THUMBNAIL_GENERATE':
          this.logger.log(`Generating thumbnail for: ${payload.imageId}`);
          // In a real implementation, this would generate a thumbnail
          /*
          try {
            const result = await this.thumbnailGenerator.generate({
              imageId: payload.imageId,
              imagePath: payload.filePath,
              dimensions: payload.dimensions || { width: 200, height: 200 },
            });
            return { success: true, thumbnailPath: result.path };
          } catch (error) {
            this.logger.error(`Failed to generate thumbnail: ${error.message}`);
            throw error;
          }
          */
          break;
          
        default:
          this.logger.warn(`Unknown image processing type: ${type}`);
          throw new Error(`Unknown image processing type: ${type}`);
      }
      
      return { success: true };
    });

    // API rate limiting processor
    await this.processQueue('api-rate-limit', async (job) => {
      const { type, payload } = job.data as QueueJobData;
      
      switch (type) {
        case 'RATE_LIMIT_LOG':
          this.logger.log(`Rate limit event for user: ${payload.userId}`);
          // In a real implementation, this would log rate limit events
          /*
          try {
            await this.rateLimitLogger.log({
              userId: payload.userId,
              endpoint: payload.endpoint,
              timestamp: new Date(),
              ip: payload.ip,
            });
            return { success: true };
          } catch (error) {
            this.logger.error(`Failed to log rate limit event: ${error.message}`);
            throw error;
          }
          */
          break;
          
        default:
          this.logger.warn(`Unknown rate limit type: ${type}`);
          throw new Error(`Unknown rate limit type: ${type}`);
      }
      
      return { success: true };
    });
  }

  /**
   * Pauses a queue
   */
  async pauseQueue(queueName: string) {
    const queue = this.getQueue(queueName);
    await queue.pause();
    this.logger.log(`Paused queue: ${queueName}`);
  }

  /**
   * Resumes a queue
   */
  async resumeQueue(queueName: string) {
    const queue = this.getQueue(queueName);
    await queue.resume();
    this.logger.log(`Resumed queue: ${queueName}`);
  }

  /**
   * Gets queue metrics
   */
  async getQueueMetrics(queueName: string) {
    const queue = this.getQueue(queueName);
    
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
}