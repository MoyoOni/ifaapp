import { Module } from '@nestjs/common';
import { DataPrivacyComplianceService } from './data-privacy-compliance.service';
import { DataPrivacyComplianceController } from './data-privacy-compliance.controller';

@Module({
  controllers: [DataPrivacyComplianceController],
  providers: [DataPrivacyComplianceService],
  exports: [DataPrivacyComplianceService],
})
export class ComplianceModule {}