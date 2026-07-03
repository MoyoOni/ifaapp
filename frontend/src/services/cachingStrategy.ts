/**
 * CachingStrategy.ts - Best practices and preset configurations for the IFA App
 * Defines cache strategies for different data types
 */

import { CacheConfig } from '../services/cacheService';

/**
 * Cache TTL presets (time-to-live durations)
 */
export const CACHE_TTL = {
  // Ultra-short: For rapidly changing real-time data
  REAL_TIME: 10 * 1000, // 10 seconds

  // Short: For user interactions and UI state
  SHORT: 1 * 60 * 1000, // 1 minute

  // Medium: For search results, lists, and session data
  MEDIUM: 5 * 60 * 1000, // 5 minutes (DEFAULT)

  // Long: For user profiles, settings, metadata
  LONG: 30 * 60 * 1000, // 30 minutes

  // Very long: For static content, reference data
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours

  // Indefinite: For user preferences and settings (manual invalidation)
  INDEFINITE: Number.MAX_SAFE_INTEGER,
};

/**
 * Cache tags for grouped invalidation
 */
export const CACHE_TAGS = {
  // User data
  USER: 'user',
  PROFILE: 'profile',
  PREFERENCES: 'preferences',
  WALLET: 'wallet',
  NOTIFICATIONS: 'notifications',

  // Search & Discovery
  SEARCH: 'search',
  DISCOVERY: 'discovery',
  BABALAWO: 'babalawo',
  TEMPLE: 'temple',
  MARKETPLACE: 'marketplace',

  // Consultations & Bookings
  CONSULTATIONS: 'consultations',
  APPOINTMENTS: 'appointments',
  AVAILABILITY: 'availability',

  // Academy & Content
  COURSES: 'courses',
  LESSONS: 'lessons',
  ACADEMY: 'academy',

  // Forum & Community
  FORUM: 'forum',
  POSTS: 'posts',
  CIRCLES: 'circles',

  // Admin & Analytics
  ADMIN: 'admin',
  ANALYTICS: 'analytics',
  METRICS: 'metrics',
};

/**
 * Preset cache configurations for common data types
 */
export const CACHE_STRATEGIES: Record<string, CacheConfig> = {
  // User data - cached for 30 mins, invalidated on profile update
  USER_PROFILE: {
    ttl: CACHE_TTL.LONG,
    storage: 'hybrid',
    tags: [CACHE_TAGS.USER, CACHE_TAGS.PROFILE],
    priority: 'high',
  },

  // User preferences - cached indefinitely, invalidated on setting change
  USER_PREFERENCES: {
    ttl: CACHE_TTL.INDEFINITE,
    storage: 'localStorage',
    tags: [CACHE_TAGS.USER, CACHE_TAGS.PREFERENCES],
    priority: 'high',
  },

  // Search results - cached for 5 mins, cleared on new search
  SEARCH_RESULTS: {
    ttl: CACHE_TTL.MEDIUM,
    storage: 'memory',
    tags: [CACHE_TAGS.SEARCH],
    priority: 'medium',
  },

  // Discovery listings - cached for 10 mins
  DISCOVERY_LIST: {
    ttl: 10 * 60 * 1000,
    storage: 'hybrid',
    tags: [CACHE_TAGS.DISCOVERY],
    priority: 'high',
  },

  // Babalawo profiles - cached for 20 mins
  BABALAWO_PROFILE: {
    ttl: 20 * 60 * 1000,
    storage: 'hybrid',
    tags: [CACHE_TAGS.BABALAWO, CACHE_TAGS.PROFILE],
    priority: 'high',
  },

  // Temple data - cached for 1 hour (rarely changes)
  TEMPLE_DATA: {
    ttl: 60 * 60 * 1000,
    storage: 'hybrid',
    tags: [CACHE_TAGS.TEMPLE],
    priority: 'medium',
  },

  // Appointments/Consultations - cached for 2 mins (frequently changes)
  APPOINTMENTS: {
    ttl: 2 * 60 * 1000,
    storage: 'hybrid',
    tags: [CACHE_TAGS.APPOINTMENTS, CACHE_TAGS.CONSULTATIONS],
    priority: 'high',
  },

  // Availability slots - cached for 1 min (needs to be fresh)
  AVAILABILITY: {
    ttl: CACHE_TTL.SHORT,
    storage: 'memory',
    tags: [CACHE_TAGS.AVAILABILITY],
    priority: 'high',
  },

  // Course listings - cached for 30 mins
  COURSES_LIST: {
    ttl: 30 * 60 * 1000,
    storage: 'hybrid',
    tags: [CACHE_TAGS.COURSES, CACHE_TAGS.ACADEMY],
    priority: 'medium',
  },

  // Lesson content - cached for 1 hour (static content)
  LESSON_CONTENT: {
    ttl: 60 * 60 * 1000,
    storage: 'hybrid',
    tags: [CACHE_TAGS.LESSONS, CACHE_TAGS.ACADEMY],
    priority: 'medium',
  },

  // Forum posts - cached for 5 mins
  FORUM_POSTS: {
    ttl: CACHE_TTL.MEDIUM,
    storage: 'hybrid',
    tags: [CACHE_TAGS.FORUM, CACHE_TAGS.POSTS],
    priority: 'medium',
  },

  // Marketplace products - cached for 20 mins
  MARKETPLACE_PRODUCTS: {
    ttl: 20 * 60 * 1000,
    storage: 'hybrid',
    tags: [CACHE_TAGS.MARKETPLACE],
    priority: 'medium',
  },

  // Wallet data - cached for 2 mins (must be current)
  WALLET_DATA: {
    ttl: 2 * 60 * 1000,
    storage: 'hybrid',
    tags: [CACHE_TAGS.WALLET],
    priority: 'high',
  },

  // Notifications - cached for 1 min
  NOTIFICATIONS: {
    ttl: CACHE_TTL.SHORT,
    storage: 'memory',
    tags: [CACHE_TAGS.NOTIFICATIONS],
    priority: 'high',
  },

  // Analytics - cached for 10 mins
  ANALYTICS_DATA: {
    ttl: 10 * 60 * 1000,
    storage: 'hybrid',
    tags: [CACHE_TAGS.ANALYTICS, CACHE_TAGS.METRICS],
    priority: 'low',
  },

  // Admin data - cached for 5 mins
  ADMIN_DATA: {
    ttl: CACHE_TTL.MEDIUM,
    storage: 'hybrid',
    tags: [CACHE_TAGS.ADMIN],
    priority: 'medium',
  },

  // Reference data (enums, constants) - cached for 24 hours
  REFERENCE_DATA: {
    ttl: CACHE_TTL.VERY_LONG,
    storage: 'localStorage',
    tags: [],
    priority: 'low',
  },
};

/**
 * Invalidation patterns for common actions
 */
export const INVALIDATION_PATTERNS = {
  // When user updates profile
  ON_PROFILE_UPDATE: [CACHE_TAGS.PROFILE, CACHE_TAGS.DISCOVERY],

  // When user books appointment
  ON_APPOINTMENT_BOOKED: [CACHE_TAGS.APPOINTMENTS, CACHE_TAGS.WALLET, CACHE_TAGS.CONSULTATIONS],

  // When user logs out
  ON_LOGOUT: [CACHE_TAGS.USER, CACHE_TAGS.WALLET, CACHE_TAGS.NOTIFICATIONS],

  // When user joins circle
  ON_CIRCLE_JOINED: [CACHE_TAGS.CIRCLES, CACHE_TAGS.USER],

  // When marketplace order placed
  ON_ORDER_PLACED: [CACHE_TAGS.MARKETPLACE, CACHE_TAGS.WALLET],

  // When forum post created
  ON_POST_CREATED: [CACHE_TAGS.FORUM, CACHE_TAGS.POSTS],

  // When user settings changed
  ON_SETTINGS_CHANGED: [CACHE_TAGS.PREFERENCES, CACHE_TAGS.NOTIFICATIONS],

  // Periodic refresh for frequently accessed data
  PERIODIC_REFRESH: [CACHE_TAGS.CONSULTATIONS, CACHE_TAGS.APPOINTMENTS, CACHE_TAGS.NOTIFICATIONS],
};

/**
 * Example usage in components
 */
export const CACHE_EXAMPLES = {
  // Example 1: Fetch babalawo profile with caching
  BABALAWO_PROFILE_EXAMPLE: `
    const { data: babalawo, isLoading, invalidate } = useCache({
      cacheKey: \`babalawo-\${id}\`,
      fetchFn: () => api.get(\`/users/\${id}/profile\`),
      ...CACHE_STRATEGIES.BABALAWO_PROFILE,
      onSuccess: (data) => console.log('Profile loaded:', data),
    });

    // Invalidate when profile updates
    const handleProfileUpdate = async (updates) => {
      await api.patch(\`/users/\${id}\`, updates);
      invalidate();
    };
  `,

  // Example 2: Search with caching
  SEARCH_EXAMPLE: `
    const { data: results, isCached } = useCache({
      cacheKey: \`search-\${query}\`,
      fetchFn: () => api.get('/search', { params: { q: query } }),
      ...CACHE_STRATEGIES.SEARCH_RESULTS,
    });

    // Show "cached" indicator if from cache
    return <div>{isCached && '⚡'} {results?.length} results</div>;
  `,

  // Example 3: Batch cache operations
  BATCH_EXAMPLE: `
    const { batch, invalidateTag } = useCacheManager();

    // Cache multiple related items at once
    batch([
      { key: \`user-\${userId}\`, data: userData, config: CACHE_STRATEGIES.USER_PROFILE },
      { key: \`prefs-\${userId}\`, data: preferences, config: CACHE_STRATEGIES.USER_PREFERENCES },
    ]);

    // Invalidate entire user tag
    invalidateTag(CACHE_TAGS.USER);
  `,

  // Example 4: Watch cache changes
  WATCH_EXAMPLE: `
    useCacheWatch(\`wallet-\${userId}\`, (newWalletData) => {
      // React whenever wallet data is cached/updated
      console.log('Wallet updated:', newWalletData);
    });
  `,
};
