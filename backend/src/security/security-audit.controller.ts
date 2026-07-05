import { Controller, Get, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { OwaspSecurityAuditService } from './owasp-security-audit.service';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard, AdminRoles } from '../auth/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';
import { AdminSubRole } from '@common/enums/admin-sub-role.enum';

@Controller('security')
@UseGuards(JwtAuthGuard)
export class SecurityAuditController {
  private readonly logger = new Logger(SecurityAuditController.name);

  constructor(private readonly securityAuditService: OwaspSecurityAuditService) {}

  /**
   * Perform a comprehensive OWASP Top 10 security audit
   */
  @Get('audit/owasp-top-10')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SUPER)
  @HttpCode(HttpStatus.OK)
  async performOWASPSecurityAudit() {
    this.logger.log('Initiating OWASP Top 10 security audit');
    return this.securityAuditService.performSecurityAudit();
  }

  /**
   * Perform additional security checks beyond OWASP Top 10
   */
  @Get('audit/additional')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SUPER)
  @HttpCode(HttpStatus.OK)
  async performAdditionalSecurityChecks() {
    this.logger.log('Initiating additional security checks');
    return this.securityAuditService.performAdditionalSecurityChecks();
  }

  /**
   * Perform a combined security audit
   */
  @Get('audit/full')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SUPER)
  @HttpCode(HttpStatus.OK)
  async performFullSecurityAudit() {
    this.logger.log('Initiating full security audit');

    const owaspResults = await this.securityAuditService.performSecurityAudit();
    const additionalResults = await this.securityAuditService.performAdditionalSecurityChecks();

    return {
      timestamp: new Date().toISOString(),
      owaspTop10: owaspResults,
      additionalChecks: additionalResults,
    };
  }
}
