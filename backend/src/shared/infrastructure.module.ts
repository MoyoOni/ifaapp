import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Cache & Storage
import { RedisService } from './services/redis.service';

// Queue Management
import { QueueService } from './services/queue.service';

// Search & Analytics
import { OpenSearchService } from './services/opensearch.service';

// Content Delivery
import { CdnService } from './services/cdn.service';

// Feature Management
import { FeatureFlagService } from './services/feature-flag.service';

// Data Synchronization
import { CdcSyncService } from './services/cdc-sync.service';

@Global()
@Module({
  imports: [
    ConfigModule,
  ],
  providers: [
    // Infrastructure Services
    RedisService,
    QueueService,
    OpenSearchService,
    CdnService,
    FeatureFlagService,
    CdcSyncService,
  ],
  exports: [
    // Export all infrastructure services
    RedisService,
    QueueService,
    OpenSearchService,
    CdnService,
    FeatureFlagService,
    CdcSyncService,
  ],
})
export class InfrastructureModule {}