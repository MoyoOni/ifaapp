import { Global, Module } from '@nestjs/common';
import { SafeguardingController } from './safeguarding.controller';
import { StandardsService } from './standards.service';
import { SafeguardingCasesService } from './cases.service';
import { RestrictionsService } from './restrictions.service';
import { SafeguardingAlertService } from './safeguarding-alert.service';

// Global: restrictions and case-opening are checked from many modules
// (bookings, the marketplace, the forum, circles, profiles, reports).
@Global()
@Module({
  controllers: [SafeguardingController],
  providers: [StandardsService, SafeguardingCasesService, RestrictionsService, SafeguardingAlertService],
  exports: [StandardsService, SafeguardingCasesService, RestrictionsService],
})
export class SafeguardingModule {}
