import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { IsBoolean, IsOptional } from 'class-validator';
import { NotificationPreferencesService } from './notification-preferences.service';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

// A class, not an interface: the global ValidationPipe only validates and
// whitelists classes. As an interface any field went straight into the
// Prisma write -- including `userId`, which on first save created the row
// for whichever member the body named (November 2, 2026).
export class UpdateNotificationPreferencesDto {
  @IsOptional() @IsBoolean() emailBooking?: boolean;
  @IsOptional() @IsBoolean() emailReminder?: boolean;
  @IsOptional() @IsBoolean() emailDigest?: boolean;
  @IsOptional() @IsBoolean() emailPlan?: boolean;
  @IsOptional() @IsBoolean() emailMessages?: boolean;
  @IsOptional() @IsBoolean() emailMarketing?: boolean;
  @IsOptional() @IsBoolean() pushReminder?: boolean;
  @IsOptional() @IsBoolean() pushMessages?: boolean;
  @IsOptional() @IsBoolean() pushFollowup?: boolean;
  @IsOptional() @IsBoolean() pushForum?: boolean;
  @IsOptional() @IsBoolean() pushCircles?: boolean;
  // VENDOR_BACKLOG.md VND-004
  @IsOptional() @IsBoolean() emailOrder?: boolean;
  @IsOptional() @IsBoolean() pushOrder?: boolean;
  @IsOptional() @IsBoolean() emailReviewReceived?: boolean;
  @IsOptional() @IsBoolean() pushReviewReceived?: boolean;
  @IsOptional() @IsBoolean() emailLowStock?: boolean;
  @IsOptional() @IsBoolean() pushLowStock?: boolean;
}

// Registered in NotificationsModule November 2, 2026 -- it never was, so
// GET/PATCH /notifications/preferences 404'd and no one could change a
// notification preference (the vendor dashboard's settings included).
@Controller('notifications/preferences')
@UseGuards(JwtAuthGuard)
export class NotificationPreferencesController {
  constructor(
    private notificationPreferencesService: NotificationPreferencesService,
    private whatsAppService: WhatsAppService
  ) {}

  @Get()
  async get(@CurrentUser() user: CurrentUserPayload) {
    return this.notificationPreferencesService.getPreferences(user.id);
  }

  /** Which optional channels the platform can actually deliver on, so the UI never offers one that isn't set up. */
  @Get('channels')
  channels() {
    return { whatsapp: this.whatsAppService.isEnabled };
  }

  @Patch()
  async update(@CurrentUser() user: CurrentUserPayload, @Body() data: UpdateNotificationPreferencesDto) {
    return this.notificationPreferencesService.updatePreferences(user.id, data);
  }
}
