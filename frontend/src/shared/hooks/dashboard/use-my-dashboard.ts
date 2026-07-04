/**
 * Current user dashboard hook – delegates by role (PB-203.1)
 */

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '../use-auth';
import { isDevModeActive } from '@/shared/utils/dev-mode';

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
        throw err;
      }
    },
    enabled: !!user?.id && !isDevModeActive(),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

