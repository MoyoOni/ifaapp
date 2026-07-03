import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Users, Gift, TrendingUp, CheckCircle } from 'lucide-react';

const fmt = new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' });

interface ReferralStats {
  total: number;
  converted: number;
  rewarded: number;
  conversionRate: number;
  leaderboard: Array<{
    user?: { id: string; name: string; email: string; avatar?: string };
    count: number;
  }>;
}

interface ReferralItem {
  id: string;
  referrerId: string;
  referredId: string;
  code: string;
  rewardGranted: boolean;
  createdAt: string;
  referrer: { id: string; name: string; email: string };
  referred: { id: string; name: string; email: string };
}

interface ReferralsResponse {
  items: ReferralItem[];
  total: number;
  page: number;
  pages: number;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="border border-border rounded-lg p-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function AdminReferralsTab() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'overview' | 'list'>('overview');

  const { data: stats, isLoading: statsLoading } = useQuery<ReferralStats>({
    queryKey: ['admin', 'referrals', 'stats'],
    queryFn: () => api.get('/admin/referrals/stats').then((r) => r.data),
    enabled: view === 'overview',
  });

  const { data: referrals, isLoading: listLoading } = useQuery<ReferralsResponse>({
    queryKey: ['admin', 'referrals', 'list', page],
    queryFn: () => api.get('/admin/referrals', { params: { page } }).then((r) => r.data),
    enabled: view === 'list',
  });

  const creditMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/referrals/${id}/credit`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'referrals'] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><Users className="w-5 h-5" /> Referral Program</h2>
        <p className="text-sm text-muted-foreground mt-1">Track how users are bringing in other users, and manually credit rewards.</p>
      </div>

      {/* View tabs */}
      <div className="flex gap-2 border-b border-border">
        {([['overview', 'Overview'], ['list', 'All Referrals']] as const).map(([v, label]) => (
          <button key={v} type="button" onClick={() => setView(v)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${view === v ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {view === 'overview' && (
        <div className="space-y-6">
          {statsLoading ? (
            <p className="text-center text-sm text-muted-foreground py-12">Loading…</p>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Referrals" value={stats.total} />
                <StatCard label="Rewarded" value={stats.rewarded} />
                <StatCard label="Conversion Rate" value={`${stats.conversionRate}%`} sub="referred → rewarded" />
                <StatCard label="Pending Reward" value={stats.total - stats.rewarded} />
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Top Referrers</h3>
                {!stats.leaderboard.length ? (
                  <p className="text-sm text-muted-foreground">No referrals recorded yet.</p>
                ) : (
                  <div className="border border-border rounded-lg overflow-hidden">
                    {stats.leaderboard.map((entry, i) => (
                      <div key={entry.user?.id ?? i} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                        <span className="text-sm font-bold text-muted-foreground w-5 text-center">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{entry.user?.name ?? 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{entry.user?.email}</p>
                        </div>
                        <span className="text-sm font-semibold">{entry.count} referral{entry.count !== 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* List */}
      {view === 'list' && (
        <div className="space-y-4">
          {listLoading ? (
            <p className="text-center text-sm text-muted-foreground py-12">Loading…</p>
          ) : !referrals?.items.length ? (
            <div className="border border-border rounded-lg px-4 py-12 text-center">
              <Gift className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="font-medium">No referrals yet</p>
            </div>
          ) : (
            <>
              <div className="border border-border rounded-lg overflow-hidden">
                {referrals.items.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{r.referrer.name}</span>
                        <span className="text-muted-foreground"> referred </span>
                        <span className="font-medium">{r.referred.name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Code: <span className="font-mono">{r.code}</span>
                        {' · '}{fmt.format(new Date(r.createdAt))}
                      </p>
                    </div>
                    {r.rewardGranted ? (
                      <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Rewarded
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => creditMutation.mutate(r.id)}
                        disabled={creditMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded hover:bg-highlight disabled:opacity-50"
                      >
                        <Gift className="w-3.5 h-3.5" /> Credit reward
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {(referrals.pages ?? 1) > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1 text-sm border border-border rounded disabled:opacity-40 hover:bg-highlight">← Prev</button>
                  <span className="text-sm text-muted-foreground">Page {page} of {referrals.pages}</span>
                  <button type="button" onClick={() => setPage((p) => Math.min(referrals.pages, p + 1))} disabled={page === referrals.pages}
                    className="px-3 py-1 text-sm border border-border rounded disabled:opacity-40 hover:bg-highlight">Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
