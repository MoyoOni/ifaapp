import { Injectable, Logger, CacheManager } from '@nestjs/common';
import { InjectCache } from '@nestjs/cache-manager';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CachingStrategyService {
  private readonly logger = new Logger(CachingStrategyService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectCache() private cacheManager: CacheManager,
  ) {}

  /**
   * Applies caching strategies to frequently accessed data
   */
  async applyCachingStrategies(): Promise<void> {
    this.logger.log('Applying caching strategies');

    // Pre-warm commonly accessed caches
    await this.preWarmCommonCaches();

    this.logger.log('Caching strategies applied successfully');
  }

  /**
   * Pre-warms common caches with frequently accessed data
   */
  private async preWarmCommonCaches(): Promise<void> {
    this.logger.log('Pre-warming common caches');

    // Cache public forum categories
    await this.cachePublicForumCategories();

    // Cache popular products
    await this.cachePopularProducts();

    // Cache featured practitioners
    await this.cacheFeaturedPractitioners();

    // Cache public temple directory
    await this.cacheTempleDirectory();

    this.logger.log('Common caches pre-warmed');
  }

  /**
   * Caches public forum categories
   */
  async cachePublicForumCategories(): Promise<void> {
    try {
      const categories = await this.prisma.forumCategory.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      });

      await this.cacheManager.set('forum_categories', categories, 3600000); // 1 hour
      this.logger.log(`Cached ${categories.length} forum categories`);
    } catch (error) {
      this.logger.error(`Failed to cache forum categories: ${error.message}`);
    }
  }

  /**
   * Caches popular products
   */
  async cachePopularProducts(): Promise<void> {
    try {
      const popularProducts = await this.prisma.product.findMany({
        where: { 
          status: 'ACTIVE',
          isFeatured: true,
        },
        include: {
          vendor: true,
        },
        take: 20,
        orderBy: [
          { isFeatured: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      await this.cacheManager.set('popular_products', popularProducts, 1800000); // 30 minutes
      this.logger.log(`Cached ${popularProducts.length} popular products`);
    } catch (error) {
      this.logger.error(`Failed to cache popular products: ${error.message}`);
    }
  }

  /**
   * Caches featured practitioners
   */
  async cacheFeaturedPractitioners(): Promise<void> {
    try {
      const featuredPractitioners = await this.prisma.user.findMany({
        where: { 
          role: 'BABALAWO',
          isFeatured: true,
          verified: true,
        },
        select: {
          id: true,
          name: true,
          yorubaName: true,
          bio: true,
          averageRating: true,
          avatar: true,
          specialization: true,
        },
        take: 20,
        orderBy: { featuredOrder: 'asc' },
      });

      await this.cacheManager.set('featured_practitioners', featuredPractitioners, 3600000); // 1 hour
      this.logger.log(`Cached ${featuredPractitioners.length} featured practitioners`);
    } catch (error) {
      this.logger.error(`Failed to cache featured practitioners: ${error.message}`);
    }
  }

  /**
   * Caches temple directory
   */
  async cacheTempleDirectory(): Promise<void> {
    try {
      const temples = await this.prisma.temple.findMany({
        where: { isActive: true },
        include: {
          followers: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
            take: 5,
          },
          founder: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        take: 50,
      });

      await this.cacheManager.set('temple_directory', temples, 7200000); // 2 hours
      this.logger.log(`Cached ${temples.length} temples`);
    } catch (error) {
      this.logger.error(`Failed to cache temple directory: ${error.message}`);
    }
  }

  /**
   * Gets cached forum categories
   */
  async getCachedForumCategories() {
    return this.cacheManager.get('forum_categories');
  }

  /**
   * Gets cached popular products
   */
  async getCachedPopularProducts() {
    return this.cacheManager.get('popular_products');
  }

  /**
   * Gets cached featured practitioners
   */
  async getCachedFeaturedPractitioners() {
    return this.cacheManager.get('featured_practitioners');
  }

  /**
   * Gets cached temple directory
   */
  async getCachedTempleDirectory() {
    return this.cacheManager.get('temple_directory');
  }

  /**
   * Manually invalidate a cache key
   */
  async invalidateCache(key: string): Promise<boolean> {
    try {
      await this.cacheManager.del(key);
      this.logger.log(`Cache invalidated for key: ${key}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to invalidate cache for key ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    // Note: This is a simplified implementation
    // A full implementation would depend on the specific cache store used
    return {
      store: 'memory', // Default NestJS cache manager uses memory store
      hits: 'Not tracked by default implementation',
      misses: 'Not tracked by default implementation',
      keys: await this.getCacheKeys(),
      size: 'Not available in default implementation',
    };
  }

  /**
   * Get all cache keys (in a real implementation this would depend on the cache store)
   */
  async getCacheKeys(): Promise<string[]> {
    // The default memory cache store doesn't expose keys directly
    // This is a limitation of the default implementation
    return [
      'forum_categories',
      'popular_products', 
      'featured_practitioners',
      'temple_directory'
    ];
  }

  /**
   * Calculates cache hit rate (placeholder implementation)
   */
  async getCacheHitRate(): Promise<number> {
    // Placeholder implementation
    // A real implementation would require tracking cache access
    return 0.75; // Assuming 75% hit rate
  }
}