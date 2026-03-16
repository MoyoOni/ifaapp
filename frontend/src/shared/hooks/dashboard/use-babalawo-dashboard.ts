/**
 * Babalawo dashboard hook (PB-203.1)
 */

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '../use-auth';
import type { BabalawoDashboardSummary } from './types';
import * as Sentry from '@sentry/react';

export function useBabalawoDashboard(userId?: string) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  return useQuery<BabalawoDashboardSummary>({
    queryKey: ['dashboard', 'babalawo', effectiveUserId],
    queryFn: async () => {
      try {
        const response = await api.get(`/dashboard/babalawo/${effectiveUserId}/summary`);
        return response.data;
      } catch (err) {
        Sentry.captureException(err, {
          tags: { type: 'dashboard_babalawo_fetch' },
          extra: { userId: effectiveUserId }
        });
        throw err;
      }
    },
    enabled: !!effectiveUserId,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}
