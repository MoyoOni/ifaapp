import { useApiQuery } from '../use-api-query';
import { Temple, TempleType, TempleStatus } from '@common';
// import { DEMO_TEMPLES } from '@/demo';

export interface UseTemplesParams {
  search?: string;
  type?: TempleType | 'ALL';
  status?: TempleStatus | 'ALL';
  verified?: boolean | 'ALL';
  city?: string;
}

/**
 * Hook for fetching temples
 * Merges demo data with API results
 */
export function useTemplesQuery(params: UseTemplesParams = {}) {
  const { search, type, status, verified, city } = params;

  return useApiQuery<Temple[]>({
    endpoint: '/temples',
    queryKey: ['temples', { search, type, status, verified, city }],
    params: {
      search: search || undefined,
      type: type !== 'ALL' ? type : undefined,
      status: status !== 'ALL' ? status : undefined,
      verified: verified !== 'ALL' ? verified : undefined,
      city: city || undefined,
    },
  });

}

export default useTemplesQuery;
