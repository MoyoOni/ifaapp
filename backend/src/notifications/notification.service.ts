import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { PushNotificationService } from './push-notification.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { NotificationPreferencesService } from './notification-preferences.service';

export enum NotificationType {
  APPOINTMENT = 'APPOINTMENT',
  MESSAGE = 'MESSAGE',
  ORDER = 'ORDER',
  PAYMENT = 'PAYMENT',
  VERIFICATION = 'VERIFICATION',
  DISPUTE = 'DISPUTE',
  SYSTEM = 'SYSTEM',
  TEMPLE = 'TEMPLE',
  GUIDANCE_PLAN = 'GUIDANCE_PLAN',
  FORUM_REPLY = 'FORUM_REPLY',
  MENTION = 'MENTION',
  REVIEW_REQUEST = 'REVIEW_REQUEST',
}

export enum NotificationCategory {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  URGENT = 'URGENT',
}

interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  category?: NotificationCategory;
  title: string;
  message: string;
  data?: any;
  sendEmail?: boolean;
  sendPush?: boolean;
}

/**
 * Notification Service
 * Handles creating, sending, and managing notifications
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private notificationPreferencesService: NotificationPreferencesService,
    @Optional() private pushService?: PushNotificationService,
    @Optional() private emailService?: EmailService
  ) {}

  /**
   * Check if a notification should be sent based on user preferences
   */
  async shouldSendNotification(
    userId: string,
    notificationType: NotificationType,
    channel: 'email' | 'push'
  ): Promise<boolean> {
    // Map notification types to preference keys
    let typeKey: string;
    switch (notificationType) {
      case NotificationType.APPOINTMENT:
        typeKey = 'booking';
        break;
      case NotificationType.MESSAGE:
        typeKey = 'messages';
        break;
      case NotificationType.GUIDANCE_PLAN:
        typeKey = 'plan';
        break;
      case NotificationType.FORUM_REPLY:
      case NotificationType.MENTION:
        typeKey = 'forum';
        break;
      case NotificationType.REVIEW_REQUEST:
        typeKey = 'followup';
        break;
      default:
        // For types not specifically controlled, allow them by default
        return true;
    }
    
    return this.notificationPreferencesService.isNotificationEnabled(userId, typeKey, channel);
  }

  /**
   * Create and send a notification
   */
  async createNotification(dto: CreateNotificationDto) {
    try {
      // Check preferences before creating notification
      if (dto.sendEmail) {
        const shouldSendEmail = await this.shouldSendNotification(
          dto.userId,
          dto.type,
          'email'
        );
        if (!shouldSendEmail) {
          dto.sendEmail = false;
        }
      }
      
      if (dto.sendPush) {
        const shouldSendPush = await this.shouldSendNotification(
          dto.userId,
          dto.type,
          'push'
        );
        if (!shouldSendPush) {
          dto.sendPush = false;
        }
      }

      // Create notification in database
      const notification = await this.prisma.notification.create({
        data: {
          userId: dto.userId,
          type: dto.type,
          category: dto.category || NotificationCategory.INFO,
          title: dto.title,
          message: dto.message,
          data: dto.data || {},
          emailSent: false,
          pushSent: false,
        },
      });

      // Send via email if requested
      if (dto.sendEmail && this.emailService) {
        try {
          await this.emailService.sendNotificationEmail(dto.userId, notification);
          await this.prisma.notification.update({
            where: { id: notification.id },
            data: { emailSent: true },
          });
        } catch (error) {
          this.logger.error(`Failed to send email notification: ${(error as any).message}`);
        }
      } else if (dto.sendEmail && !this.emailService) {
        this.logger.warn('EmailService unavailable; cannot send email notification');
      }

      // Push notifications temporarily disabled (feature removed)
      if (dto.sendPush && this.pushService) {
        try {
          await this.pushService.sendToUser(dto.userId, {
            title: dto.title,
            body: dto.message,
            data: {
              notificationId: notification.id,
              type: dto.type,
              action: dto.data?.action,
            },
          });
          await this.prisma.notification.update({
            where: { id: notification.id },
            data: { pushSent: true },
          });
        } catch (error) {
          this.logger.error(`Failed to send push notification: ${(error as any).message}`);
        }
      } else if (dto.sendPush && !this.pushService) {
        this.logger.warn('PushService unavailable; cannot send push notification');
      }

      return notification;
    } catch (error) {
      this.logger.error(`Failed to create notification: ${(error as any).message}`, error);
      throw error;
    }
  }

  /**
   * Get notifications for a user with optional filtering
   */
  async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false,
    filter?: string,
    take: number = 50
  ) {
    const now = new Date();
    const where: any = {
      userId,
      OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
    };
    if (unreadOnly) {
      where.read = false;
    }

    // Map frontend filter names to notification types
    if (filter && filter !== 'all') {
      if (filter === 'unread') {
        where.read = false;
      } else if (filter === 'messages') {
        where.type = 'MESSAGE';
      } else if (filter === 'appointments') {
        where.type = 'APPOINTMENT';
      } else if (filter === 'orders') {
        where.type = 'ORDER';
      } else if (filter === 'community') {
        where.type = { in: ['TEMPLE', 'SYSTEM'] };
      }
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  /**
   * Get notification counts grouped by type
   */
  async getCountByType(userId: string) {
    const [unread, messages, appointments, orders, community] = await Promise.all([
      this.prisma.notification.count({ where: { userId, read: false } }),
      this.prisma.notification.count({ where: { userId, type: 'MESSAGE' } }),
      this.prisma.notification.count({ where: { userId, type: 'APPOINTMENT' } }),
      this.prisma.notification.count({ where: { userId, type: 'ORDER' } }),
      this.prisma.notification.count({ where: { userId, type: { in: ['TEMPLE', 'SYSTEM'] } } }),
    ]);
    return { unread, messages, appointments, orders, community };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this notification');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string) {
    try {
      return await this.prisma.notification.count({
        where: {
          userId,
          read: false,
        },
      });
    } catch {
      return 0;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this notification');
    }

    return this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  // Convenience methods for common notification types

  /**
   * Send appointment notification
   */
  async notifyAppointmentCreated(appointmentId: string, userId: string, appointmentData: any) {
    return this.createNotification({
      userId,
      type: NotificationType.APPOINTMENT,
      category: NotificationCategory.SUCCESS,
      title: 'Appointment Scheduled',
      message: `Your appointment with ${appointmentData.babalawoName || 'your Babalawo'} has been scheduled for ${appointmentData.date} at ${appointmentData.time}.`,
      data: { appointmentId, ...appointmentData },
      sendEmail: true,
      sendPush: true,
    });
  }

  /**
   * Send appointment confirmed notification
   */
  async notifyAppointmentConfirmed(appointmentId: string, userId: string, appointmentData: any) {
    return this.createNotification({
      userId,
      type: NotificationType.APPOINTMENT,
      category: NotificationCategory.SUCCESS,
      title: 'Appointment Confirmed',
      message: `Your appointment with ${appointmentData.babalawoName || 'your Babalawo'} on ${appointmentData.date} at ${appointmentData.time} has been confirmed.`,
      data: { appointmentId, ...appointmentData },
      sendEmail: true,
      sendPush: true,
    });
  }

  /**
   * Send appointment declined notification
   */
  async notifyAppointmentDeclined(appointmentId: string, userId: string, declineData: any) {
    return this.createNotification({
      userId,
      type: NotificationType.APPOINTMENT,
      category: NotificationCategory.ERROR,
      title: 'Appointment Declined',
      message: `Your appointment request has been declined.${declineData.reason ? ` Reason: ${declineData.reason}` : ''}`,
      data: { appointmentId, ...declineData },
      sendEmail: true,
      sendPush: true,
    });
  }

  /**
   * Send appointment cancelled notification
   */
  async notifyAppointmentCancelled(appointmentId: string, userId: string, cancelData: any) {
    return this.createNotification({
      userId,
      type: NotificationType.APPOINTMENT,
      category: NotificationCategory.WARNING,
      title: 'Appointment Cancelled',
      message: `Your appointment has been cancelled by ${cancelData.cancelledBy}.${cancelData.reason ? ` Reason: ${cancelData.reason}` : ''}`,
      data: { appointmentId, ...cancelData },
      sendEmail: true,
      sendPush: true,
    });
  }

  // ==================== Order Notifications ====================

  /**
   * Notify customer that order was placed successfully
   */
  async notifyOrderPlaced(userId: string, orderId: string, orderData: any) {
    return this.createNotification({
      userId,
      type: NotificationType.ORDER,
      category: NotificationCategory.SUCCESS,
      title: 'Order Placed Successfully',
      message: `Your order #${orderId.slice(0, 8)} has been placed. Total: ${orderData.currency === 'NGN' ? '₦' : '$'}${orderData.totalAmount?.toLocaleString() || '0'}`,
      data: { orderId, ...orderData },
      sendEmail: true,
      sendPush: true,
    });
  }

  /**
   * Notify vendor of new order
   */
  async notifyVendorNewOrder(vendorUserId: string, orderId: string, orderData: any) {
    return this.createNotification({
      userId: vendorUserId,
      type: NotificationType.ORDER,
      category: NotificationCategory.INFO,
      title: 'New Order Received',
      message: `You have a new order #${orderId.slice(0, 8)} from ${orderData.customerName || 'a customer'}. Total: ${orderData.currency === 'NGN' ? '₦' : '$'}${orderData.totalAmount?.toLocaleString() || '0'}`,
      data: { orderId, ...orderData },
      sendEmail: true,
      sendPush: true,
    });
  }

  /**
   * Notify customer that order was paid
   */
  async notifyOrderPaid(userId: string, orderId: string, orderData: any) {
    return this.createNotification({
      userId,
      type: NotificationType.ORDER,
      category: NotificationCategory.SUCCESS,
      title: 'Payment Confirmed',
      message: `Payment for order #${orderId.slice(0, 8)} has been confirmed. Your order is being processed.`,
      data: { orderId, status: 'PAID', ...orderData },
      sendEmail: true,
      sendPush: true,
    });
  }

  // ==================== Payment / Wallet Notifications (HC-206.2) ====================

  /**
   * Notify user that a payment was received and wallet credited
   */
  async notifyPaymentReceived(userId: string, amount: number, currency: string, reference: string) {
    const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency;
    const formatted = `${symbol}${amount.toLocaleString()}`;
    return this.createNotification({
      userId,
      type: NotificationType.PAYMENT,
      category: NotificationCategory.SUCCESS,
      title: 'Payment Received',
      message: `Your wallet has been credited with ${formatted}. Reference: ${reference.slice(0, 12)}.`,
      data: { amount, currency, reference },
      sendEmail: true,
      sendPush: true,
    });
  }

  // ==================== Guidance Plan Notifications ====================

  /**
   * Notify client that guidance plan has been created
   */
  async notifyGuidancePlanCreated(clientId: string, planId: string, planData: any) {
    return this.createNotification({
      userId: clientId,
      type: NotificationType.GUIDANCE_PLAN,
      category: NotificationCategory.INFO,
      title: 'New Guidance Plan Available',
      message: `${planData.babalawoName || 'Your Babalawo'} has created a ${planData.type} guidance plan for you. Please review and approve it.`,
      data: { planId, ...planData },
      sendEmail: true,
      sendPush: true,
    });
  }

  /**
   * Notify babalawo that guidance plan was approved
   */
  async notifyGuidancePlanApproved(babalawoId: string, planId: string, planData: any) {
    return this.createNotification({
      userId: babalawoId,
      type: NotificationType.GUIDANCE_PLAN,
      category: NotificationCategory.SUCCESS,
      title: 'Guidance Plan Approved',
      message: `${planData.clientName || 'Your client'} has approved the ${planData.type} guidance plan. Payment has been secured in escrow.`,
      data: { planId, status: 'APPROVED', ...planData },
      sendEmail: true,
      sendPush: true,
    });
  }

  /**
   * Notify babalawo that guidance plan was rejected
   */
  async notifyGuidancePlanRejected(babalawoId: string, planId: string, planData: any) {
    return this.createNotification({
      userId: babalawoId,
      type: NotificationType.GUIDANCE_PLAN,
      category: NotificationCategory.WARNING,
      title: 'Guidance Plan Declined',
      message: `${planData.clientName || 'Your client'} has declined the ${planData.type} guidance plan.${planData.reason ? ` Reason: ${planData.reason}` : ''}`,
      data: { planId, status: 'REJECTED', ...planData },
      sendEmail: true,
      sendPush: true,
    });
  }

  /**
   * Notify client that guidance plan work has started
   */
  async notifyGuidancePlanStarted(
    clientId: string,
    guidancePlanId: string,
    data: {
      type: string;
      babalawoName: string;
      clientName: string;
    }
  ) {
    const title = 'Guidance Plan In Progress';
    const message = `${data.babalawoName} has started working on your ${data.type} guidance plan.`;

    await this.createNotification({
      userId: clientId,
      type: NotificationType.GUIDANCE_PLAN,
      category: NotificationCategory.INFO,
      title,
      message,
      data: {
        guidancePlanId,
        babalawoName: data.babalawoName,
        clientName: data.clientName,
        type: data.type,
      },
      sendEmail: true,
      sendPush: true,
    });
  }

  /**
   * Notify client that guidance plan is completed
   */
  async notifyGuidancePlanCompleted(
    clientId: string,
    guidancePlanId: string,
    data: {
      type: string;
      babalawoName: string;
      clientName: string;
    }
  ) {
    const title = 'Guidance Plan Completed';
    const message = `${data.babalawoName} has completed your ${data.type} guidance plan. You can now review and track your items.`;

    await this.createNotification({
      userId: clientId,
      type: NotificationType.GUIDANCE_PLAN,
      category: NotificationCategory.SUCCESS,
      title,
      message,
      data: {
        guidancePlanId,
        babalawoName: data.babalawoName,
        clientName: data.clientName,
        type: data.type,
      },
      sendEmail: true,
      sendPush: true,
    });
  }

  async scheduleFollowUpReminder(
    babalawoId: string,
    appointmentId: string,
    clientName: string,
    delayMs: number = 24 * 60 * 60 * 1000,
  ) {
    const scheduledAt = new Date(Date.now() + delayMs);
    await this.prisma.notification.create({
      data: {
        userId: babalawoId,
        type: NotificationType.APPOINTMENT,
        category: NotificationCategory.INFO,
        title: 'Follow up with your seeker',
        message: `Your session with ${clientName} ended yesterday. Would you like to send them a follow-up message or update their guidance plan?`,
        data: { appointmentId, clientName, action: 'follow_up' },
        scheduledAt,
        emailSent: false,
        pushSent: false,
      },
    });
  }

  /**
   * Schedule a review request notification to be sent to the client
   * after an appointment is completed
   */
  async scheduleReviewRequest(
    clientId: string,
    appointmentId: string,
    babalawoName: string,
    delayMs: number = 24 * 60 * 60 * 1000, // 24 hours default
  ) {
    const scheduledAt = new Date(Date.now() + delayMs);
    await this.prisma.notification.create({
      data: {
        userId: clientId,
        type: NotificationType.REVIEW_REQUEST,
        category: NotificationCategory.INFO,
        title: 'How was your session?',
        message: `How was your session with ${babalawoName}? Share your experience.`,
        data: { 
          appointmentId, 
          babalawoName, 
          action: 'request_review' 
        },
        scheduledAt,
        emailSent: false,
        pushSent: false,
      },
    });
  }
}
