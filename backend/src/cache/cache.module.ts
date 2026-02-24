import { Module } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';
import { CacheManagerService } from './cache-manager.service';
import { CacheController } from './cache.controller';

@Module({
  controllers: [CacheController],
  providers: [RedisCacheService, CacheManagerService],
  exports: [RedisCacheService, CacheManagerService],
})
export class CacheModule {}
