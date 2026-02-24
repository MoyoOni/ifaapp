import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import * as Sentry from '@sentry/react';

/**
 * Configuration for API query with demo fallback
 */
export interface ApiQueryConfig<TData, TParams = Record<string, unknown>> {
  /** API endpoint (without /api prefix) */
  endpoint: string;
  /** Query key for React Query caching */
  queryKey: unknown[];
  /** Query parameters to send to API */
  params?: TParams;
  /** Demo data to use as fallback */
  demoData?: TData;
  /** Function to filter/transform demo data based on params */
  filterDemoData?: (data: TData, params?: TParams) => TData;
  /** Whether to merge demo data with API data (default: false) */
  mergeDemoData?: boolean;
  /** React Query options */
  queryOptions?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>;
}

/**
 * Generic hook for API queries with automatic demo data fallback
 *
 * This hook standardizes the pattern of:
 * 1. Attempting to fetch from API
 * 2. Falling back to demo data on error
 * 3. Optionally merging demo data with API results
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useApiQuery({
 *   endpoint: '/courses',
 *   queryKey: ['courses', category],
 *   params: { category },
 *   demoData: DEMO_COURSES,
 *   filterDemoData: (courses, params) =>
 *     courses.filter(c => !params?.category || c.category === params.category)
 * });
 * ```
 */
export function useApiQuery<TData, TParams = Record<string, unknown>>({
  endpoint,
  queryKey,
  params,
  demoData,
  filterDemoData,
  mergeDemoData = false,
  queryOptions,
}: ApiQueryConfig<TData, TParams>) {
  return useQuery<TData>({
    queryKey,
    queryFn: async () => {
      let apiData: TData | null = null;

      try {
        // Clean params - remove undefined/null values
        const cleanParams = params
          ? Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
          )
          : undefined;

        const response = await api.get(endpoint, { params: cleanParams });
        apiData = response.data;
      } catch (error) {
        if (!isDemoMode) {
          Sentry.captureException(error, {
            tags: { endpoint, type: 'api_query' },
            extra: { params }
          });
          throw error;
        }
        logger.warn(`API call to ${endpoint} failed, using demo data`);
      }

      // Get filtered demo data if available
      const filteredDemo = demoData
        ? filterDemoData
          ? filterDemoData(demoData, params)
          : demoData
        : null;

      // Return based on strategy
      if (apiData !== null) {
        if (mergeDemoData && filteredDemo && Array.isArray(apiData) && Array.isArray(filteredDemo)) {
          // Merge demo data with API data (demo first)
          return [...filteredDemo, ...apiData] as TData;
        }
        return apiData;
      }

      // Fallback to demo data only when demo mode is enabled
      if (!isDemoMode) throw new Error(`API failed: ${endpoint}`);
      return (filteredDemo ?? []) as TData;
    },
    ...queryOptions,
  });
}

/**
 * Hook for paginated API queries
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedQueryConfig<TItem, TParams = Record<string, unknown>> {
  endpoint: string;
  queryKey: unknown[];
  params?: TParams;
  page?: number;
  pageSize?: number;
  demoData?: TItem[];
  filterDemoData?: (data: TItem[], params?: TParams) => TItem[];
  queryOptions?: Omit<UseQueryOptions<PaginatedResponse<TItem>>, 'queryKey' | 'queryFn'>;
}

export function usePaginatedApiQuery<TItem, TParams = Record<string, unknown>>({
  endpoint,
  queryKey,
  params,
  page = 1,
  pageSize = 10,
  demoData,
  filterDemoData,
  queryOptions,
}: PaginatedQueryConfig<TItem, TParams>) {
  return useQuery<PaginatedResponse<TItem>>({
    queryKey: [...queryKey, page, pageSize],
    queryFn: async () => {
      try {
        const cleanParams = {
          ...params,
          page,
          pageSize,
        };

        const response = await api.get(endpoint, { params: cleanParams });
        return response.data;
      } catch (error) {
        if (!isDemoMode) {
          Sentry.captureException(error, {
            tags: { endpoint, type: 'paginated_api_query' },
            extra: { params, page, pageSize }
          });
          throw error;
        }
        const allData = demoData
          ? filterDemoData
            ? filterDemoData(demoData, params)
            : demoData
          : [];

        const start = (page - 1) * pageSize;
        const paginatedData = allData.slice(start, start + pageSize);

        return {
          data: paginatedData,
          total: allData.length,
          page,
          pageSize,
          totalPages: Math.ceil(allData.length / pageSize),
        };
      }
    },
    ...queryOptions,
  });
}

export default useApiQuery;
