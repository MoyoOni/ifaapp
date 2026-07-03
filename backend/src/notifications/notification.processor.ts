import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from './email.service';
import { PushNotificationService } from './push-notification.service';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly pushService: PushNotificationService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    switch (job.name) {
      case 'sendEmail': {
        const { userId, notification } = job.data;
        return this.emailService.sendNotificationEmail(userId, notification);
      }

      case 'sendPush': {
        const { userId, payload } = job.data;
        return this.pushService.executeSendPush(userId, payload);
      }

      case 'sendPasswordReset': {
        const { email, resetToken, userName } = job.data;
        return this.emailService.sendPasswordResetEmail(email, resetToken, userName);
      }

      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
        throw new Error(`Unknown job type: ${job.name}`);
    }
  }
}
