import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { LegalPolicyService, PolicyType } from './legal-policy.service';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';

@Controller('legal')
@UseGuards(JwtAuthGuard)
export class LegalPolicyController {
  constructor(private readonly legalPolicyService: LegalPolicyService) {}

  /**
   * Get the current version of a specific policy
   */
  @Get('policies/:policyType')
  async getCurrentPolicy(@Param('policyType') policyType: PolicyType) {
    return this.legalPolicyService.getCurrentPolicy(policyType);
  }

  /**
   * Get all versions of a specific policy (admin only)
   */
  @Get('policies/:policyType/history')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllPolicyVersions(
    @Param('policyType') policyType: PolicyType,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.legalPolicyService.getAllPolicyVersions(policyType);
  }

  /**
   * Get user's acceptance status for a specific policy
   */
  @Get('policies/:policyType/acceptance')
  async getUserPolicyAcceptance(
    @Param('policyType') policyType: PolicyType,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.legalPolicyService.getUserPolicyAcceptance(currentUser.id, policyType);
  }

  /**
   * Accept a specific policy
   */
  @Post('policies/:policyType/accept')
  async acceptPolicy(
    @Param('policyType') policyType: PolicyType,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.legalPolicyService.acceptPolicy(currentUser.id, policyType, true);
  }

  /**
   * Admin: Create a new policy version
   */
  @Post('policies/:policyType')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createPolicyVersion(
    @Param('policyType') policyType: PolicyType,
    @Body('title') title: string,
    @Body('content') content: string,
    @Body('effectiveDate') effectiveDateStr?: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    if (!title || !content) {
      throw new BadRequestException('Title and content are required');
    }

    const effectiveDate = effectiveDateStr ? new Date(effectiveDateStr) : new Date();
    return this.legalPolicyService.createPolicyVersion(
      policyType,
      title,
      content,
      effectiveDate,
      currentUser
    );
  }

  /**
   * Get all policy acceptances for current user
   */
  @Get('my-acceptances')
  async getMyPolicyAcceptances(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.legalPolicyService.getUserPolicyAcceptances(currentUser.id);
  }

  /**
   * Admin: Get all policy acceptances for a user
   */
  @Get('users/:userId/acceptances')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getUserPolicyAcceptances(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.legalPolicyService.getUserPolicyAcceptances(userId);
  }

  /**
   * Admin: Get compliance summary
   */
  @Get('admin/compliance-summary')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getComplianceSummary(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.legalPolicyService.getComplianceSummary();
  }
}