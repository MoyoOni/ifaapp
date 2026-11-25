/**
 * Vendor dashboard hook (V5-601)
 */

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '../use-auth';
import type { VendorDashboardSummary } from './types';
import { reportError } from '@/shared/config/sentry';
import { isDevModeActive } from '@/shared/utils/dev-mode';

export function useVendorDashboard(userId?: string) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  return useQuery<VendorDashboardSummary>({
    queryKey: ['dashboard', 'vendor', effectiveUserId],
    queryFn: async () => {
      const response = await api.get(`/dashboard/vendor/${effectiveUserId}/summary`);
      return response.data;
    },
    enabled: !!effectiveUserId && !isDevModeActive(),
    staleTime: 30000,
    refetchOnWindowFocus: true,
    throwOnError: (err) => {
      reportError(err, 'dashboard_vendor_fetch');
      return false; // Let component handle isError instead of crashing error boundary
    },
  });
}
