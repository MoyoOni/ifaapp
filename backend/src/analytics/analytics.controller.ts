import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService, TrackEventDto } from './analytics.service';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard, AdminRoles } from '../auth/guards/roles.guard';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';
import { AdminSubRole } from '@common/enums/admin-sub-role.enum';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Post('events')
  async trackEvent(@Body() dto: TrackEventDto) {
    await this.analyticsService.trackEvent(dto);
    return { ok: true };
  }

  @Get('onboarding-funnel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SUPER)
  async getOnboardingFunnel(@Query('days') days?: string) {
    return this.analyticsService.getOnboardingFunnel(days ? parseInt(days, 10) : 30);
  }
}
