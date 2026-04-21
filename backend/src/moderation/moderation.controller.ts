import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { ReportViolationDto } from '../forum/dto/report-violation.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';

@Controller('moderation')
@UseGuards(JwtAuthGuard)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  /**
   * Create a new content report
   */
  @Post('report/:targetType/:targetId')
  async createReport(
    @Param('targetId') targetId: string,
    @Param('targetType') targetType: 'post' | 'comment' | 'product' | 'profile' | 'thread' | 'user',
    @Body() dto: ReportViolationDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.moderationService.createReport(targetId, targetType, dto, currentUser);
  }

  /**
   * Get reports for moderators to review
   */
  @Get('reports')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async getReports(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
  ) {
    return this.moderationService.getReports(currentUser, status, category, priority);
  }

  /**
   * Review a report and take action
   */
  @Patch('reports/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @HttpCode(HttpStatus.OK)
  async reviewReport(
    @Param('id') id: string,
    @Body('action') action: 'approve' | 'dismiss' | 'escalate',
    @Body('notes') notes?: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.moderationService.reviewReport(id, action, currentUser, notes);
  }

  /**
   * Get moderation stats for admins
   */
  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getModerationStats(@CurrentUser() currentUser: CurrentUserPayload) {
    // This would be implemented in the service
    // For now, returning a placeholder
    return {
      totalReports: 0,
      pendingReports: 0,
      resolvedReports: 0,
      dismissedReports: 0,
      escalatedReports: 0,
      averageResolutionTime: 0,
      activeModerators: 0,
    };
  }
}