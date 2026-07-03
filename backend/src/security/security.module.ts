import { Module } from '@nestjs/common';
import { SecurityConfigService } from './security-config.service';
import { SecurityHardeningService } from './security-hardening.service';
import { SecurityController } from './security.controller';
import { FileUploadSecurityService } from './file-upload-security.service';
import { OwaspSecurityAuditService } from './owasp-security-audit.service';
import { SecurityAuditController } from './security-audit.controller';

@Module({
  controllers: [SecurityController, SecurityAuditController],
  providers: [
    SecurityConfigService, 
    SecurityHardeningService, 
    FileUploadSecurityService,
    OwaspSecurityAuditService
  ],
  exports: [
    SecurityConfigService, 
    SecurityHardeningService, 
    FileUploadSecurityService,
    OwaspSecurityAuditService
  ],
})
export class SecurityModule {}