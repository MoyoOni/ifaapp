import { Controller, Get, Delete, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '@ile-ase/common';
import { CacheManagerService } from './cache-manager.service';

@ApiTags('cache')
@Controller('cache')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CacheController {
  constructor(private readonly cacheManager: CacheManagerService) {}

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get cache statistics and performance metrics' })
  @ApiResponse({
    status: 200,
    description: 'Cache statistics',
    schema: {
      type: 'object',
      properties: {
        connected: { type: 'boolean' },
        uptime: { type: 'number' },
        connectedClients: { type: 'number' },
        usedMemory: { type: 'number' },
        hits: { type: 'number' },
        misses: { type: 'number' },
        hitRate: { type: 'number' },
      },
    },
  })
  async getCacheStats() {
    return this.cacheManager.getCacheStats();
  }

  @Get('status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get cache availability status' })
  @ApiResponse({
    status: 200,
    description: 'Cache availability',
    schema: {
      type: 'object',
      properties: {
        available: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async getCacheStatus() {
    const available = this.cacheManager.isCacheAvailable();
    return {
      available,
      message: available
        ? 'Cache is available and functioning'
        : 'Cache is not available - falling back to database queries',
    };
  }

  @Delete('invalidate/user/:userId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Invalidate all cache entries for a specific user' })
  @ApiResponse({
    status: 200,
    description: 'User cache invalidated',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async invalidateUserCache(@Query('userId') userId: string) {
    await this.cacheManager.invalidateUserCache(userId);
    return {
      success: true,
      message: `Cache invalidated for user ${userId}`,
    };
  }

  @Delete('invalidate/directories')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Invalidate all directory-related cache entries' })
  @ApiResponse({
    status: 200,
    description: 'Directory caches invalidated',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async invalidateDirectoryCaches() {
    await this.cacheManager.invalidateDirectoryCaches();
    return {
      success: true,
      message: 'All directory caches invalidated',
    };
  }

  @Delete('invalidate/forum')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Invalidate all forum-related cache entries' })
  @ApiResponse({
    status: 200,
    description: 'Forum caches invalidated',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async invalidateForumCaches() {
    await this.cacheManager.invalidateForumCaches();
    return {
      success: true,
      message: 'All forum caches invalidated',
    };
  }

  @Delete('flush')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Flush all cache entries (USE WITH CAUTION)' })
  @ApiResponse({
    status: 200,
    description: 'All cache flushed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async flushAllCache() {
    // This would need to be implemented in the RedisCacheService
    return {
      success: false,
      message: 'Not implemented - would require RedisCacheService.flushAll()',
    };
  }
}
