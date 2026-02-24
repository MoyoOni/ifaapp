/**
 * Current user dashboard hook – delegates by role (PB-203.1)
 */

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '../use-auth';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import {
  buildDemoClientDashboard,
  buildDemoBabalawoDashboard,
  buildDemoVendorDashboard,
} from './demo-builders';

export function useMyDashboard() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'me', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }

      try {
        const response = await api.get('/dashboard/me/summary');
        return response.data;
      } catch (err) {
        if (!isDemoMode) throw err;
        logger.warn('Failed to fetch dashboard, using demo data');
        switch (user.role) {
          case 'BABALAWO':
            return buildDemoBabalawoDashboard(user.id);
          case 'VENDOR':
            return buildDemoVendorDashboard(user.id);
          default:
            return buildDemoClientDashboard(user.id);
        }
      }
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}
