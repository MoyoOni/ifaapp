/**
 * Shared Hooks
 *
 * Central export for all reusable hooks in the application.
 */

// Authentication
export { useAuth } from './use-auth';

// Offline Support
export { useOfflineSync } from './use-offline-sync';
export { useDraftMessage } from './use-draft-message';

// API Query Utilities
export { useApiQuery, usePaginatedApiQuery } from './use-api-query';
export type { ApiQueryConfig, PaginatedResponse, PaginatedQueryConfig } from './use-api-query';

// API Error Handling
export { useApiErrorHandler } from './use-api-error-handler';

// Feature-specific Query Hooks
export * from './queries';
