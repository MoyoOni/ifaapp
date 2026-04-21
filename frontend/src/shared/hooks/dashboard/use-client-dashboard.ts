/**
 * Client dashboard hook (V5-401)
 */

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '../use-auth';
import type { ClientDashboardSummary } from './types';
import * as Sentry from '@sentry/react';

export function useClientDashboard(userId?: string) {
  const { user } = useAuth();
  const effectiveUserId = userId ?? user?.id;

  return useQuery<ClientDashboardSummary>({
    queryKey: ['dashboard', 'client', effectiveUserId],
    queryFn: async () => {
      const response = await api.get(`/dashboard/client/${effectiveUserId}/summary`);
      return response.data;
    },
    enabled: !!effectiveUserId && !localStorage.getItem('dev_mode_role'),
    staleTime: 30000,
    refetchOnWindowFocus: true,
    throwOnError: (err) => {
      Sentry.captureException(err, {
        tags: { type: 'dashboard_client_fetch' },
        extra: { userId: effectiveUserId },
      });
      return false; // Let component handle isError instead of crashing error boundary
    },
  });
}
