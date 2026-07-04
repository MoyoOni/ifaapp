import { Controller, Get, UseGuards, ForbiddenException } from '@nestjs/common';
import { PractitionerAnalyticsService } from './practitioner-analytics.service';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@ile-ase/common';

@Controller('practitioners/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BABALAWO)
export class PractitionerAnalyticsController {
  constructor(private readonly analyticsService: PractitionerAnalyticsService) {}

  @Get()
  async getAnalytics(@CurrentUser() user: CurrentUserPayload) {
    return this.analyticsService.getAnalytics(user.sub);
  }
}
