/**
 * Vendor dashboard hook (PB-203.1)
 */

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '../use-auth';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { DEMO_USERS } from '@/demo';
import { buildDemoVendorDashboard } from './demo-builders';
import type { VendorDashboardSummary } from './types';
import * as Sentry from '@sentry/react';

export function useVendorDashboard(userId?: string) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  return useQuery<VendorDashboardSummary>({
    queryKey: ['dashboard', 'vendor', effectiveUserId],
    queryFn: async () => {
      const fallbackId = effectiveUserId || DEMO_USERS['demo-vendor-1'].id;
      if (!effectiveUserId) {
        return buildDemoVendorDashboard(fallbackId);
      }

      try {
        const response = await api.get(`/dashboard/vendor/${effectiveUserId}/summary`);
        return response.data;
      } catch (err) {
        if (!isDemoMode) {
          Sentry.captureException(err, {
            tags: { type: 'dashboard_vendor_fetch' },
            extra: { userId: effectiveUserId }
          });
          throw err;
        }
        logger.warn('Failed to fetch vendor dashboard, using demo data');
        return buildDemoVendorDashboard(fallbackId);
      }
    },
    enabled: !!effectiveUserId,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}
