import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { isDevModeActive } from '@/shared/utils/dev-mode';

export interface SubscriptionStatus {
  status: 'FREE' | 'DEVOTED' | 'EXPIRED';
  plan: 'QUARTERLY' | 'ANNUAL' | null;
  endDate: string | null;
  daysRemaining: number | null;
  autoRenew: boolean | null;
  canPause: boolean;
}

export function useSubscription() {
  const { user } = useAuth();

  const { data, isLoading, isError } = useQuery<SubscriptionStatus>({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      const r = await api.get('/subscriptions/me');
      return r.data;
    },
    enabled: !!user && !isDevModeActive(),
    staleTime: 5 * 60 * 1000,  // 5 minutes
    retry: 1,
  });

  // V8-201: fail OPEN, not closed. The comment here previously claimed
  // "fail open" but `isFree: !data || ...` actually resolved to true on any
  // query error (data undefined), locking a real paying Devoted user out of
  // gated features on a transient failure -- the exact bug this platform's
  // own risk registry (V8_MONETISATION_BACKLOG.md §12) warns against. A
  // confirmed error now treats the user as Devoted; only a *resolved*
  // response of FREE/EXPIRED (or no query run at all, e.g. logged out) does.
  const isDevoted = isError ? true : data?.status === 'DEVOTED';
  const isFree = isError ? false : !data || data.status === 'FREE' || data.status === 'EXPIRED';

  return {
    isDevoted,
    isFree,
    isLoading,
    isError,
    plan: data?.plan ?? null,
    endDate: data?.endDate ?? null,
    daysRemaining: data?.daysRemaining ?? null,
    autoRenew: data?.autoRenew ?? null,
    canPause: data?.canPause ?? false,
    status: isError ? 'DEVOTED' : (data?.status ?? 'FREE'),
  };
}
