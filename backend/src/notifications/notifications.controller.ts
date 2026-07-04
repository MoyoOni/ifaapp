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
import { PushNotificationService } from './push/push-notification.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { DeregisterDeviceTokenDto } from './dto/deregister-device-token.dto';
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
    return this.notificationService.getUnreadCount(currentUser.id);
  }

  /**
   * Mark notification as read
   * PATCH /notifications/:id/read
   */
  @Patch(':id/read')
  async markAsRead(@CurrentUser() currentUser: CurrentUserPayload, @Param('id') id: string) {
    return this.notificationService.markAsRead(id, currentUser.id);
  }

  /**
   * Mark all notifications as read
   * PATCH /notifications/mark-all-read
   */
  @Patch('mark-all-read')
  async markAllAsRead(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.notificationService.markAllAsRead(currentUser.id);
  }

  /**
   * Register device token for push notifications
   * POST /notifications/register-device-token
   */
  @Post('register-device-token')
  async registerDeviceToken(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() body: RegisterDeviceTokenDto
  ) {
    return this.pushService.registerDeviceToken(
      currentUser.id,
      body.token,
      body.deviceType,
      body.platform
    );
  }

  /**
   * Deregister device token (on logout)
   * POST /notifications/deregister-device-token
   */
  @Post('deregister-device-token')
  async deregisterDeviceToken(@Body() body: DeregisterDeviceTokenDto) {
    return this.pushService.deregisterDeviceToken(body.token);
  }

  /**
   * Delete notification
   * DELETE /notifications/:id
   */
  @Delete(':id')
  async deleteNotification(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Param('id') id: string
  ) {
    return this.notificationService.deleteNotification(id, currentUser.id);
  }
}
