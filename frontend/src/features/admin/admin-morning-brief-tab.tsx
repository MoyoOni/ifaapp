import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, DollarSign, AlertTriangle, Shield,
  MessageSquare, TrendingUp, TrendingDown, Minus,
  RefreshCw, CheckCircle, Clock, Flag, Gavel,
  CreditCard, Activity,
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MorningBrief {
  signups: {
    today: number;
    yesterday: number;
    trend: number | null; // % change
  };
  pendingActions: {
    verifications: number;
    withdrawals: number;
    reports: number;
    disputes: number;
    total: number;
  };
  revenue: {
    today: number;
    week: number;
    month: number;
  };
  recentThreads: {
    id: string;
    title: string;
    createdAt: string;
    author: { id: string; name: string; avatar?: string };
    hasReport: boolean;
  }[];
  platformHealth: {
    database: 'ok' | 'degraded' | 'down';
    api: 'ok' | 'degraded' | 'down';
  };
  generatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const timeAgo = (dateStr: string) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: string;
  badge?: { label: string; variant: 'destructive' | 'secondary' | 'outline' };
}> = ({ label, value, sub, icon: Icon, accent, badge }) => (
  <div className="bg-card border border-border rounded-2xl p-5 flex items-start gap-4">
    <div className={`p-2.5 rounded-xl shrink-0 ${accent}`}>
      <Icon size={20} />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-foreground mt-0.5">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
    {badge && <Badge variant={badge.variant} className="shrink-0 self-start mt-1">{badge.label}</Badge>}
  </div>
);

const ActionCard: React.FC<{
  label: string;
  count: number;
  icon: React.ElementType;
  urgency: 'high' | 'medium' | 'low';
  onNavigate?: () => void;
}> = ({ label, count, icon: Icon, urgency, onNavigate }) => {
  const colors = {
    high: 'border-red-500/30 bg-red-500/5',
    medium: 'border-yellow-500/30 bg-yellow-500/5',
    low: 'border-border bg-background',
  };
  const dotColors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-muted-foreground',
  };

  return (
    <button
      type="button"
      onClick={onNavigate}
      disabled={!onNavigate}
      className={`w-full text-left border rounded-xl p-4 flex items-center gap-3 transition-colors ${colors[urgency]} ${onNavigate ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}
    >
      <Icon size={18} className="text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {count > 0 && <div className={`w-2 h-2 rounded-full ${dotColors[urgency]}`} />}
        <span className={`text-lg font-bold ${count > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{count}</span>
      </div>
    </button>
  );
};

const HealthDot: React.FC<{ status: 'ok' | 'degraded' | 'down'; label: string }> = ({ status, label }) => {
  const colors = { ok: 'bg-green-500', degraded: 'bg-yellow-500', down: 'bg-red-500' };
  const labels = { ok: 'Healthy', degraded: 'Degraded', down: 'Down' };
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${colors[status]} ${status === 'ok' ? '' : 'animate-pulse'}`} />
      <span className="text-sm text-foreground font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{labels[status]}</span>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface AdminMorningBriefTabProps {
  onNavigate?: (tab: string) => void;
}

const AdminMorningBriefTab: React.FC<AdminMorningBriefTabProps> = ({ onNavigate }) => {
  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } = useQuery<MorningBrief>({
    queryKey: ['admin', 'morning-brief'],
    queryFn: async () => {
      const res = await api.get('/admin/morning-brief');
      return res.data;
    },
    staleTime: 2 * 60 * 1000, // refresh every 2 min
    refetchInterval: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
        <RefreshCw size={28} className="mx-auto mb-3 animate-spin opacity-50" />
        Loading morning brief…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-card rounded-2xl border border-border p-12 text-center">
        <AlertTriangle size={28} className="mx-auto mb-3 text-destructive" />
        <p className="text-foreground font-medium mb-4">Failed to load morning brief</p>
        <Button variant="outline" onClick={() => refetch()}>Try again</Button>
      </div>
    );
  }

  const { signups, pendingActions, revenue, recentThreads, platformHealth } = data;
  const allClear = pendingActions.total === 0;
  const lastUpdated = dataUpdatedAt ? timeAgo(new Date(dataUpdatedAt).toISOString()) : null;

  const signupTrend = signups.trend;
  const TrendIcon = signupTrend === null ? Minus : signupTrend > 0 ? TrendingUp : TrendingDown;
  const trendColor = signupTrend === null ? 'text-muted-foreground' : signupTrend > 0 ? 'text-green-500' : 'text-red-500';
  const trendLabel = signupTrend === null ? 'No data yesterday'
    : signupTrend > 0 ? `+${signupTrend.toFixed(0)}% vs yesterday`
    : `${signupTrend.toFixed(0)}% vs yesterday`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Morning Brief</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground hidden sm:block">Updated {lastUpdated}</span>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={14} className={`mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* All-clear banner or alert banner */}
      {allClear ? (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">All clear — no pending actions</p>
            <p className="text-xs text-muted-foreground mt-0.5">Nothing requires your attention right now. Have a good day.</p>
          </div>
        </div>
      ) : (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-500 shrink-0 animate-pulse" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {pendingActions.total} action{pendingActions.total !== 1 ? 's' : ''} require{pendingActions.total === 1 ? 's' : ''} your attention
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Review the pending items below.</p>
          </div>
        </div>
      )}

      {/* Primary stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Signups Today"
          value={signups.today}
          sub={trendLabel}
          icon={Users}
          accent="bg-blue-500/10 text-blue-500"
          badge={signupTrend !== null && signupTrend > 20 ? { label: 'Spike', variant: 'secondary' } : undefined}
        />
        <StatCard
          label="Revenue Today"
          value={fmt(revenue.today)}
          sub={`₦${(revenue.week / 1000).toFixed(0)}k this week`}
          icon={DollarSign}
          accent="bg-green-500/10 text-green-500"
        />
        <StatCard
          label="Revenue This Month"
          value={fmt(revenue.month)}
          icon={TrendingUp}
          accent="bg-highlight/10 text-highlight"
        />
        <StatCard
          label="Pending Actions"
          value={pendingActions.total}
          sub={pendingActions.total > 0 ? 'Needs attention' : 'All clear'}
          icon={AlertTriangle}
          accent={pendingActions.total > 0 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}
          badge={pendingActions.total > 0 ? { label: 'Action needed', variant: 'destructive' } : undefined}
        />
      </div>

      {/* Pending actions + recent posts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending actions */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock size={16} className="text-muted-foreground" />
            Action Required
          </h3>
          <div className="space-y-2">
            <ActionCard
              label="Verification Applications"
              count={pendingActions.verifications}
              icon={Shield}
              urgency={pendingActions.verifications > 5 ? 'high' : pendingActions.verifications > 0 ? 'medium' : 'low'}
              onNavigate={pendingActions.verifications > 0 ? () => onNavigate?.('verification') : undefined}
            />
            <ActionCard
              label="Payout Approvals"
              count={pendingActions.withdrawals}
              icon={CreditCard}
              urgency={pendingActions.withdrawals > 3 ? 'high' : pendingActions.withdrawals > 0 ? 'medium' : 'low'}
              onNavigate={pendingActions.withdrawals > 0 ? () => onNavigate?.('withdrawals') : undefined}
            />
            <ActionCard
              label="Reported Content"
              count={pendingActions.reports}
              icon={Flag}
              urgency={pendingActions.reports > 0 ? 'medium' : 'low'}
              onNavigate={pendingActions.reports > 0 ? () => onNavigate?.('forum-reports') : undefined}
            />
            <ActionCard
              label="Open Disputes"
              count={pendingActions.disputes}
              icon={Gavel}
              urgency={pendingActions.disputes > 0 ? 'high' : 'low'}
              onNavigate={pendingActions.disputes > 0 ? () => onNavigate?.('disputes') : undefined}
            />
          </div>
        </div>

        {/* Recent forum activity */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare size={16} className="text-muted-foreground" />
            Latest Forum Posts
          </h3>
          {recentThreads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No recent posts</div>
          ) : (
            <div className="space-y-3">
              {recentThreads.map((thread) => (
                <div
                  key={thread.id}
                  className={`flex items-start gap-3 p-3 rounded-xl ${thread.hasReport ? 'bg-red-500/5 border border-red-500/20' : 'bg-background border border-border'}`}
                >
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 overflow-hidden">
                    {thread.author.avatar
                      ? <img src={thread.author.avatar} alt="" className="w-full h-full object-cover" />
                      : thread.author.name.charAt(0).toUpperCase()
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{thread.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span>{thread.author.name}</span>
                      <span>·</span>
                      <span>{timeAgo(thread.createdAt)}</span>
                      {thread.hasReport && (
                        <>
                          <span>·</span>
                          <span className="text-red-500 font-medium flex items-center gap-0.5">
                            <Flag size={10} /> Reported
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => onNavigate?.('forum-reports')}
            className="mt-4 text-xs text-highlight hover:underline w-full text-center"
          >
            View all forum reports →
          </button>
        </div>
      </div>

      {/* Platform health */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity size={16} className="text-muted-foreground" />
          Platform Health
        </h3>
        <div className="flex flex-wrap gap-6">
          <HealthDot status={platformHealth.database} label="Database" />
          <HealthDot status={platformHealth.api} label="API" />
          <HealthDot status="ok" label="CDN" />
        </div>
        <button
          type="button"
          onClick={() => onNavigate?.('health')}
          className="mt-4 text-xs text-highlight hover:underline"
        >
          View full platform health report →
        </button>
      </div>

      {/* Signup trend inline */}
      <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
        <div className={`p-2.5 rounded-xl shrink-0 ${trendColor === 'text-green-500' ? 'bg-green-500/10' : trendColor === 'text-red-500' ? 'bg-red-500/10' : 'bg-muted'}`}>
          <TrendIcon size={20} className={trendColor} />
        </div>
        <div>
          <div className="text-sm font-medium text-foreground">Signup momentum</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {signups.today} today vs {signups.yesterday} yesterday — {trendLabel}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate?.('analytics')}
          className="ml-auto text-xs text-highlight hover:underline shrink-0"
        >
          Full analytics →
        </button>
      </div>
    </div>
  );
};

export default AdminMorningBriefTab;
