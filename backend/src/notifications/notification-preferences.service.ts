import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationPreferencesService {
  constructor(private prisma: PrismaService) {}

  async getPreferences(userId: string) {
    let preferences = await this.prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Create default preferences if they don't exist
      preferences = await this.prisma.notificationPreferences.create({
        data: {
          userId,
          emailBooking: true,
          emailReminder: true,
          emailDigest: true,
          emailPlan: true,
          emailMessages: true,
          emailMarketing: true,
          pushReminder: true,
          pushMessages: true,
          pushFollowup: true,
          pushForum: true,
          pushCircles: true,
          // VENDOR_BACKLOG.md VND-004
          emailOrder: true,
          pushOrder: true,
          emailReviewReceived: true,
          pushReviewReceived: false,
          emailLowStock: true,
          pushLowStock: false,
        },
      });
    }

    return preferences;
  }

  async updatePreferences(userId: string, data: any) {
    const existing = await this.prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    if (existing) {
      return await this.prisma.notificationPreferences.update({
        where: { userId },
        data,
      });
    } else {
      return await this.prisma.notificationPreferences.create({
        data: {
          userId,
          ...data,
        },
      });
    }
  }

  async isNotificationEnabled(
    userId: string,
    typeKey: string,
    channel: 'email' | 'push'
  ): Promise<boolean> {
    const prefs = await this.getPreferences(userId);

    // Define valid preference keys to prevent indexing errors
    const validEmailKeys = [
      'emailBooking',
      'emailReminder',
      'emailDigest',
      'emailPlan',
      'emailMessages',
      'emailMarketing',
      'emailOrder',
      'emailReviewReceived',
      'emailLowStock',
    ];

    const validPushKeys = [
      'pushReminder',
      'pushMessages',
      'pushFollowup',
      'pushForum',
      'pushCircles',
      'pushOrder',
      'pushReviewReceived',
      'pushLowStock',
    ];

    // Construct the preference key based on type and channel
    const prefKey = `${channel}${typeKey.charAt(0).toUpperCase() + typeKey.slice(1)}`;

    // Check if the constructed key is valid
    const validKeys = channel === 'email' ? validEmailKeys : validPushKeys;

    if (validKeys.includes(prefKey) && typeof (prefs as any)[prefKey] === 'boolean') {
      return (prefs as any)[prefKey];
    }

    // Fallback: check if the general channel is enabled
    if (channel === 'email') {
      return (prefs as any).emailMessages; // Use a general setting as default
    } else {
      return (prefs as any).pushMessages; // Use a general setting as default
    }
  }
}
