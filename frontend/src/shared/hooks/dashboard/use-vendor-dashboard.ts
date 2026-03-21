/**
 * Vendor dashboard hook (V5-601)
 */

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '../use-auth';
import type { VendorDashboardSummary } from './types';
import * as Sentry from '@sentry/react';

export function useVendorDashboard(userId?: string) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  return useQuery<VendorDashboardSummary>({
    queryKey: ['dashboard', 'vendor', effectiveUserId],
    queryFn: async () => {
      const response = await api.get(`/dashboard/vendor/${effectiveUserId}/summary`);
      return response.data;
    },
    enabled: !!effectiveUserId,
    staleTime: 30000,
    refetchOnWindowFocus: true,
    throwOnError: (err) => {
      Sentry.captureException(err, {
        tags: { type: 'dashboard_vendor_fetch' },
        extra: { userId: effectiveUserId },
      });
      return false; // Let component handle isError instead of crashing error boundary
    },
  });
}
