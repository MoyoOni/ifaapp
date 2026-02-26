import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobQueueService, JobData } from '../../queues/job-queue.service';
import { User } from '@prisma/client';

export interface PushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
  topic?: string;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => JobQueueService))
    private jobQueueService: JobQueueService,
  ) {}

  /**
   * Queue a push notification for sending
   */
  async queuePushNotification(payload: PushNotificationPayload): Promise<void> {
    const pushJob: JobData = {
      id: `push-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'send-push-notification',
      payload: {
        ...payload,
        queuedAt: new Date().toISOString(),
      },
      priority: payload.priority || 'normal',
    };

    try {
      await this.jobQueueService.addJob('notification', pushJob);
      this.logger.log(`Push notification queued for user ${payload.userId}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to queue push notification for user ${payload.userId}: ${msg}`);
      throw error;
    }
  }

  /**
   * Send a booking reminder push notification
   */
  async sendBookingReminder(user: User, booking: any): Promise<void> {
    const payload: PushNotificationPayload = {
      userId: user.id,
      title: 'Booking Reminder',
      body: `Your booking with ${booking.practitionerName} is scheduled for ${booking.time} today.`,
      data: {
        type: 'booking_reminder',
        bookingId: booking.id,
        action: 'view_booking',
      },
      priority: 'high',
    };

    await this.queuePushNotification(payload);
  }

  /**
   * Send a new message notification
   */
  async sendNewMessageNotification(user: User, message: any): Promise<void> {
    const payload: PushNotificationPayload = {
      userId: user.id,
      title: `New message from ${message.senderName}`,
      body: message.preview || 'You have a new message',
      data: {
        type: 'new_message',
        messageId: message.id,
        senderId: message.senderId,
        action: 'view_message',
      },
      priority: 'normal',
    };

    await this.queuePushNotification(payload);
  }

  /**
   * Send a booking confirmation notification
   */
  async sendBookingConfirmationNotification(user: User, booking: any): Promise<void> {
    const payload: PushNotificationPayload = {
      userId: user.id,
      title: 'Booking Confirmed',
      body: `Your booking with ${booking.practitionerName} on ${booking.date} at ${booking.time} has been confirmed.`,
      data: {
        type: 'booking_confirmation',
        bookingId: booking.id,
        action: 'view_booking',
      },
      priority: 'high',
    };

    await this.queuePushNotification(payload);
  }

  /**
   * Send a guidance plan notification
   */
  async sendGuidancePlanNotification(user: User, plan: any): Promise<void> {
    const payload: PushNotificationPayload = {
      userId: user.id,
      title: 'New Guidance Plan',
      body: `Your spiritual guidance plan "${plan.title}" is ready for review.`,
      data: {
        type: 'guidance_plan',
        planId: plan.id,
        action: 'view_plan',
      },
      priority: 'normal',
    };

    await this.queuePushNotification(payload);
  }

  /**
   * Send a system notification
   */
  async sendSystemNotification(userId: string, title: string, body: string, data?: any): Promise<void> {
    const payload: PushNotificationPayload = {
      userId,
      title,
      body,
      data: {
        type: 'system_notification',
        ...data,
        action: data?.action || 'view_notification',
      },
      priority: 'normal',
    };

    await this.queuePushNotification(payload);
  }

  /**
   * Initialize the notification queue processor
   */
  async initializeQueueProcessor() {
    await this.jobQueueService.processQueue('notification', async (job) => {
      const payload = job.data as PushNotificationPayload;
      
      try {
        // In a real implementation, we would integrate with Firebase Cloud Messaging (FCM)
        // or Apple Push Notification Service (APNs) here
        await this.sendPushNotificationToUser(payload);
        return { success: true };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to send push notification to user ${payload.userId}: ${msg}`);
        return { success: false, error: msg };
      }
    });

    this.logger.log('Push notification queue processor initialized');
  }

  /**
   * Actually send the push notification to the user device
   * This is a placeholder implementation - in a real app, this would integrate with FCM/APNs
   */
  private async sendPushNotificationToUser(payload: PushNotificationPayload): Promise<void> {
    // Placeholder implementation
    // In a real app, we would:
    // 1. Fetch the user's device tokens from the database
    // 2. Use the appropriate push notification service (FCM for Android, APNs for iOS)
    // 3. Send the notification to the device(s)
    
    this.logger.log(`Sending push notification to user ${payload.userId}: ${payload.title} - ${payload.body}`);
    
    // Simulate the sending process
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In a real implementation, we would have something like:
    /*
    const userDeviceTokens = await this.userService.getDeviceTokens(payload.userId);
    
    for (const token of userDeviceTokens) {
      if (token.platform === 'android') {
        await this.fcmService.sendToDevice(token.token, payload);
      } else if (token.platform === 'ios') {
        await this.apnsService.sendToToken(token.token, payload);
      }
    }
    */
  }

  /**
   * Register a device token for push notifications
   */
  async registerDeviceToken(userId: string, token: string, deviceType?: string): Promise<void> {
    // In a real implementation, we would store the device token in the database
    // For now, we'll just log the registration
    
    this.logger.log(`Registering device token for user ${userId}, type: ${deviceType || 'unknown'}`);
    
    // In a real implementation, we would do something like:
    /*
    await this.prisma.deviceToken.upsert({
      where: {
        userId_token: {
          userId,
          token,
        },
      },
      update: {
        lastUsed: new Date(),
        deviceType,
      },
      create: {
        userId,
        token,
        deviceType: deviceType || 'unknown',
      },
    });
    */
  }
}