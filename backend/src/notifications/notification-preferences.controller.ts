import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { NotificationPreferencesService } from './notification-preferences.service';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface UpdateNotificationPreferencesDto {
  emailBooking?: boolean;
  emailReminder?: boolean;
  emailDigest?: boolean;
  emailPlan?: boolean;
  emailMessages?: boolean;
  emailMarketing?: boolean;
  pushReminder?: boolean;
  pushMessages?: boolean;
  pushFollowup?: boolean;
  pushForum?: boolean;
  pushCircles?: boolean;
}

@Controller('notifications/preferences')
@UseGuards(JwtAuthGuard)
export class NotificationPreferencesController {
  constructor(private notificationPreferencesService: NotificationPreferencesService) {}

  @Get()
  async get(@CurrentUser() user: any) {
    return this.notificationPreferencesService.getPreferences(user.sub);
  }

  @Patch()
  async update(@CurrentUser() user: any, @Body() data: UpdateNotificationPreferencesDto) {
    return this.notificationPreferencesService.updatePreferences(user.sub, data);
  }
}
