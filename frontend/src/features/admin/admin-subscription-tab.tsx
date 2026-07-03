import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Crown, Users, TrendingUp, DollarSign, Calendar, Loader2,
  AlertCircle, Gift, CheckCircle, ChevronDown, ChevronUp,
  XCircle, RefreshCw, AlertTriangle, Bell,
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { useToast } from '@/shared/components/toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubscriptionStats {
  totalDevoted: number;
  quarterlyCount: number;
  annualCount: number;
  mrr: number;
  arr: number;
  newThisMonth: number;
  cancelledThisMonth: number;
  churnRate: number;
}

interface Subscriber {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string | null;
  plan: string;
  status: string;
  amountPaid: number;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paystackRef?: string | null;
}

interface CancelledSubscriber {
  id: string;
  userId: string;
  name: string;
  email: string;
  plan: string;
  endDate: string;
  cancelledAt: string;
}

interface FailedSubscriber {
  id: string;
  userId: string;
  name: string;
  email: string;
  plan: string;
  endDate: string;
  failedAt: string;
}

type ActiveView = 'overview' | 'active' | 'churn' | 'failed';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (kobo: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(kobo / 100);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// ─── Subscriber Row ───────────────────────────────────────────────────────────

const SubscriberRow: React.FC<{
  sub: Subscriber;
  onCancel: (id: string, reason: string) => void;
  onExtend: (id: string, months: number, reason: string) => void;
  processing: boolean;
}> = ({ sub, onCancel, onExtend, processing }) => {
  const [expanded, setExpanded] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [extendMonths, setExtendMonths] = useState('1');
  const [extendReason, setExtendReason] = useState('');

  const isPastDue = sub.status === 'PAST_DUE';

  return (
    <div className={`border rounded-xl overflow-hidden ${isPastDue ? 'border-red-500/30 bg-red-500/5' : 'border-border bg-background'}`}>
      <button
        type="button"
        className="w-full text-left p-4 flex items-center gap-4"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
          {sub.avatar
            ? <img src={sub.avatar} alt="" className="w-full h-full object-cover" />
            : sub.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-foreground">{sub.name}</span>
            <Badge variant={isPastDue ? 'destructive' : 'outline'} className="text-xs">
              {sub.plan === 'ANNUAL' ? 'Annual' : 'Quarterly'}
            </Badge>
            {isPastDue && (
              <Badge variant="destructive" className="text-xs">Past Due</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sub.email} · Expires {fmtDate(sub.endDate)} · {fmt(sub.amountPaid)}
          </p>
        </div>
        <div className="shrink-0 text-muted-foreground">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border p-4 space-y-4 bg-card">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div><p className="text-muted-foreground mb-0.5">Started</p><p className="font-medium text-foreground">{fmtDate(sub.startDate)}</p></div>
            <div><p className="text-muted-foreground mb-0.5">Expires</p><p className="font-medium text-foreground">{fmtDate(sub.endDate)}</p></div>
            <div><p className="text-muted-foreground mb-0.5">Auto-renew</p><p className={`font-medium ${sub.autoRenew ? 'text-green-600' : 'text-muted-foreground'}`}>{sub.autoRenew ? 'Yes' : 'No'}</p></div>
            <div><p className="text-muted-foreground mb-0.5">Ref</p><p className="font-mono text-foreground truncate">{sub.paystackRef ?? '—'}</p></div>
          </div>

          {/* Cancel */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Cancel Subscription</p>
            <div className="flex gap-2">
              <Input
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Reason (e.g. user request via email)"
                className="text-sm h-8 flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={processing}
                onClick={() => onCancel(sub.id, cancelReason)}
                className="text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0"
              >
                <XCircle size={14} className="mr-1.5" />
                Cancel
              </Button>
            </div>
          </div>

          {/* Extend */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Extend / Gift Months</p>
            <div className="flex gap-2">
              <select
                aria-label="Months to extend"
                value={extendMonths}
                onChange={e => setExtendMonths(e.target.value)}
                className="bg-muted/40 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary w-28 shrink-0"
              >
                {[1, 2, 3, 6, 12].map(m => (
                  <option key={m} value={m}>{m} month{m !== 1 ? 's' : ''}</option>
                ))}
              </select>
              <Input
                value={extendReason}
                onChange={e => setExtendReason(e.target.value)}
                placeholder="Reason (e.g. bad experience, gift)"
                className="text-sm h-8 flex-1"
              />
              <Button
                size="sm"
                disabled={processing}
                onClick={() => onExtend(sub.id, parseInt(extendMonths), extendReason)}
                className="bg-green-600 hover:bg-green-700 text-white shrink-0"
              >
                <Gift size={14} className="mr-1.5" />
                Extend
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Tab ─────────────────────────────────────────────────────────────────

const AdminSubscriptionTab: React.FC = () => {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const [view, setView] = useState<ActiveView>('overview');
  const [grantUserId, setGrantUserId] = useState('');
  const [grantPlan, setGrantPlan] = useState<'QUARTERLY' | 'ANNUAL'>('QUARTERLY');
  const [grantReason, setGrantReason] = useState('');
  const [grantSuccess, setGrantSuccess] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<SubscriptionStats>({
    queryKey: ['admin-subscription-stats'],
    queryFn: () => api.get('/admin/subscription-stats').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: activeList = [], isLoading: activeLoading, refetch: refetchActive } = useQuery<Subscriber[]>({
    queryKey: ['admin', 'subscriptions', 'active'],
    queryFn: () => api.get('/admin/subscriptions/active').then(r => r.data),
    enabled: view === 'active',
    staleTime: 2 * 60 * 1000,
  });

  const { data: cancelledList = [], isLoading: cancelledLoading } = useQuery<CancelledSubscriber[]>({
    queryKey: ['admin', 'subscriptions', 'cancelled'],
    queryFn: () => api.get('/admin/subscriptions/cancelled').then(r => r.data),
    enabled: view === 'churn',
    staleTime: 2 * 60 * 1000,
  });

  const { data: failedList = [], isLoading: failedLoading, refetch: refetchFailed } = useQuery<FailedSubscriber[]>({
    queryKey: ['admin', 'subscriptions', 'failed'],
    queryFn: () => api.get('/admin/subscriptions/failed-payments').then(r => r.data),
    enabled: view === 'failed',
    staleTime: 2 * 60 * 1000,
  });

  const { mutate: cancelSub, isPending: cancelling } = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/admin/subscriptions/${id}/cancel`, { reason }),
    onSuccess: () => {
      success('Subscription cancelled');
      qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      qc.invalidateQueries({ queryKey: ['admin-subscription-stats'] });
    },
    onError: (err: any) => toastError(err?.response?.data?.message ?? 'Cancel failed'),
  });

  const { mutate: extendSub, isPending: extending } = useMutation({
    mutationFn: ({ id, months, reason }: { id: string; months: number; reason: string }) =>
      api.post(`/admin/subscriptions/${id}/extend`, { months, reason }),
    onSuccess: () => {
      success('Subscription extended');
      qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
    },
    onError: (err: any) => toastError(err?.response?.data?.message ?? 'Extend failed'),
  });

  const { mutate: sendReminder, isPending: reminding } = useMutation({
    mutationFn: (id: string) => api.post(`/admin/subscriptions/${id}/send-payment-reminder`),
    onSuccess: () => success('Payment reminder sent'),
    onError: (err: any) => toastError(err?.response?.data?.message ?? 'Failed to send reminder'),
  });

  const { mutate: grantAccess, isPending: granting } = useMutation({
    mutationFn: () => api.post('/subscriptions/admin/grant', { userId: grantUserId, plan: grantPlan, reason: grantReason || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-subscription-stats'] });
      setGrantSuccess(true);
      setGrantUserId('');
      setGrantReason('');
      setTimeout(() => setGrantSuccess(false), 3000);
    },
    onError: (err: any) => toastError(err?.response?.data?.message ?? 'Grant failed'),
  });

  const processing = cancelling || extending;

  const views: { id: ActiveView; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'active', label: 'Active Subscribers' },
    { id: 'churn', label: 'Churn (This Month)' },
    { id: 'failed', label: 'Failed Payments' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Crown size={22} className="text-amber-500" />
        <h2 className="text-xl font-bold text-foreground">Devoted Subscriptions</h2>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-2 flex-wrap">
        {views.map(v => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === v.id
                ? 'bg-highlight text-white'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {view === 'overview' && (
        <>
          {statsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-muted-foreground" />
            </div>
          ) : !stats ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <AlertCircle size={28} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">Could not load subscription stats.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Total Devoted', value: stats.totalDevoted, icon: Crown, color: 'text-amber-500' },
                  { label: 'Quarterly', value: stats.quarterlyCount, icon: Calendar, color: 'text-blue-500' },
                  { label: 'Annual', value: stats.annualCount, icon: TrendingUp, color: 'text-green-500' },
                  { label: 'New this month', value: stats.newThisMonth, icon: Users, color: 'text-purple-500' },
                  { label: 'MRR', value: fmt(stats.mrr), icon: DollarSign, color: 'text-emerald-500' },
                  { label: 'ARR', value: fmt(stats.arr), icon: DollarSign, color: 'text-emerald-600' },
                ].map((s) => (
                  <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <s.icon size={16} className={s.color} />
                      <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Churn this month</p>
                  <p className="text-xs text-muted-foreground">{stats.cancelledThisMonth} cancellations</p>
                </div>
                <span className={`text-2xl font-bold ${stats.churnRate > 5 ? 'text-red-500' : 'text-green-500'}`}>
                  {stats.churnRate.toFixed(1)}%
                </span>
              </div>

              {/* Manual grant */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Gift size={16} className="text-amber-500" /> Grant Devoted Access
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Manually activate Devoted for a user — comps, gifts, influencer partnerships, etc. No charge applied.
                </p>
                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="User ID (UUID)"
                    value={grantUserId}
                    onChange={e => setGrantUserId(e.target.value)}
                    className="text-sm"
                  />
                  <select
                    aria-label="Plan"
                    value={grantPlan}
                    onChange={e => setGrantPlan(e.target.value as 'QUARTERLY' | 'ANNUAL')}
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                  >
                    <option value="QUARTERLY">Quarterly (3 months)</option>
                    <option value="ANNUAL">Annual (12 months)</option>
                  </select>
                  <Input
                    type="text"
                    placeholder="Reason (optional — shown to user)"
                    value={grantReason}
                    onChange={e => setGrantReason(e.target.value)}
                    className="text-sm"
                  />
                  {grantSuccess && (
                    <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                      <CheckCircle size={14} /> Devoted access granted successfully.
                    </div>
                  )}
                  <Button
                    onClick={() => grantAccess()}
                    disabled={!grantUserId.trim() || granting}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold"
                  >
                    {granting ? <Loader2 size={14} className="animate-spin mr-2" /> : <Crown size={14} className="mr-2" />}
                    Grant Devoted Access
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Active Subscribers ── */}
      {view === 'active' && (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{activeList.length} active / past-due subscribers</p>
            <Button variant="outline" size="sm" onClick={() => refetchActive()} disabled={activeLoading}>
              <RefreshCw size={14} className={`mr-1.5 ${activeLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          {activeLoading ? (
            <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>
          ) : activeList.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <Crown size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-muted-foreground text-sm">No active subscribers.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeList.map(sub => (
                <SubscriberRow
                  key={sub.id}
                  sub={sub}
                  processing={processing}
                  onCancel={(id, reason) => cancelSub({ id, reason })}
                  onExtend={(id, months, reason) => extendSub({ id, months, reason })}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Churn ── */}
      {view === 'churn' && (
        <>
          <p className="text-sm text-muted-foreground">Subscribers who cancelled this calendar month</p>
          {cancelledLoading ? (
            <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>
          ) : cancelledList.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <CheckCircle size={32} className="mx-auto mb-3 text-green-500 opacity-50" />
              <p className="text-muted-foreground text-sm">No cancellations this month.</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl divide-y divide-border">
              {cancelledList.map(sub => (
                <div key={sub.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-foreground">{sub.name}</p>
                    <p className="text-xs text-muted-foreground">{sub.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-xs">{sub.plan === 'ANNUAL' ? 'Annual' : 'Quarterly'}</Badge>
                    <p className="text-xs text-muted-foreground mt-0.5">Cancelled {fmtDate(sub.cancelledAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Failed Payments ── */}
      {view === 'failed' && (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{failedList.length} subscribers with failed payments</p>
            <Button variant="outline" size="sm" onClick={() => refetchFailed()} disabled={failedLoading}>
              <RefreshCw size={14} className={`mr-1.5 ${failedLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          {failedList.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 flex items-center gap-2 text-sm">
              <AlertTriangle size={16} className="text-yellow-600 shrink-0" />
              <span className="text-foreground font-medium">{failedList.length} subscriber{failedList.length !== 1 ? 's' : ''} with failed payments — send a reminder to recover them</span>
            </div>
          )}
          {failedLoading ? (
            <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>
          ) : failedList.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <CheckCircle size={32} className="mx-auto mb-3 text-green-500 opacity-50" />
              <p className="text-muted-foreground text-sm">No failed payments.</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl divide-y divide-border">
              {failedList.map(sub => (
                <div key={sub.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-foreground">{sub.name}</p>
                    <p className="text-xs text-muted-foreground">{sub.email} · {sub.plan === 'ANNUAL' ? 'Annual' : 'Quarterly'}</p>
                    <p className="text-xs text-muted-foreground">Failed {fmtDate(sub.failedAt)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={reminding}
                    onClick={() => sendReminder(sub.id)}
                  >
                    <Bell size={14} className="mr-1.5" />
                    Remind
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminSubscriptionTab;
