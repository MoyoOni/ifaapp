import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Crown, Users, TrendingUp, DollarSign, Calendar, Loader2, AlertCircle, Gift, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

interface SubscriptionStats {
  totalDevoted: number;
  quarterlyCount: number;
  annualCount: number;
  mrr: number; // monthly recurring revenue in kobo → display as Naira
  arr: number; // annual recurring revenue in kobo
  newThisMonth: number;
  cancelledThisMonth: number;
  churnRate: number; // percentage
  recentSubscribers: {
    id: string;
    name: string;
    email: string;
    plan: string;
    startDate: string;
    endDate: string;
    status: string;
  }[];
}

const fmt = (kobo: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(kobo / 100);

const AdminSubscriptionTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [grantUserId, setGrantUserId] = useState('');
  const [grantPlan, setGrantPlan] = useState<'QUARTERLY' | 'ANNUAL'>('QUARTERLY');
  const [grantReason, setGrantReason] = useState('');
  const [grantSuccess, setGrantSuccess] = useState(false);

  const { data, isLoading, isError } = useQuery<SubscriptionStats>({
    queryKey: ['admin-subscription-stats'],
    queryFn: () => api.get('/admin/subscription-stats').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const grantMutation = useMutation({
    mutationFn: () => api.post('/subscriptions/admin/grant', { userId: grantUserId, plan: grantPlan, reason: grantReason || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-stats'] });
      setGrantSuccess(true);
      setGrantUserId('');
      setGrantReason('');
      setTimeout(() => setGrantSuccess(false), 3000);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <AlertCircle size={32} className="mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Could not load subscription stats.</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Devoted', value: data.totalDevoted, icon: Crown, color: 'text-amber-500' },
    { label: 'Quarterly', value: data.quarterlyCount, icon: Calendar, color: 'text-blue-500' },
    { label: 'Annual', value: data.annualCount, icon: TrendingUp, color: 'text-green-500' },
    { label: 'New this month', value: data.newThisMonth, icon: Users, color: 'text-purple-500' },
    { label: 'MRR', value: fmt(data.mrr), icon: DollarSign, color: 'text-emerald-500' },
    { label: 'ARR', value: fmt(data.arr), icon: DollarSign, color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Crown size={22} className="text-amber-500" />
        <h2 className="text-xl font-bold text-foreground">Devoted Subscriptions</h2>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={16} className={s.color} />
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Churn */}
      <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Churn this month</p>
          <p className="text-xs text-muted-foreground">{data.cancelledThisMonth} cancellations</p>
        </div>
        <span className={`text-2xl font-bold ${data.churnRate > 5 ? 'text-red-500' : 'text-green-500'}`}>
          {data.churnRate.toFixed(1)}%
        </span>
      </div>

      {/* Manual grant */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Gift size={16} className="text-amber-500" /> Grant Devoted Access
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Manually activate Devoted for a user — comps, gifts, influencer partnerships, etc. No charge applied.</p>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="User ID (UUID)"
            value={grantUserId}
            onChange={e => setGrantUserId(e.target.value)}
            className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
          <div className="flex gap-2">
            <select
              aria-label="Plan"
              value={grantPlan}
              onChange={e => setGrantPlan(e.target.value as 'QUARTERLY' | 'ANNUAL')}
              className="flex-1 bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="QUARTERLY">Quarterly (3 months)</option>
              <option value="ANNUAL">Annual (12 months)</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Reason (optional — shown to user)"
            value={grantReason}
            onChange={e => setGrantReason(e.target.value)}
            className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
          {grantSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
              <CheckCircle size={14} /> Devoted access granted successfully.
            </div>
          )}
          <button
            type="button"
            onClick={() => grantMutation.mutate()}
            disabled={!grantUserId.trim() || grantMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors disabled:opacity-50"
          >
            {grantMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Crown size={14} />}
            Grant Devoted Access
          </button>
        </div>
      </div>

      {/* Recent subscribers */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-bold text-foreground mb-4">Recent Subscribers</h3>
        {data.recentSubscribers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No subscribers yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {data.recentSubscribers.map((sub) => (
              <div key={sub.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-foreground">{sub.name}</p>
                  <p className="text-xs text-muted-foreground">{sub.email}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                    {sub.plan === 'ANNUAL' ? 'Annual' : 'Quarterly'}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ends {new Date(sub.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSubscriptionTab;
