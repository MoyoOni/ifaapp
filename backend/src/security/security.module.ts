import { Module } from '@nestjs/common';
import { SecurityConfigService } from './security-config.service';
import { SecurityHardeningService } from './security-hardening.service';
import { SecurityController } from './security.controller';
import { FileUploadSecurityService } from './file-upload-security.service';
import { OwaspSecurityAuditService } from './owasp-security-audit.service';
import { SecurityAuditController } from './security-audit.controller';
import { VirusScanService } from './virus-scan.service';

@Module({
  controllers: [SecurityController, SecurityAuditController],
  providers: [
    SecurityConfigService,
    SecurityHardeningService,
    FileUploadSecurityService,
    OwaspSecurityAuditService,
    // DocumentsService has always injected VirusScanService for uploaded-file
    // scanning, but this module never actually provided/exported it — the
    // same never-wired-provider pattern found elsewhere this session.
    VirusScanService,
  ],
  exports: [
    SecurityConfigService,
    SecurityHardeningService,
    FileUploadSecurityService,
    OwaspSecurityAuditService,
    VirusScanService,
  ],
})
export class SecurityModule {}