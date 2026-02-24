# Redis Caching Implementation Guide

## Overview
This guide covers the Redis caching implementation for the Ìlú Àṣẹ platform, designed to improve performance for frequently accessed data.

## Current Implementation

### Core Components
1. **RedisCacheService** - Low-level Redis client wrapper
2. **CacheManagerService** - High-level caching operations
3. **CacheController** - API endpoints for cache monitoring
4. **Cache Decorators** - Decorators for automatic caching (planned)

### Cached Data Types
- User profiles (1 hour TTL)
- Babalawo directory listings (30 minutes TTL)
- Marketplace products by category (30 minutes TTL)
- Forum categories and recent threads (15-60 minutes TTL)
- Academy courses (1 hour TTL)
- Temple directory (1 hour TTL)
- User statistics and dashboard data (5-10 minutes TTL)

## Installation and Setup

### 1. Install Redis Dependencies
```bash
npm install redis
# Types are included with the redis package
```

### 2. Environment Configuration
Add to `.env`:
```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
# For production with authentication:
# REDIS_URL=redis://:password@host:port
```

### 3. Docker Redis (Development)
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

## Cache Service Usage

### Basic Operations
```typescript
// In your service constructor
constructor(
  private prisma: PrismaService,
  private cacheManager: CacheManagerService
) {}

// Cache user profile
await this.cacheManager.cacheUserProfile(userId, userProfile, 3600);

// Get cached user profile
const cachedUser = await this.cacheManager.getUserProfile(userId);

// Invalidate user cache
await this.cacheManager.invalidateUserCache(userId);
```

### Current Cache Methods
```typescript
// User-related caching
cacheUserProfile(userId: string, profile: any, ttlSeconds?: number)
getUserProfile(userId: string)
invalidateUserCache(userId: string)

// Directory caching
cacheBabalawoDirectory(babalawos: any[], ttlSeconds?: number)
getBabalawoDirectory()
cacheMarketplaceProducts(category: string, products: any[], ttlSeconds?: number)
getMarketplaceProducts(category: string)
cacheTempleDirectory(temples: any[], ttlSeconds?: number)
getTempleDirectory()

// Forum caching
cacheForumCategories(categories: any[], ttlSeconds?: number)
getForumCategories()
cacheRecentThreads(threads: any[], ttlSeconds?: number)
getRecentThreads()

// Academy caching
cacheAcademyCourses(courses: any[], ttlSeconds?: number)
getAcademyCourses()

// Dashboard caching
cacheDashboardData(userId: string, dashboardData: any, ttlSeconds?: number)
getDashboardData(userId)

// Bulk invalidation
invalidateDirectoryCaches()
invalidateForumCaches()
```

## API Endpoints

### GET /api/cache/stats
Get cache performance statistics:
```json
{
  "connected": true,
  "uptime": 3600,
  "connectedClients": 1,
  "usedMemory": 1048576,
  "hits": 150,
  "misses": 25,
  "hitRate": 0.857
}
```

### GET /api/cache/status
Check cache availability:
```json
{
  "available": true,
  "message": "Cache is available and functioning"
}
```

### DELETE /api/cache/invalidate/user/:userId
Invalidate specific user cache:
```json
{
  "success": true,
  "message": "Cache invalidated for user user-123"
}
```

### DELETE /api/cache/invalidate/directories
Invalidate all directory caches:
```json
{
  "success": true,
  "message": "All directory caches invalidated"
}
```

### DELETE /api/cache/invalidate/forum
Invalidate all forum caches:
```json
{
  "success": true,
  "message": "All forum caches invalidated"
}
```

## Implementation Examples

### UserService with Caching
```typescript
async findOne(id: string) {
  // Try cache first
  const cachedUser = await this.cacheManager.getUserProfile(id);
  if (cachedUser) {
    return cachedUser;
  }

  // Fetch from database
  const user = await this.prisma.user.findUnique({
    where: { id },
    include: { /* ... */ }
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  // Cache for 1 hour
  await this.cacheManager.cacheUserProfile(id, user, 3600);
  
  return user;
}

async update(id: string, dto: UpdateUserDto) {
  const user = await this.prisma.user.update({
    where: { id },
    data: dto
  });

  // Invalidate cache on update
  await this.cacheManager.invalidateUserCache(id);
  
  return user;
}
```

## Cache Keys Structure
```
user:profile:{userId}           # User profile data
user:stats:{userId}            # User statistics
dashboard:{userId}             # User dashboard data
directory:babalawos           # Babalawo directory
marketplace:products:{category} # Marketplace products by category
forum:categories              # Forum categories
forum:recent-threads          # Recent forum threads
academy:courses               # Academy courses
temples:directory             # Temple directory
```

## Performance Benefits

### Expected Improvements
- **User profile lookups**: 50-80% faster response times
- **Directory listings**: 60-90% reduction in database queries
- **Forum browsing**: 40-70% faster category/thread loading
- **Overall API performance**: 30-50% improvement for cached endpoints

### Cache Hit Rate Targets
- **User profiles**: 80%+ hit rate
- **Directories**: 90%+ hit rate
- **Forum data**: 70%+ hit rate
- **Overall**: 75%+ average hit rate

## Monitoring and Maintenance

### Cache Health Checks
- Regular monitoring of hit/miss ratios
- Memory usage tracking
- Connection status monitoring
- TTL optimization based on usage patterns

### Cache Invalidation Strategy
- **Write-through**: Invalidate on data updates
- **Time-based**: Automatic expiration via TTL
- **Pattern-based**: Bulk invalidation for related data

### Performance Tuning
- Adjust TTL values based on data volatility
- Monitor memory usage and optimize key sizes
- Implement cache warming for critical data
- Use Redis clustering for high-traffic scenarios

## Future Enhancements

### Planned Features
- [ ] Cache warming strategies
- [ ] Redis cluster support
- [ ] Cache tagging system
- [ ] Advanced cache invalidation patterns
- [ ] Cache preloading for peak traffic periods
- [ ] Distributed caching with Redis Sentinel

### Production Considerations
- Redis persistence configuration
- Backup and recovery procedures
- Monitoring and alerting setup
- Connection pooling optimization
- Security and access control

## Troubleshooting

### Common Issues

**Cache Connection Failures**
- Check Redis server status
- Verify REDIS_URL configuration
- Ensure network connectivity

**Low Cache Hit Rates**
- Increase TTL values for stable data
- Implement cache warming
- Review cache key patterns

**Memory Pressure**
- Optimize cached data structures
- Implement cache eviction policies
- Monitor key sizes and usage patterns

### Debugging Commands
```bash
# Check Redis connectivity
redis-cli ping

# View cache statistics
redis-cli info

# Monitor active connections
redis-cli client list

# Check memory usage
redis-cli info memory
```