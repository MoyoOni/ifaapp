import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@ile-ase/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserPayload } from '../auth/types/current-user-payload';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EnhancedPractitionerOnboardingService } from './enhanced-practitioner-onboarding.service';
import { CreateVerificationApplicationDto } from './dto/create-verification-application.dto';

@ApiTags('verification')
@Controller('verification/enhanced')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnhancedPractitionerOnboardingController {
  constructor(
    private readonly enhancedOnboardingService: EnhancedPractitionerOnboardingService,
  ) {}

  @Post('application')
  @ApiOperation({ summary: 'Create enhanced verification application with skill assessments' })
  @ApiResponse({ status: 201, description: 'Enhanced verification application created.' })
  @Roles(UserRole.BABALAWO, UserRole.VENDOR)
  async createEnhancedApplication(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() applicationData: CreateVerificationApplicationDto,
  ) {
    return this.enhancedOnboardingService.createEnhancedApplication(
      currentUser.sub,
      applicationData,
    );
  }

  @Post('assessments/:id/submit')
  @ApiOperation({ summary: 'Submit answers for a skill assessment' })
  @ApiResponse({ status: 200, description: 'Assessment answers submitted successfully.' })
  @Roles(UserRole.BABALAWO, UserRole.VENDOR)
  async submitAssessmentAnswers(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Param('id') assessmentId: string,
    @Body() body: { answers: Array<{ questionId: string; selectedOption: string; score: number }> },
  ) {
    return this.enhancedOnboardingService.submitAssessmentAnswers(
      currentUser.sub,
      assessmentId,
      body.answers,
    );
  }

  @Post('quality-metrics')
  @ApiOperation({ summary: 'Record quality monitoring metric for a practitioner' })
  @ApiResponse({ status: 201, description: 'Quality metric recorded successfully.' })
  @Roles(UserRole.ADMIN, UserRole.ELDER)
  async recordQualityMetric(
    @Body() body: {
      userId: string;
      metricType: 'CONSULTATION_FEEDBACK' | 'PEER_REVIEW' | 'ADMIN_REVIEW' | 'COMMUNITY_REPORT';
      value: number;
      reviewerId?: string;
      notes?: string;
    },
  ) {
    return this.enhancedOnboardingService.recordQualityMetric(
      body.userId,
      body.metricType,
      body.value,
      body.reviewerId,
      body.notes,
    );
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get practitioner onboarding progress' })
  @ApiResponse({ status: 200, description: 'Onboarding progress retrieved successfully.' })
  @Roles(UserRole.BABALAWO, UserRole.VENDOR, UserRole.ADMIN)
  async getOnboardingProgress(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.enhancedOnboardingService.getOnboardingProgress(currentUser.sub);
  }

  @Get('quality-history/:userId')
  @ApiOperation({ summary: 'Get practitioner quality monitoring history' })
  @ApiResponse({ status: 200, description: 'Quality monitoring history retrieved successfully.' })
  @Roles(UserRole.ADMIN, UserRole.ELDER)
  async getQualityMonitoringHistory(@Param('userId') userId: string) {
    return this.enhancedOnboardingService.getQualityMonitoringHistory(userId);
  }

  @Get('progress/:userId')
  @ApiOperation({ summary: 'Get specific user onboarding progress (admin only)' })
  @ApiResponse({ status: 200, description: 'User onboarding progress retrieved successfully.' })
  @Roles(UserRole.ADMIN, UserRole.ELDER)
  async getUserOnboardingProgress(@Param('userId') userId: string) {
    return this.enhancedOnboardingService.getOnboardingProgress(userId);
  }
}