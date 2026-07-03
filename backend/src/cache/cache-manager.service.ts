import { Injectable } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';

/**
 * Cache Manager Service
 * Provides high-level caching operations for common use cases
 */
@Injectable()
export class CacheManagerService {
  constructor(private readonly redisCache: RedisCacheService) {}

  /**
   * Cache user profile data
   */
  async cacheUserProfile(
    userId: string,
    profile: any,
    ttlSeconds: number = 3600
  ): Promise<boolean> {
    const key = `user:profile:${userId}`;
    return this.redisCache.set(key, profile, ttlSeconds);
  }

  /**
   * Get cached user profile
   */
  async getUserProfile(userId: string): Promise<any | null> {
    const key = `user:profile:${userId}`;
    return this.redisCache.get(key);
  }

  /**
   * Cache babalawo directory listing
   */
  async cacheBabalawoDirectory(babalawos: any[], ttlSeconds: number = 1800): Promise<boolean> {
    const key = 'directory:babalawos';
    return this.redisCache.set(key, babalawos, ttlSeconds);
  }

  /**
   * Get cached babalawo directory
   */
  async getBabalawoDirectory(): Promise<any[] | null> {
    const key = 'directory:babalawos';
    return this.redisCache.get(key);
  }

  /**
   * Cache marketplace products
   */
  async cacheMarketplaceProducts(
    category: string,
    products: any[],
    ttlSeconds: number = 1800
  ): Promise<boolean> {
    const key = `marketplace:products:${category}`;
    return this.redisCache.set(key, products, ttlSeconds);
  }

  /**
   * Get cached marketplace products
   */
  async getMarketplaceProducts(category: string): Promise<any[] | null> {
    const key = `marketplace:products:${category}`;
    return this.redisCache.get(key);
  }

  /**
   * Cache forum categories
   */
  async cacheForumCategories(categories: any[], ttlSeconds: number = 3600): Promise<boolean> {
    const key = 'forum:categories';
    return this.redisCache.set(key, categories, ttlSeconds);
  }

  /**
   * Get cached forum categories
   */
  async getForumCategories(): Promise<any[] | null> {
    const key = 'forum:categories';
    return this.redisCache.get(key);
  }

  /**
   * Cache recent forum threads
   */
  async cacheRecentThreads(threads: any[], ttlSeconds: number = 900): Promise<boolean> {
    const key = 'forum:recent-threads';
    return this.redisCache.set(key, threads, ttlSeconds);
  }

  /**
   * Get cached recent forum threads
   */
  async getRecentThreads(): Promise<any[] | null> {
    const key = 'forum:recent-threads';
    return this.redisCache.get(key);
  }

  /**
   * Cache academy courses
   */
  async cacheAcademyCourses(courses: any[], ttlSeconds: number = 3600): Promise<boolean> {
    const key = 'academy:courses';
    return this.redisCache.set(key, courses, ttlSeconds);
  }

  /**
   * Get cached academy courses
   */
  async getAcademyCourses(): Promise<any[] | null> {
    const key = 'academy:courses';
    return this.redisCache.get(key);
  }

  /**
   * Cache temple directory
   */
  async cacheTempleDirectory(temples: any[], ttlSeconds: number = 3600): Promise<boolean> {
    const key = 'temples:directory';
    return this.redisCache.set(key, temples, ttlSeconds);
  }

  /**
   * Get cached temple directory
   */
  async getTempleDirectory(): Promise<any[] | null> {
    const key = 'temples:directory';
    return this.redisCache.get(key);
  }

  /**
   * Cache user statistics
   */
  async cacheUserStats(userId: string, stats: any, ttlSeconds: number = 300): Promise<boolean> {
    const key = `user:stats:${userId}`;
    return this.redisCache.set(key, stats, ttlSeconds);
  }

  /**
   * Get cached user statistics
   */
  async getUserStats(userId: string): Promise<any | null> {
    const key = `user:stats:${userId}`;
    return this.redisCache.get(key);
  }

  /**
   * Cache dashboard data
   */
  async cacheDashboardData(
    userId: string,
    dashboardData: any,
    ttlSeconds: number = 600
  ): Promise<boolean> {
    const key = `dashboard:${userId}`;
    return this.redisCache.set(key, dashboardData, ttlSeconds);
  }

  /**
   * Get cached dashboard data
   */
  async getDashboardData(userId: string): Promise<any | null> {
    const key = `dashboard:${userId}`;
    return this.redisCache.get(key);
  }

  /**
   * Invalidate user-related cache
   */
  async invalidateUserCache(userId: string): Promise<void> {
    const patterns = [`user:profile:${userId}`, `user:stats:${userId}`, `dashboard:${userId}`];

    for (const pattern of patterns) {
      await this.redisCache.del(pattern);
    }
  }

  /**
   * Invalidate directory caches
   */
  async invalidateDirectoryCaches(): Promise<void> {
    const patterns = [
      'directory:babalawos',
      'marketplace:products:*',
      'temples:directory',
      'academy:courses',
    ];

    for (const pattern of patterns) {
      await this.redisCache.del(pattern);
    }
  }

  /**
   * Invalidate forum caches
   */
  async invalidateForumCaches(): Promise<void> {
    const patterns = ['forum:categories', 'forum:recent-threads'];

    for (const pattern of patterns) {
      await this.redisCache.del(pattern);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return this.redisCache.getStats();
  }

  /**
   * Check if cache is available
   */
  isCacheAvailable(): boolean {
    return this.redisCache.isAvailable();
  }
}
