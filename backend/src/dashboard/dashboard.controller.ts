import { Controller, Get, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '@ile-ase/common';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Get client dashboard summary
   * Available to: The client themselves or admins
   */
  @Get('client/:userId/summary')
  async getClientSummary(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    // Users can only view their own dashboard, unless they're admin
    if (currentUser.id !== userId && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Cannot view another user's dashboard");
    }

    return this.dashboardService.getClientSummary(userId);
  }

  /**
   * Get babalawo dashboard summary
   * Available to: The babalawo themselves or admins
   */
  @Get('babalawo/:userId/summary')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BABALAWO, UserRole.ADMIN)
  async getBabalawoSummary(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    // Babalawos can only view their own dashboard, admins can view any
    if (currentUser.id !== userId && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Cannot view another babalawo's dashboard");
    }

    return this.dashboardService.getBabalawoSummary(userId);
  }

  /**
   * Get vendor dashboard summary
   * Available to: The vendor themselves or admins
   */
  @Get('vendor/:userId/summary')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async getVendorSummary(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    // Vendors can only view their own dashboard, admins can view any
    if (currentUser.id !== userId && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Cannot view another vendor's dashboard");
    }

    return this.dashboardService.getVendorSummary(userId);
  }

  /**
   * Get current user's dashboard summary based on their role
   * Convenience endpoint that automatically returns the right dashboard
   */
  @Get('me/summary')
  async getMyDashboard(@CurrentUser() currentUser: CurrentUserPayload) {
    switch (currentUser.role) {
      case 'BABALAWO':
        return this.dashboardService.getBabalawoSummary(currentUser.id);
      case 'VENDOR':
        return this.dashboardService.getVendorSummary(currentUser.id);
      case 'CLIENT':
      default:
        return this.dashboardService.getClientSummary(currentUser.id);
    }
  }
}
