# Caching Strategy Implementation Guide (EXP-020)

## Overview

The **EXP-020: Intelligent Caching Strategy** feature provides a comprehensive, multi-tier caching solution for the IFA App frontend. It combines in-memory caching, localStorage persistence, automatic TTL-based expiration, and tag-based invalidation to optimize performance and reduce API calls.

## Architecture

### Three-Tier Caching

1. **Memory Cache** - Fastest, lost on page refresh
   - In-memory Map with LRU eviction (max 100 items by default)
   - Used for frequently accessed data within a session

2. **Storage Cache** - Persistent across page reloads
   - localStorage for data that should survive page refreshes
   - Automatic quota management (5MB default limit)
   - Graceful overflow handling with LRU eviction

3. **Hybrid Mode** - Best of both
   - Data stored in both memory and localStorage
   - Memory for speed, localStorage as fallback
   - Recommended for most user data

## Core Components

### 1. CacheService (`/src/services/cacheService.ts`)

**Singleton service** providing all cache operations:

```typescript
// Get cached value
const data = cacheService.get<T>(key);

// Set with TTL and tags
cacheService.set(data, data, {
  ttl: 5 * 60 * 1000,  // 5 minutes
  storage: 'hybrid',
  tags: ['user', 'profile'],  // For group invalidation
});

// Invalidate by key or tag
cacheService.invalidate(key);  // Single key
cacheService.invalidate(tag, true);  // All with tag

// Clear all
cacheService.clear();

// Get stats
const stats = cacheService.getStats();
```

**Key Features:**
- Automatic TTL expiration
- LRU (Least Recently Used) eviction when limits reached
- Tag-based invalidation for related data
- localStorage quota management
- Batch operations for performance

### 2. useCache Hook (`/src/hooks/useCache.ts`)

**React hook** for integrated data fetching with caching:

```typescript
const { 
  data, 
  isLoading, 
  isCached,  // True if from cache
  error, 
  refetch,
  invalidate,
  invalidateTag,
} = useCache({
  cacheKey: 'babalawo-123',
  fetchFn: () => api.get('/users/123/profile'),
  ttl: 30 * 60 * 1000,
  storage: 'hybrid',
  tags: ['babalawo', 'profile'],
  enabled: true,
  onSuccess: (data) => console.log('Loaded:', data),
  onError: (error) => console.error('Error:', error),
});
```

**Features:**
- Combines React Query with local caching
- Automatic cache validation and stale data handling
- Convenience methods for invalidation
- Success/error callbacks
- Shows whether data came from cache or fresh fetch

### 3. Caching Strategy (`/src/services/cachingStrategy.ts`)

**Preset configurations** for consistent cache behavior across features:

```typescript
import { CACHE_TTL, CACHE_TAGS, CACHE_STRATEGIES } from './cachingStrategy';

// Use preset configuration
useCache({
  cacheKey: 'babalawo-search',
  fetchFn: () => api.get('/search'),
  ...CACHE_STRATEGIES.BABALAWO_PROFILE,  // Preset config
});

// Invalidate related data
cacheService.invalidate(CACHE_TAGS.BABALAWO, true);  // All babalawo data
```

**Available Presets:**
- `USER_PROFILE` - 30 min TTL, hybrid storage, high priority
- `SEARCH_RESULTS` - 5 min TTL, memory only
- `DISCOVERY_LIST` - 10 min TTL, hybrid storage
- `APPOINTMENTS` - 2 min TTL, hybrid storage (frequently updates)
- `COURSES_LIST` - 30 min TTL, hybrid storage
- `MARKETPLACE_PRODUCTS` - 20 min TTL, hybrid storage
- And many more...

### 4. CacheDebugger Component (`/src/components/CacheDebugger.tsx`)

**Development tool** for monitoring cache performance:

- Shows memory and storage usage with progress bars
- Item count vs max capacity
- Manual cache refresh and clear buttons
- Console access to cache service
- Only visible when `dev_mode_role` is set

## Usage Patterns

### Pattern 1: Simple Data Fetch with Caching

```typescript
// Component
export const UserProfile = ({ userId }) => {
  const { data: user, isLoading } = useCache({
    cacheKey: `user-${userId}`,
    fetchFn: () => api.get(`/users/${userId}`),
    ...CACHE_STRATEGIES.USER_PROFILE,
  });

  return (
    <div>
      {isLoading && <Skeleton />}
      {user && <UserCard {...user} />}
    </div>
  );
};
```

### Pattern 2: Invalidation on Update

```typescript
// Update user and invalidate cache
export const useUpdateUser = () => {
  const { invalidate } = useCacheManager();

  return async (userId, updates) => {
    await api.patch(`/users/${userId}`, updates);
    // Invalidate specific user cache
    invalidate(`user-${userId}`);
    // Or invalidate entire user tag
    invalidate(CACHE_TAGS.USER, true);  // Clears all user-related caches
  };
};
```

### Pattern 3: Batch Cache Operations

```typescript
const { batch, invalidateTag } = useCacheManager();

// Cache multiple related items at once
batch([
  { 
    key: `user-${userId}`, 
    data: userData, 
    config: CACHE_STRATEGIES.USER_PROFILE 
  },
  { 
    key: `prefs-${userId}`, 
    data: preferences, 
    config: CACHE_STRATEGIES.USER_PREFERENCES 
  },
]);

// Later, invalidate all related data
invalidateTag(CACHE_TAGS.USER);
```

### Pattern 4: Search with Caching

```typescript
export const SearchResults = ({ query }) => {
  const { data: results, isCached } = useCache({
    cacheKey: `search-${query}`,
    fetchFn: () => api.get('/search', { params: { q: query } }),
    ...CACHE_STRATEGIES.SEARCH_RESULTS,
    enabled: query.length > 0,
  });

  return (
    <div>
      {isCached && <span className="cached-badge">⚡ Cached</span>}
      {results?.map(item => <ResultCard key={item.id} {...item} />)}
    </div>
  );
};
```

## Invalidation Strategy

### Automatic Invalidation Patterns

Invalidate these tags when specific events occur:

```typescript
// User profile updated
ON_PROFILE_UPDATE: [CACHE_TAGS.PROFILE, CACHE_TAGS.DISCOVERY]

// Appointment booked
ON_APPOINTMENT_BOOKED: [
  CACHE_TAGS.APPOINTMENTS, 
  CACHE_TAGS.WALLET, 
  CACHE_TAGS.CONSULTATIONS
]

// User logs out
ON_LOGOUT: [CACHE_TAGS.USER, CACHE_TAGS.WALLET, CACHE_TAGS.NOTIFICATIONS]

// Forum post created
ON_POST_CREATED: [CACHE_TAGS.FORUM, CACHE_TAGS.POSTS]
```

### Implementation Example

```typescript
// Auth service
const handleLogout = async () => {
  const { invalidateTag } = useCacheManager();
  
  await api.post('/logout');
  
  // Clear all user-related caches
  INVALIDATION_PATTERNS.ON_LOGOUT.forEach(tag => {
    invalidateTag(tag);
  });
};
```

## Performance Impact

### Expected Improvements

1. **Reduced API Calls**
   - Repeated queries return from cache (< 1ms)
   - Search results cached for 5 minutes
   - User profiles cached for 30 minutes

2. **Faster Page Loads**
   - Navigate between pages without re-fetching
   - User data available instantly on return

3. **Better UX**
   - No flickering between empty state and data
   - Optimistic UI updates possible

### Monitoring

Access cache statistics in console:

```typescript
// In dev tools console
cacheService.getStats()
// Returns: { memoryItems: 15, memorySize: 245000, storageSize: 1200000, ... }
```

## Configuration Tuning

### Default Limits (in `/src/services/cacheService.ts`)

```typescript
config = {
  defaultTTL: 5 * 60 * 1000,  // 5 minutes
  maxMemoryItems: 100,         // Items before LRU
  maxStorageSize: 5 * 1024 * 1024,  // 5MB
};
```

### Adjust Based on:
- Device memory (lower for mobile)
- Network speed (longer TTLs for slow connections)
- Data freshness requirements (shorter TTLs for critical data)

## Best Practices

✅ **DO:**
- Use preset CACHE_STRATEGIES for consistency
- Add meaningful tags for batch invalidation
- Set appropriate TTLs (shorter for dynamic data)
- Monitor cache stats in development
- Test cache behavior during network offline
- Clear cache on logout

❌ **DON'T:**
- Cache sensitive authentication data
- Cache data that's instantly stale (use shorter TTL)
- Ignore cache invalidation (leads to stale data)
- Cache too large objects (check stats)
- Use 'hybridly' inconsistently across similar features

## Testing

### Test Cache Hit/Miss

```typescript
// Should hit cache
const result1 = await api.get('/data');
const result2 = await api.get('/data');  // From cache

// Should miss cache (different key)
const result3 = await api.get('/data', { id: 2 });
```

### Test Invalidation

```typescript
// Cache something
cacheService.set('test', data, { tags: ['user'] });

// Verify it's cached
assert(cacheService.get('test') !== null);

// Invalidate by tag
cacheService.invalidate('user', true);

// Should be gone
assert(cacheService.get('test') === null);
```

## Migration Guide

### Existing Components Using useQuery

Replace:

```typescript
// BEFORE
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => api.get(`/users/${userId}`),
});
```

With:

```typescript
// AFTER
const { data } = useCache({
  cacheKey: `user-${userId}`,
  fetchFn: () => api.get(`/users/${userId}`),
  ...CACHE_STRATEGIES.USER_PROFILE,
});
```

## Summary

EXP-020 provides:
- ✅ Multi-tier caching (memory + localStorage)
- ✅ Automatic TTL expiration
- ✅ Tag-based invalidation
- ✅ React hook integration
- ✅ Preset configurations for consistency
- ✅ Development debugging tools
- ✅ Graceful error handling
- ✅ Quota management

Result: **Significantly faster app, fewer API calls, better offline support**
