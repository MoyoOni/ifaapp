import { useMemo } from 'react';
import { useClientDashboard } from '@/shared/hooks/dashboard';
import { calculateUserStats, type UserStats } from '@/shared/utils/user-stats';

/**
 * Hook that derives user stats (spiritual level, learning progress)
 * from actual client dashboard data.
 */
export function useUserStats(): UserStats {
  const { data: dashboard } = useClientDashboard();
  return useMemo(() => calculateUserStats(dashboard), [dashboard]);
}
