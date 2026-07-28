// Whole-app audit note: this tab and trust-score-management-tab.tsx both
// edit trust scores against the same PATCH /admin/trust-scores/override/:userId
// endpoint. Not a bug -- deliberately different views, not consolidated:
// this one is single-user search + full audit/override history; the other
// is the bulk list + per-row override dialog.
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Search, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';

interface ScoreBreakdown { component: string; value: string | number; points: number }
interface AuditEntry { id: string; action: string; newValues: any; createdAt: string; user: { name: string } }
interface AuditData {
  user: { id: string; name: string; email: string; trustScore: number; trustScoreOverride: number | null; trustScoreOverrideReason: string | null; trustScoreOverrideBy: string | null; trustScoreOverrideAt: string | null };
  breakdown: ScoreBreakdown[];
  auditEntries: AuditEntry[];
}

export default function AdminTrustScoreAuditTab() {
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState('');
  const [searchId, setSearchId] = useState('');
  const [override, setOverride] = useState('');
  const [reason, setReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const { data, isLoading } = useQuery<AuditData>({
    queryKey: ['admin', 'trust-audit', searchId],
    queryFn: () => api.get(`/admin/trust-scores/audit/${searchId}`).then(r => r.data),
    enabled: !!searchId,
  });

  const { data: history } = useQuery<AuditEntry[]>({
    queryKey: ['admin', 'trust-history', searchId],
    queryFn: () => api.get(`/admin/trust-scores/override-history/${searchId}`).then(r => r.data),
    enabled: !!searchId && showHistory,
  });

  const applyOverride = useMutation({
    mutationFn: () => api.patch(`/admin/trust-scores/override/${searchId}`, {
      override: override === '' ? null : Number(override),
      reason,
    }),
    onSuccess: () => {
      success('Trust score override applied');
      queryClient.invalidateQueries({ queryKey: ['admin', 'trust-audit', searchId] });
      setOverride(''); setReason('');
    },
    onError: () => error('Failed to apply override'),
  });

  const totalPoints = data?.breakdown.reduce((s, b) => s + b.points, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Search className="w-4 h-4" /> Look Up Trust Score
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="User ID"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            aria-label="User ID for trust score lookup"
            className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => setSearchId(userId.trim())}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            Search
          </button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {data && (
        <>
          {/* User summary */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-foreground">{data.user.name}</p>
                <p className="text-xs text-muted-foreground">{data.user.email}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-foreground">{data.user.trustScore ?? totalPoints}</p>
                <p className="text-xs text-muted-foreground">Trust Score</p>
                {data.user.trustScoreOverride !== null && (
                  <p className="text-xs text-yellow-500">Override: {data.user.trustScoreOverride}</p>
                )}
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-2">
              {data.breakdown.map(b => (
                <div key={b.component} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{b.component}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-foreground">{b.value}</span>
                    <span className="w-16 text-right font-mono text-xs text-primary">+{b.points}pts</span>
                  </div>
                </div>
              ))}
              <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
                <span>Computed total</span>
                <span className="text-primary">{totalPoints} pts</span>
              </div>
            </div>
          </div>

          {/* Override */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Manual Override
            </h3>
            {data.user.trustScoreOverrideReason && (
              <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-600 dark:text-yellow-400">
                Current override: <strong>{data.user.trustScoreOverride}</strong> — "{data.user.trustScoreOverrideReason}"
              </div>
            )}
            <div className="space-y-2">
              <input
                type="number"
                placeholder="Override value (blank to remove)"
                value={override}
                onChange={e => setOverride(e.target.value)}
                aria-label="Override score value"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="Reason (required)"
                value={reason}
                onChange={e => setReason(e.target.value)}
                aria-label="Override reason"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => applyOverride.mutate()}
                disabled={!reason.trim() || applyOverride.isPending}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {applyOverride.isPending ? 'Applying…' : 'Apply Override'}
              </button>
            </div>
          </div>

          {/* Override history */}
          <div className="bg-card border border-border rounded-xl p-4">
            <button
              type="button"
              onClick={() => setShowHistory(h => !h)}
              className="flex items-center justify-between w-full text-sm font-semibold text-foreground"
            >
              <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Override History</span>
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showHistory && history && (
              <div className="mt-3 space-y-2">
                {history.map(e => (
                  <div key={e.id} className="text-xs border-b border-border/50 pb-2 last:border-0">
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Override → {e.newValues?.override ?? 'removed'}</span>
                      <span className="text-muted-foreground">{new Date(e.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5">"{e.newValues?.reason}" — by {e.user?.name}</p>
                  </div>
                ))}
                {!history.length && <p className="text-muted-foreground text-sm">No override history.</p>}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
