import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';

export interface SubscriptionStatus {
  status: 'FREE' | 'DEVOTED' | 'EXPIRED';
  plan: 'QUARTERLY' | 'ANNUAL' | null;
  endDate: string | null;
  daysRemaining: number | null;
  autoRenew: boolean | null;
}

export function useSubscription() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery<SubscriptionStatus>({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      const r = await api.get('/subscriptions/me');
      return r.data;
    },
    enabled: !!user && !localStorage.getItem('dev_mode_role'),
    staleTime: 5 * 60 * 1000,  // 5 minutes
    // Fail open — if API errors, treat as FREE (never accidentally lock Devoted users)
    retry: 1,
  });

  return {
    isDevoted: data?.status === 'DEVOTED',
    isFree: !data || data.status === 'FREE' || data.status === 'EXPIRED',
    isLoading,
    plan: data?.plan ?? null,
    endDate: data?.endDate ?? null,
    daysRemaining: data?.daysRemaining ?? null,
    autoRenew: data?.autoRenew ?? null,
    status: data?.status ?? 'FREE',
  };
}
