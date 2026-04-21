import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@ile-ase/common';
import { CachingStrategyService } from './caching-strategy.service';

@ApiTags('performance')
@Controller('performance/caching-strategy')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CachingStrategyController {
  constructor(private readonly cachingStrategyService: CachingStrategyService) {}

  @Post('apply-strategies')
  @ApiOperation({ summary: 'Apply caching strategies' })
  @ApiResponse({ status: 200, description: 'Caching strategies applied successfully.' })
  @Roles(UserRole.ADMIN)
  async applyCachingStrategies() {
    await this.cachingStrategyService.applyCachingStrategies();
    return { message: 'Caching strategies applied successfully' };
  }

  @Get('cache-stats')
  @ApiOperation({ summary: 'Get cache statistics' })
  @ApiResponse({ status: 200, description: 'Cache statistics retrieved successfully.' })
  @Roles(UserRole.ADMIN)
  async getCacheStats() {
    return this.cachingStrategyService.getCacheStats();
  }

  @Get('cache-hit-rate')
  @ApiOperation({ summary: 'Get cache hit rate' })
  @ApiResponse({ status: 200, description: 'Cache hit rate retrieved successfully.' })
  @Roles(UserRole.ADMIN)
  async getCacheHitRate() {
    return { hitRate: await this.cachingStrategyService.getCacheHitRate() };
  }

  @Post('invalidate/:key')
  @ApiOperation({ summary: 'Invalidate a specific cache key' })
  @ApiResponse({ status: 200, description: 'Cache invalidated successfully.' })
  @Roles(UserRole.ADMIN)
  async invalidateCache(@Param('key') key: string) {
    const result = await this.cachingStrategyService.invalidateCache(key);
    return { message: `Cache invalidated for key: ${key}`, success: result };
  }

  @Get('forum-categories')
  @ApiOperation({ summary: 'Get cached forum categories' })
  @ApiResponse({ status: 200, description: 'Cached forum categories retrieved successfully.' })
  @Roles(UserRole.ADMIN)
  async getCachedForumCategories() {
    return this.cachingStrategyService.getCachedForumCategories();
  }

  @Get('popular-products')
  @ApiOperation({ summary: 'Get cached popular products' })
  @ApiResponse({ status: 200, description: 'Cached popular products retrieved successfully.' })
  @Roles(UserRole.ADMIN)
  async getCachedPopularProducts() {
    return this.cachingStrategyService.getCachedPopularProducts();
  }

  @Get('featured-practitioners')
  @ApiOperation({ summary: 'Get cached featured practitioners' })
  @ApiResponse({ status: 200, description: 'Cached featured practitioners retrieved successfully.' })
  @Roles(UserRole.ADMIN)
  async getCachedFeaturedPractitioners() {
    return this.cachingStrategyService.getCachedFeaturedPractitioners();
  }

  @Get('temple-directory')
  @ApiOperation({ summary: 'Get cached temple directory' })
  @ApiResponse({ status: 200, description: 'Cached temple directory retrieved successfully.' })
  @Roles(UserRole.ADMIN)
  async getCachedTempleDirectory() {
    return this.cachingStrategyService.getCachedTempleDirectory();
  }
}