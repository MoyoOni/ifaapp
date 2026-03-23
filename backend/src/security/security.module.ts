import { Module } from '@nestjs/common';
import { SecurityConfigService } from './security-config.service';
import { SecurityController } from './security.controller';
import { VirusScanService } from './virus-scan.service';

@Module({
  controllers: [SecurityController],
  providers: [SecurityConfigService, VirusScanService],
  exports: [SecurityConfigService, VirusScanService],
})
export class SecurityModule {}
