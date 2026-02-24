import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from './notification.service';
import { PushNotificationService } from './push-notification.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly pushService: PushNotificationService
  ) {}

  /**
   * Get user notifications
   * GET /notifications?unreadOnly=true&filter=messages&take=50
   */
  @Get()
  async getNotifications(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('filter') filter?: string,
    @Query('take') take?: string
  ) {
    const takeNum = take ? parseInt(take, 10) : 50;
    return this.notificationService.getUserNotifications(
      currentUser.id,
      unreadOnly === 'true',
      filter,
      takeNum > 0 && takeNum <= 100 ? takeNum : 50
    );
  }

  /**
   * Get unread notification count
   * GET /notifications/unread-count
   */
  @Get('unread-count')
  async getUnreadCount(@CurrentUser() currentUser: CurrentUserPayload) {
    const count = await this.notificationService.getUnreadCount(currentUser.id);
    return { count };
  }

  /**
   * Get notification counts grouped by type
   * GET /notifications/count-by-type
   */
  @Get('count-by-type')
  async getCountByType(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.notificationService.getCountByType(currentUser.id);
  }

  /**
   * Mark notification as read
   * PATCH /notifications/:id/read
   */
  @Patch(':id/read')
  async markAsRead(
    @Param('id') notificationId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.notificationService.markAsRead(notificationId, currentUser.id);
  }

  /**
   * Mark all notifications as read
   * PATCH /notifications/read-all
   */
  @Patch('read-all')
  async markAllAsRead(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.notificationService.markAllAsRead(currentUser.id);
  }

  /**
   * Delete notification
   * DELETE /notifications/:id
   */
  @Delete(':id')
  async deleteNotification(
    @Param('id') notificationId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.notificationService.deleteNotification(notificationId, currentUser.id);
  }

  /**
   * Register device token for push notifications
   * POST /notifications/device-tokens
   */
  @Post('device-tokens')
  async registerDeviceToken(
    @Body() dto: RegisterDeviceTokenDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    await this.pushService.registerDeviceToken({
      userId: currentUser.id,
      token: dto.token,
      platform: dto.platform,
      deviceInfo: dto.deviceInfo,
    });

    return { message: 'Device token registered successfully' };
  }

  /**
   * Remove device token
   * DELETE /notifications/device-tokens/:token
   */
  @Delete('device-tokens/:token')
  async removeDeviceToken(
    @Param('token') token: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    // Verify token belongs to user (optional security check)
    await this.pushService.removeDeviceToken(token);
    return { message: 'Device token removed successfully' };
  }

  /**
   * Get user's active devices
   * GET /notifications/devices
   */
  @Get('devices')
  async getUserDevices(@CurrentUser() currentUser: CurrentUserPayload) {
    const devices = await this.pushService.getUserDevices(currentUser.id);
    const count = await this.pushService.getUserDeviceCount(currentUser.id);

    return { devices, count };
  }
}
