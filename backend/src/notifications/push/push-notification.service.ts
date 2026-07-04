import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as admin from 'firebase-admin';

export enum Platform {
  ANDROID = 'ANDROID',
  IOS = 'IOS',
  WEB = 'WEB',
}

export interface PushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  priority?: 'low' | 'normal' | 'high';
  imageUrl?: string;
  clickAction?: string;
}

@Injectable()
export class PushNotificationService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationService.name);
  private readonly enabled: boolean;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    const projectId = configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = configService.get<string>('FIREBASE_PRIVATE_KEY');
    this.enabled = !!(projectId && clientEmail && privateKey);
  }

  onModuleInit() {
    if (!this.enabled) {
      this.logger.warn(
        'Push notifications disabled — FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY not configured'
      );
      return;
    }

    // Only initialise once across hot reloads
    if (!admin.apps.length) {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID')!;
      const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL')!;
      const privateKey = this.configService
        .get<string>('FIREBASE_PRIVATE_KEY')!
        .replace(/\\n/g, '\n');

      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
      this.logger.log('Firebase Admin SDK initialised');
    }
  }

  /**
   * Send push notification to a specific user (all their active devices).
   * Never throws — a push failure must never break the main flow.
   */
  async sendToUser(payload: PushNotificationPayload): Promise<void> {
    if (!this.enabled) return;

    try {
      const tokens = await this.prisma.deviceToken.findMany({
        where: { userId: payload.userId, active: true },
        select: { id: true, token: true },
      });

      if (!tokens.length) return;

      const message: admin.messaging.MulticastMessage = {
        tokens: tokens.map((t) => t.token),
        notification: { title: payload.title, body: payload.body, imageUrl: payload.imageUrl },
        data: {
          ...(payload.data || {}),
          clickAction: payload.clickAction || '/',
        },
        android: {
          priority: payload.priority === 'high' ? 'high' : 'normal',
          notification: { clickAction: 'FLUTTER_NOTIFICATION_CLICK' },
        },
        webpush: {
          notification: { icon: '/icons/icon-192x192.png', badge: '/icons/badge-72x72.png' },
          fcmOptions: { link: payload.clickAction || '/' },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      // Clean up invalid tokens
      const invalidTokenIds: string[] = [];
      response.responses.forEach((r, i) => {
        if (!r.success && r.error) {
          const code = r.error.code;
          if (
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/registration-token-not-registered'
          ) {
            invalidTokenIds.push(tokens[i].id);
          }
        }
      });

      if (invalidTokenIds.length) {
        await this.prisma.deviceToken.updateMany({
          where: { id: { in: invalidTokenIds } },
          data: { active: false },
        });
      }

      this.logger.log(
        `Push sent to user ${payload.userId}: ${response.successCount} ok, ${response.failureCount} failed`
      );
    } catch (err) {
      this.logger.error(
        `Push notification failed for user ${payload.userId}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /** Register or refresh a device FCM token */
  async registerDeviceToken(
    userId: string,
    token: string,
    deviceType?: string,
    platform?: string
  ): Promise<void> {
    try {
      await this.prisma.deviceToken.upsert({
        where: { token },
        update: {
          active: true,
          updatedAt: new Date(),
          deviceInfo: deviceType ? { deviceType } : undefined,
        },
        create: {
          userId,
          token,
          platform: platform || 'web',
          deviceInfo: deviceType ? { deviceType } : undefined,
          active: true,
        },
      });
      this.logger.log(`Device token registered for user ${userId}`);
    } catch (err) {
      this.logger.error(
        `Failed to register device token: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /** Deregister a device token (on logout) */
  async deregisterDeviceToken(token: string): Promise<void> {
    try {
      await this.prisma.deviceToken.updateMany({ where: { token }, data: { active: false } });
    } catch (err) {
      this.logger.error(
        `Failed to deregister token: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // ─── Convenience helpers ──────────────────────────────────────────────────

  async notifyBookingConfirmed(userId: string, babalawoName: string, bookingId: string) {
    await this.sendToUser({
      userId,
      title: 'Booking Confirmed ✓',
      body: `Your session with ${babalawoName} is confirmed.`,
      data: { type: 'booking_confirmed', bookingId },
      clickAction: `/client/consultations`,
      priority: 'high',
    });
  }

  async notifyNewBooking(userId: string, clientName: string, bookingId: string) {
    await this.sendToUser({
      userId,
      title: 'New Booking Request',
      body: `${clientName} has requested a session.`,
      data: { type: 'new_booking', bookingId },
      clickAction: `/practitioner/consultations`,
      priority: 'high',
    });
  }

  async notifyNewMessage(userId: string, senderName: string, preview: string, senderId: string) {
    await this.sendToUser({
      userId,
      title: `Message from ${senderName}`,
      body: preview || 'You have a new message',
      data: { type: 'new_message', senderId },
      clickAction: `/messages/${senderId}`,
    });
  }

  async notifyNewOrder(userId: string, orderId: string) {
    await this.sendToUser({
      userId,
      title: 'New Order Received',
      body: 'A customer just placed an order in your shop.',
      data: { type: 'new_order', orderId },
      clickAction: `/vendor/dashboard`,
      priority: 'high',
    });
  }

  async notifyGuidancePlanReady(userId: string, planTitle: string, planId: string) {
    await this.sendToUser({
      userId,
      title: 'Guidance Plan Ready',
      body: `Your plan "${planTitle}" is ready for review.`,
      data: { type: 'guidance_plan', planId },
      clickAction: `/client/guidance-plans`,
    });
  }
}
