import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, AdminRoles } from '../auth/guards/roles.guard';
import { Roles } from '@/shared/decorators/roles.decorator';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { CurrentUserPayload } from '@/shared/types/current-user-payload.interface';
import { AdminService } from './admin.service';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { ApproveVerificationDto } from './dto/approve-verification.dto';
import { CreateAdvisoryVoteDto, CastAdvisoryVoteDto } from './dto/advisory-board.dto';
import { CreateCircleDto } from '../circles/dto/create-circle.dto';
import { VerificationStage } from '@common/enums/verification-stage.enum';
import { UserRole } from '@common/enums/user-role.enum';
import { AdminSubRole } from '@common/enums/admin-sub-role.enum';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { VerifyUserDto } from './dto/verify-user.dto';
import { LogPiiRevealDto } from './dto/log-pii-reveal.dto';
import { AdminUserResponseDto } from './dto/admin-user-response.dto';
import { PagedResponseDto } from '@/shared/dto/paged-response.dto';
import { AdminSubRoles } from '@/shared/decorators/admin-sub-roles.decorator';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(AuditInterceptor)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly adminService: AdminService,
  ) {}

  @Get('stats')
  @Roles(UserRole.ADMIN)
  async getPlatformStats(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.adminService.getPlatformStats(currentUser);
  }

  @Get('users')
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SUPPORT, AdminSubRole.SUPER)
  async getAllUsers(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('role') role?: string,
    @Query('verified') verified?: string
  ) {
    return this.adminService.getAllUsers(currentUser, {
      role,
      verified: verified ? verified === 'true' : undefined,
    });
  }

  @Get('verification-applications')
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.COMPLIANCE, AdminSubRole.SUPER)
  async getVerificationApplications(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('stage') stage?: string
  ) {
    return this.adminService.getVerificationApplications(currentUser, stage as VerificationStage);
  }

  @Patch('verification-applications/:id/approve')
  @Roles(UserRole.ADMIN)
  async approveVerification(
    @Param('id') id: string,
    @Body() dto: ApproveVerificationDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.approveVerification(id, dto, currentUser);
  }

  @Post('verification-applications/:id/reject')
  @Roles(UserRole.ADMIN)
  async rejectVerification(
    @Param('id') id: string,
    @Body() dto: ApproveVerificationDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.rejectVerification(id, dto, currentUser);
  }

  /**
   * Get pending withdrawals (requires approval)
   * GET /admin/withdrawals/pending
   */
  @Get('withdrawals/pending')
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.FINANCE, AdminSubRole.SUPER)
  async getPendingWithdrawals(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('threshold') threshold?: number
  ) {
    return this.adminService.getPendingWithdrawals(currentUser, threshold || 500);
  }

  /**
   * Approve or reject withdrawal
   * POST /admin/withdrawals/:id/process
   */
  @Post('withdrawals/:id/process')
  async processWithdrawal(
    @Param('id') withdrawalId: string,
    @Body() body: { approve: boolean; notes?: string },
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.processWithdrawal(
      withdrawalId,
      body.approve,
      body.notes || '',
      currentUser
    );
  }

  /**
   * Get fraud alerts
   * GET /admin/fraud-alerts
   */
  @Get('fraud-alerts')
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.COMPLIANCE, AdminSubRole.SUPER)
  async getFraudAlerts(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.adminService.getFraudAlerts(currentUser);
  }

  /**
   * Get unverified payments (webhook redundancy)
   * GET /admin/payments/unverified
   */
  @Get('payments/unverified')
  @Roles(UserRole.ADMIN)
  async getUnverifiedPayments(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('hours') hours?: number
  ) {
    return this.adminService.getUnverifiedPayments(currentUser, hours || 24);
  }

  /**
   * Manually verify payment (admin only)
   * POST /admin/payments/verify/:transactionId
   */
  @Post('payments/verify/:transactionId')
  @Roles(UserRole.ADMIN)
  async manuallyVerifyPayment(
    @Param('transactionId') transactionId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.manuallyVerifyPayment(transactionId, currentUser);
  }

  /**
   * Log PII reveal action for audit purposes
   * POST /admin/log-pii-reveal
   */
  @Post('log-pii-reveal')
  @HttpCode(HttpStatus.OK)
  async logPiiRevealAction(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body()
    body: {
      entityType: string;
      entityId: string;
      fieldLabel: string;
      reason: string;
    }
  ) {
    await this.adminService.logPiiReveal(
      currentUser.id,
      body.entityType,
      body.entityId,
      body.fieldLabel,
      body.reason,
    );
    return { message: 'PII reveal action logged successfully' };
  }

  /**
   * Get analytics data
   * GET /admin/analytics
   */
  @Get('analytics')
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.FINANCE, AdminSubRole.SUPER)
  async getAnalytics(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('period') period?: string
  ) {
    return this.adminService.getAnalytics(currentUser, period || '30d');
  }

  /**
   * Get pending vendor applications
   * GET /admin/vendors/pending
   */
  @Get('vendors/pending')
  @Roles(UserRole.ADMIN)
  async getPendingVendors(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.adminService.getPendingVendors(currentUser);
  }

  /**
   * Review vendor application
   * POST /admin/vendors/:vendorId/review
   */
  @Post('vendors/:vendorId/review')
  @Roles(UserRole.ADMIN)
  async reviewVendorApplication(
    @Param('vendorId') vendorId: string,
    @Body()
    body: { approved: boolean; culturalAuthenticityNotes?: string; rejectionReason?: string },
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.reviewVendorApplication(vendorId, body, currentUser);
  }

  /**
   * Get reported content
   * GET /admin/reported-content
   */
  @Get('reported-content')
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.MODERATOR, AdminSubRole.SUPER)
  async getReportedContent(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.adminService.getReportedContent(currentUser);
  }

  /**
   * Resolve reported content
   * POST /admin/reported-content/:type/:id/resolve
   */
  @Post('reported-content/:type/:id/resolve')
  @Roles(UserRole.ADMIN)
  async resolveReportedContent(
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() body: { action: 'DISMISS' | 'REMOVE' },
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.resolveReportedContent(type, id, body.action, currentUser);
  }

  // ==================== Circle Management ====================

  @Get('circle-suggestions')
  @Roles(UserRole.ADMIN)
  async getCircleSuggestions(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('status') status?: string
  ) {
    return this.adminService.getCircleSuggestions(currentUser, status);
  }

  @Post('circle-suggestions/:id/approve')
  @Roles(UserRole.ADMIN)
  async approveCircleSuggestion(
    @Param('id') suggestionId: string,
    @Body() circleData: CreateCircleDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.approveCircleSuggestion(suggestionId, circleData, currentUser);
  }

  @Post('circle-suggestions/:id/reject')
  @Roles(UserRole.ADMIN)
  async rejectCircleSuggestion(
    @Param('id') suggestionId: string,
    @Body() body: { reason: string },
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.rejectCircleSuggestion(suggestionId, body.reason, currentUser);
  }

  @Get('circles/pending')
  @Roles(UserRole.ADMIN)
  async getPendingCircles(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.adminService.getPendingCircles(currentUser);
  }

  @Patch('circles/:id/moderate')
  @Roles(UserRole.ADMIN)
  async moderateCircle(
    @Param('id') circleId: string,
    @Body() body: { action: 'ARCHIVE' | 'DELETE' | 'ACTIVATE' },
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.moderateCircle(circleId, body.action, currentUser);
  }

  @Post('circle-events/:id/approve')
  @Roles(UserRole.ADMIN)
  async approveCircleEvent(
    @Param('id') eventId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.approveCircleEvent(eventId, currentUser);
  }

  @Get('audit/stats')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async getAuditStats(@CurrentUser() currentUser: CurrentUserPayload) {
    this.logger.log(`Admin ${currentUser.id} requesting audit statistics`);
    return this.adminService.getAuditStats();
  }

  @Get('audit-logs')
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SUPER)
  async getAuditLogs(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      page: Number(page),
      limit: Number(limit),
      action,
      resourceType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return this.adminService.getAuditLogs(currentUser, filters);
  }

  @Post('impersonate/:targetUserId')
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SUPER)
  async impersonateUser(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Param('targetUserId') targetUserId: string,
    @Body('reason') reason: string,
  ) {
    return this.adminService.impersonateUser(currentUser, targetUserId, reason);
  }

  @Post('manage-admins')
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SUPER)
  async createOrUpdateAdmin(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() body: {
      email: string;
      name: string;
      adminSubRole: string;
      sendInvite?: boolean;
    }
  ) {
    return this.adminService.createOrUpdateAdmin(currentUser, body);
  }

  @Get('admins')
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SUPER)
  async getAdminUsers(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('adminSubRole') adminSubRole?: string,
  ) {
    return this.adminService.getAdminUsers(currentUser, { adminSubRole });
  }

  @Delete('admins/:userId')
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SUPER)
  async removeAdminPrivileges(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Param('userId') userId: string,
  ) {
    return this.adminService.removeAdminPrivileges(currentUser, userId);
  }

  // ADVISORY BOARD VOTING ENDPOINTS
  @Post('advisory-board/votes/:userId')
  @Roles(UserRole.ADMIN, UserRole.ADVISORY_BOARD_MEMBER)
  async createAdvisoryVote(
    @Param('userId') userId: string,
    @Body() createVoteDto: CreateAdvisoryVoteDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.createAdvisoryVote(userId, createVoteDto, currentUser);
  }

  @Get('advisory-board/votes')
  @Roles(UserRole.ADMIN, UserRole.ADVISORY_BOARD_MEMBER)
  async getAdvisoryVotes(
    @Query('userId') userId: string,
    @Query('status') status: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.getAdvisoryVotes(userId, status, currentUser);
  }

  @Post('advisory-board/votes/:voteId/cast')
  @Roles(UserRole.ADMIN, UserRole.ADVISORY_BOARD_MEMBER)
  async castAdvisoryVote(
    @Param('voteId') voteId: string,
    @Body() castVoteDto: CastAdvisoryVoteDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.adminService.castAdvisoryVote(castVoteDto.voteId, castVoteDto.option, currentUser);
  }
}
