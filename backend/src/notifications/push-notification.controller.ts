import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PushNotificationService } from './push-notification.service';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class PushNotificationController {
  private readonly logger = new Logger(PushNotificationController.name);

  constructor(private readonly pushNotificationService: PushNotificationService) {}

  /**
   * Subscribe current user to push notifications
   */
  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  async subscribeToNotifications(@CurrentUser() user: User, @Body('token') token: string) {
    this.logger.log(`User ${user.id} subscribing to push notifications`);
    return this.pushNotificationService.subscribeUser(user.id, token);
  }

  /**
   * Unsubscribe current user from push notifications
   */
  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  async unsubscribeFromNotifications(@CurrentUser() user: User, @Body('token') token: string) {
    this.logger.log(`User ${user.id} unsubscribing from push notifications`);
    return this.pushNotificationService.unsubscribeUser(user.id, token);
  }

  /**
   * Send a test notification to the current user
   */
  @Post('send-test')
  @HttpCode(HttpStatus.OK)
  async sendTestNotification(
    @CurrentUser() user: User,
    @Body('title') title: string,
    @Body('body') body: string
  ) {
    this.logger.log(`Sending test notification to user ${user.id}`);
    return this.pushNotificationService.sendNotificationToUser(user.id, title, body);
  }

  /**
   * Send booking reminder notification (only for users themselves or admins)
   */
  @Post('send-booking-reminder/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BABALAWO)
  @HttpCode(HttpStatus.OK)
  async sendBookingReminder(
    @CurrentUser() currentUser: User,
    @Param('userId') userId: string,
    @Body('appointmentId') appointmentId: string,
    @Body('appointmentTitle') appointmentTitle: string,
    @Body('appointmentTime') appointmentTimeString: string
  ) {
    this.logger.log(`Sending booking reminder from ${currentUser.id} to ${userId}`);

    const appointmentTime = new Date(appointmentTimeString);
    return this.pushNotificationService.sendBookingReminderNotification(
      userId,
      appointmentId,
      appointmentTitle,
      appointmentTime
    );
  }

  /**
   * Send message received notification (internal use)
   */
  @Post('send-message-received/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async sendMessageReceived(
    @CurrentUser() currentUser: User,
    @Param('userId') userId: string,
    @Body('senderName') senderName: string,
    @Body('messagePreview') messagePreview: string
  ) {
    this.logger.log(`Sending message received notification from ${currentUser.id} to ${userId}`);
    return this.pushNotificationService.sendMessageReceivedNotification(
      userId,
      senderName,
      messagePreview
    );
  }

  /**
   * Send system notification to multiple users (admin only)
   */
  @Post('send-system-notification')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async sendSystemNotification(
    @CurrentUser() currentUser: User,
    @Body('userIds') userIds: string[],
    @Body('title') title: string,
    @Body('body') body: string
  ) {
    this.logger.log(
      `Sending system notification from ${currentUser.id} to ${userIds.length} users`
    );
    return this.pushNotificationService.sendSystemNotification(userIds, title, body);
  }

  /**
   * Check if user has subscribed to push notifications
   */
  @Get('status')
  @HttpCode(HttpStatus.OK)
  async getNotificationStatus(@CurrentUser() user: User) {
    this.logger.log(`Getting notification status for user ${user.id}`);

    const hasTokens = user.fcmTokens && user.fcmTokens.length > 0;
    return {
      userId: user.id,
      hasSubscribed: hasTokens,
      tokenCount: user.fcmTokens ? user.fcmTokens.length : 0,
    };
  }
}
