import { Module } from '@nestjs/common';
import { AlertingService } from './alerting.service';
import { AlertingController } from './alerting.controller';
import { MetricsModule } from '../metrics/metrics.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MetricsModule,
    NotificationsModule,
  ],
  providers: [AlertingService],
  controllers: [AlertingController],
  exports: [AlertingService],
})
export class AlertingModule {}