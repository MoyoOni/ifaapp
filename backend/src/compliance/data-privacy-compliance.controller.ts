import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Delete,
} from '@nestjs/common';
import { DataPrivacyComplianceService } from './data-privacy-compliance.service';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('compliance')
@UseGuards(JwtAuthGuard)
export class DataPrivacyComplianceController {
  private readonly logger = new Logger(DataPrivacyComplianceController.name);

  constructor(private readonly complianceService: DataPrivacyComplianceService) {}

  /**
   * Request right to erasure for a user
   */
  @Delete('privacy/right-to-erasure/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async requestRightToErasure(@Param('userId') userId: string) {
    this.logger.log(`Admin requesting right to erasure for user ${userId}`);
    return this.complianceService.rightToErasure(userId);
  }

  /**
   * Self-service request for right to erasure
   */
  @Delete('privacy/right-to-erasure/self')
  @HttpCode(HttpStatus.OK)
  async selfRequestRightToErasure(@CurrentUser() user: User) {
    this.logger.log(`User ${user.id} requesting right to erasure for themselves`);
    return this.complianceService.rightToErasure(user.id);
  }

  /**
   * Request data portability export
   */
  @Get('privacy/data-portability/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async requestDataPortability(@Param('userId') userId: string) {
    this.logger.log(`Admin requesting data portability for user ${userId}`);
    return this.complianceService.rightToDataPortability(userId);
  }

  /**
   * Self-service request for data portability
   */
  @Get('privacy/data-portability/self')
  @HttpCode(HttpStatus.OK)
  async selfRequestDataPortability(@CurrentUser() user: User) {
    this.logger.log(`User ${user.id} requesting data portability for themselves`);
    return this.complianceService.rightToDataPortability(user.id);
  }

  /**
   * Manage user consent
   */
  @Post('privacy/consent/:consentType')
  @HttpCode(HttpStatus.OK)
  async manageConsent(
    @CurrentUser() user: User,
    @Param('consentType') consentType: string,
    @Body('granted') granted: boolean
  ) {
    this.logger.log(`User ${user.id} managing consent for ${consentType}, granted: ${granted}`);
    return this.complianceService.manageUserConsent(user.id, consentType, granted);
  }

  /**
   * Check user consent status
   */
  @Get('privacy/consent/:consentType')
  @HttpCode(HttpStatus.OK)
  async checkConsent(
    @CurrentUser() user: User,
    @Param('consentType') consentType: string
  ) {
    this.logger.log(`User ${user.id} checking consent status for ${consentType}`);
    const hasConsent = await this.complianceService.checkUserConsent(user.id, consentType);
    return { consentType, granted: hasConsent };
  }

  /**
   * Generate privacy compliance report
   */
  @Get('privacy/compliance-report')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async generatePrivacyComplianceReport() {
    this.logger.log('Admin generating privacy compliance report');
    return this.complianceService.generatePrivacyComplianceReport();
  }
}