/**
 * Babalawo dashboard hook (PB-203.1)
 */

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '../use-auth';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { DEMO_USERS } from '@/demo';
import { buildDemoBabalawoDashboard } from './demo-builders';
import type { BabalawoDashboardSummary } from './types';
import * as Sentry from '@sentry/react';

export function useBabalawoDashboard(userId?: string) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  return useQuery<BabalawoDashboardSummary>({
    queryKey: ['dashboard', 'babalawo', effectiveUserId],
    queryFn: async () => {
      const fallbackId = effectiveUserId || DEMO_USERS['demo-baba-1'].id;
      if (!effectiveUserId) {
        return buildDemoBabalawoDashboard(fallbackId);
      }

      try {
        const response = await api.get(`/dashboard/babalawo/${effectiveUserId}/summary`);
        return response.data;
      } catch (err) {
        if (!isDemoMode) {
          Sentry.captureException(err, {
            tags: { type: 'dashboard_babalawo_fetch' },
            extra: { userId: effectiveUserId }
          });
          throw err;
        }
        logger.warn('Failed to fetch babalawo dashboard, using demo data');
        return buildDemoBabalawoDashboard(fallbackId);
      }
    },
    enabled: !!effectiveUserId,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}
