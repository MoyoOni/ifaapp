import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';

export enum Platform {
  ANDROID = 'ANDROID',
  IOS = 'IOS',
  WEB = 'WEB',
}

export interface DeviceTokenDto {
  userId: string;
  token: string;
  platform: Platform;
  deviceInfo?: any;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  userId?: string; // If targeting specific user
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // Check if Firebase is already initialized
      if (admin.apps.length > 0) {
        this.logger.log('Firebase Admin already initialized');
        return;
      }

      // Initialize Firebase Admin SDK
      const serviceAccount = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT');

      if (serviceAccount) {
        // Parse service account from environment variable
        const serviceAccountParsed = JSON.parse(serviceAccount);

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountParsed),
        });

        this.logger.log('Firebase Admin initialized successfully');
      } else {
        this.logger.warn('Firebase service account not configured - push notifications disabled');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin:', error);
    }
  }

  /**
   * Register or update device token for a user
   */
  async registerDeviceToken(dto: DeviceTokenDto): Promise<void> {
    try {
      // Deactivate existing tokens for this user and platform
      await this.prisma.deviceToken.updateMany({
        where: {
          userId: dto.userId,
          platform: dto.platform,
          active: true,
        },
        data: {
          active: false,
        },
      });

      // Create or update device token
      await this.prisma.deviceToken.upsert({
        where: {
          token: dto.token,
        },
        update: {
          userId: dto.userId,
          platform: dto.platform,
          deviceInfo: dto.deviceInfo,
          active: true,
          updatedAt: new Date(),
        },
        create: {
          userId: dto.userId,
          token: dto.token,
          platform: dto.platform,
          deviceInfo: dto.deviceInfo,
          active: true,
        },
      });

      this.logger.log(`Device token registered for user ${dto.userId} (${dto.platform})`);
    } catch (error) {
      this.logger.error(`Failed to register device token: ${(error as any).message}`);
      throw error;
    }
  }

  /**
   * Remove device token (logout or app uninstall)
   */
  async removeDeviceToken(token: string): Promise<void> {
    try {
      await this.prisma.deviceToken.update({
        where: { token },
        data: { active: false },
      });

      this.logger.log(`Device token removed: ${token.substring(0, 20)}...`);
    } catch (error) {
      this.logger.error(`Failed to remove device token: ${(error as any).message}`);
      throw error;
    }
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(userId: string, payload: PushNotificationPayload): Promise<void> {
    try {
      // Get active device tokens for user
      const deviceTokens = await this.prisma.deviceToken.findMany({
        where: {
          userId,
          active: true,
        },
        select: {
          token: true,
          platform: true,
        },
      });

      if (deviceTokens.length === 0) {
        this.logger.debug(`No active device tokens found for user ${userId}`);
        return;
      }

      // Prepare FCM message
      const message: any = {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
        tokens: deviceTokens.map((dt: any) => dt.token),
      };

      // Send multicast message
      let response;
      try {
        const messaging = admin.messaging();

        // Access sendMulticast dynamically to handle different Firebase Admin versions
        if (
          'sendMulticast' in messaging &&
          typeof (messaging as any).sendMulticast === 'function'
        ) {
          response = await (messaging as any).sendMulticast(message);
        } else {
          // Use sendEachForMulticast for newer Firebase Admin versions
          response = await messaging.sendEachForMulticast(message);
        }
      } catch (error: any) {
        // If sendMulticast fails, try sendEachForMulticast (newer versions)
        if (
          error.code === 'messaging/unknown-error' ||
          error.code === 'messaging/unsupported-algorithm' ||
          error.message?.includes('sendMulticast')
        ) {
          response = await admin.messaging().sendEachForMulticast(message);
          // Ensure response has the expected properties
          if (!response.hasOwnProperty('successCount')) {
            response.successCount = response.responses.filter((r: any) => r.success).length;
          }
          if (!response.hasOwnProperty('failureCount')) {
            response.failureCount = response.responses.filter((r: any) => !r.success).length;
          }
        } else {
          this.logger.error(`Failed to send push notification: ${error.message}`);
          throw error;
        }
      }

      this.logger.log(
        `Push notification sent to user ${userId}: ${response.successCount}/${response.responses.length} successful`
      );

      // Log failed tokens
      if (response.failureCount > 0) {
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success) {
            this.logger.warn(
              `Failed to send push to token ${deviceTokens[idx].token.substring(0, 20)}...: ${resp.error?.message}`
            );

            // Deactivate invalid tokens
            if (
              resp.error?.code === 'messaging/invalid-registration-token' ||
              resp.error?.code === 'messaging/registration-token-not-registered'
            ) {
              this.removeDeviceToken(deviceTokens[idx].token).catch((err) =>
                this.logger.error('Failed to remove invalid token:', err)
              );
            }
          }
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to send push notification to user ${userId}: ${(error as any).message}`
      );
      throw error;
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendToUsers(userIds: string[], payload: PushNotificationPayload): Promise<void> {
    try {
      for (const userId of userIds) {
        await this.sendToUser(userId, payload);
      }
    } catch (error) {
      this.logger.error(`Failed to send push notifications to users: ${(error as any).message}`);
      throw error;
    }
  }

  /**
   * Send broadcast notification to all users
   */
  async sendBroadcast(payload: PushNotificationPayload): Promise<void> {
    try {
      // Get all active device tokens (in batches to avoid memory issues)
      const batchSize = 1000;
      let skip = 0;
      let hasMore = true;

      while (hasMore) {
        const deviceTokens = await this.prisma.deviceToken.findMany({
          where: { active: true },
          select: { token: true },
          skip,
          take: batchSize,
        });

        if (deviceTokens.length === 0) {
          hasMore = false;
          break;
        }

        // Prepare FCM message
        const message: any = {
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: payload.data || {},
          tokens: deviceTokens.map((dt: any) => dt.token),
        };

        // Send multicast message
        const response: any = await (admin.messaging() as any).sendMulticast(message);

        this.logger.log(
          `Broadcast push batch sent: ${response.successCount}/${response.responses.length} successful`
        );

        skip += batchSize;
        hasMore = deviceTokens.length === batchSize;
      }
    } catch (error) {
      this.logger.error(`Failed to send broadcast push notification: ${(error as any).message}`);
      throw error;
    }
  }

  /**
   * Get active device tokens count for a user
   */
  async getUserDeviceCount(userId: string): Promise<number> {
    return this.prisma.deviceToken.count({
      where: {
        userId,
        active: true,
      },
    });
  }

  /**
   * Get user's active device tokens
   */
  async getUserDevices(userId: string): Promise<any[]> {
    return this.prisma.deviceToken.findMany({
      where: {
        userId,
        active: true,
      },
      select: {
        id: true,
        platform: true,
        deviceInfo: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
