import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [
    TerminusModule,
    HttpModule,
    MetricsModule,
  ],
  controllers: [HealthController],
})
export class HealthModule {}
