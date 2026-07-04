import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import * as admin from 'firebase-admin';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private fcm: admin.messaging.Messaging | null = null;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    // Initialize Firebase Admin SDK. This used to rethrow on any init failure,
    // which crashes the entire app at boot whenever Firebase env vars aren't
    // configured — push notifications are a best-effort feature and must not
    // be able to take down the whole API. Log and leave `fcm` null instead;
    // callers below already check for that.
    try {
      // Check if Firebase Admin is already initialized
      if (admin.apps.length === 0) {
        // Initialize Firebase Admin SDK with service account. admin.ServiceAccount
        // only accepts camelCase projectId/clientEmail/privateKey — this used to
        // build a snake_case service-account JSON shape that admin.credential.cert()
        // has never accepted, so this constructor could never have succeeded.
        const firebaseConfig: admin.ServiceAccount = {
          projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
          privateKey: this.configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
          clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
        };

        if (!firebaseConfig.projectId || !firebaseConfig.privateKey || !firebaseConfig.clientEmail) {
          this.logger.warn('Firebase credentials not fully configured — push notifications disabled');
          return;
        }

        admin.initializeApp({
          credential: admin.credential.cert(firebaseConfig),
        });
      }

      this.fcm = admin.messaging();
      this.logger.log('Firebase Cloud Messaging initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK — push notifications disabled:', error);
    }
  }

  /**
   * Subscribe a user to push notifications
   */
  async subscribeUser(userId: string, token: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Subscribing user ${userId} to push notifications`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException(`User with ID ${userId} not found`);
    }

    if (!this.fcm) {
      return { success: false, message: 'Push notifications are not configured' };
    }

    try {
      // Verify the token is valid
      await this.fcm.subscribeToTopic([token], 'all-users');

      // Store the token in the user's record
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          fcmTokens: { push: token },
        },
      });

      this.logger.log(`User ${userId} subscribed to push notifications successfully`);
      return {
        success: true,
        message: 'Successfully subscribed to push notifications'
      };
    } catch (error) {
      this.logger.error(`Failed to subscribe user ${userId}:`, error);
      return {
        success: false,
        message: 'Failed to subscribe to push notifications'
      };
    }
  }

  /**
   * Unsubscribe a user from push notifications
   */
  async unsubscribeUser(userId: string, token: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Unsubscribing user ${userId} from push notifications`);

    if (!this.fcm) {
      return { success: false, message: 'Push notifications are not configured' };
    }

    try {
      await this.fcm.unsubscribeFromTopic([token], 'all-users');

      // Remove the token from the user's record
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (user && user.fcmTokens) {
        const updatedTokens = user.fcmTokens.filter(t => t !== token);
        await this.prisma.user.update({
          where: { id: userId },
          data: { 
            fcmTokens: updatedTokens
          },
        });
      }

      this.logger.log(`User ${userId} unsubscribed from push notifications successfully`);
      return {
        success: true,
        message: 'Successfully unsubscribed from push notifications'
      };
    } catch (error) {
      this.logger.error(`Failed to unsubscribe user ${userId}:`, error);
      return {
        success: false,
        message: 'Failed to unsubscribe from push notifications'
      };
    }
  }

  /**
   * Send a push notification to a specific user
   */
  async sendNotificationToUser(
    userId: string, 
    title: string, 
    body: string,
    data?: Record<string, string>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    this.logger.log(`Sending push notification to user ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      return {
        success: false,
        error: 'User has no registered push notification tokens'
      };
    }

    if (!this.fcm) {
      return { success: false, error: 'Push notifications are not configured' };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title,
          body,
        },
        data: data || {},
        tokens: user.fcmTokens,
      };

      // sendMulticast was removed from the firebase-admin SDK (this file's
      // pinned version only has sendEachForMulticast) — this call could
      // never have type-checked or run.
      const response = await this.fcm.sendEachForMulticast(message);

      this.logger.log(`Push notification sent to user ${userId} successfully`);
      return {
        success: true,
        messageId: response.successCount > 0 ? 'messageId' : undefined
      };
    } catch (error) {
      this.logger.error(`Failed to send push notification to user ${userId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Send a push notification to multiple users
   */
  async sendNotificationToManyUsers(
    userIds: string[], 
    title: string, 
    body: string,
    data?: Record<string, string>
  ): Promise<{ success: boolean; successCount: number; failureCount: number }> {
    this.logger.log(`Sending push notification to ${userIds.length} users`);

    // Get all users with their FCM tokens
    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        fcmTokens: true
      }
    });

    // Collect all valid tokens
    const allTokens: string[] = [];
    for (const user of users) {
      if (user.fcmTokens && user.fcmTokens.length > 0) {
        allTokens.push(...user.fcmTokens);
      }
    }

    if (allTokens.length === 0) {
      this.logger.warn('No valid FCM tokens found for the specified users');
      return {
        success: false,
        successCount: 0,
        failureCount: userIds.length
      };
    }

    if (!this.fcm) {
      return { success: false, successCount: 0, failureCount: userIds.length };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title,
          body,
        },
        data: data || {},
        tokens: allTokens,
      };

      const response = await this.fcm.sendEachForMulticast(message);

      this.logger.log(`Push notification sent to multiple users successfully`);
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount
      };
    } catch (error) {
      this.logger.error('Failed to send multicast push notification:', error);
      return {
        success: false,
        successCount: 0,
        failureCount: allTokens.length
      };
    }
  }

  /**
   * Send booking reminder notifications
   */
  async sendBookingReminderNotification(
    userId: string,
    appointmentId: string,
    appointmentTitle: string,
    appointmentTime: Date
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const title = 'Appointment Reminder';
    const body = `Your "${appointmentTitle}" appointment is coming up at ${appointmentTime.toLocaleTimeString()}`;
    const data = {
      type: 'appointment_reminder',
      appointmentId,
      userId
    };

    return this.sendNotificationToUser(userId, title, body, data);
  }

  /**
   * Send message received notifications
   */
  async sendMessageReceivedNotification(
    userId: string,
    senderName: string,
    messagePreview: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const title = 'New Message';
    const body = `${senderName}: ${messagePreview.substring(0, 50)}${messagePreview.length > 50 ? '...' : ''}`;
    const data = {
      type: 'new_message',
      userId
    };

    return this.sendNotificationToUser(userId, title, body, data);
  }

  /**
   * Send system notifications
   */
  async sendSystemNotification(
    userIds: string[],
    title: string,
    body: string
  ): Promise<{ success: boolean; successCount: number; failureCount: number }> {
    return this.sendNotificationToManyUsers(userIds, title, body, { type: 'system_notification' });
  }
}
