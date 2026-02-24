/**
 * Client dashboard hook (PB-203.1)
 */

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '../use-auth';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { DEMO_USERS } from '@/demo';
import { buildDemoClientDashboard } from './demo-builders';
import type { ClientDashboardSummary } from './types';
import * as Sentry from '@sentry/react';

export function useClientDashboard(userId?: string) {
  const { user } = useAuth();
  const effectiveUserId = userId ?? user?.id;
  const fallbackId = effectiveUserId ?? DEMO_USERS['demo-client-1']?.id ?? 'demo-client-1';

  return useQuery<ClientDashboardSummary>({
    queryKey: ['dashboard', 'client', effectiveUserId ?? fallbackId],
    queryFn: async () => {
      const id = effectiveUserId ?? fallbackId;
      try {
        const response = await api.get(`/dashboard/client/${id}/summary`);
        return response.data;
      } catch (err) {
        if (!isDemoMode) {
          Sentry.captureException(err, {
            tags: { type: 'dashboard_client_fetch' },
            extra: { userId: id }
          });
          throw err;
        }
        logger.warn('Failed to fetch client dashboard, using demo data');
        return buildDemoClientDashboard(id);
      }
    },
    enabled: true,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}
