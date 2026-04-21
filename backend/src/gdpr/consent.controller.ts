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
import { ConsentService, ConsentType } from './consent.service';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';

@Controller('consent')
@UseGuards(JwtAuthGuard)
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  /**
   * Update user consent for a specific type
   */
  @Post(':consentType/:granted')
  async updateConsent(
    @Param('consentType') consentType: ConsentType,
    @Param('granted') granted: string,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body('source') source?: string,
  ) {
    const isGranted = granted.toLowerCase() === 'true';
    return this.consentService.updateConsent(
      currentUser.id,
      consentType,
      isGranted,
      source || 'web'
    );
  }

  /**
   * Check if user has granted specific consent
   */
  @Get(':consentType/check')
  async checkConsent(
    @Param('consentType') consentType: ConsentType,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return { 
      hasConsent: await this.consentService.hasConsent(currentUser.id, consentType) 
    };
  }

  /**
   * Get all consents for current user
   */
  @Get('my-consents')
  async getMyConsents(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.consentService.getUserConsents(currentUser.id);
  }

  /**
   * Admin: Get all consents for a user
   */
  @Get('users/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getUserConsents(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.consentService.getUserConsents(userId);
  }

  /**
   * Admin: Get consent summary for compliance reporting
   */
  @Get('admin/summary')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getConsentSummary(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.consentService.getConsentSummary();
  }

  /**
   * Admin: Expire old consents (manual trigger)
   */
  @Post('admin/expire')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async expireConsents(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.consentService.expireConsents();
  }
}