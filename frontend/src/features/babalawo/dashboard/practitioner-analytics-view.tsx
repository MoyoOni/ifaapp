import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, Star, DollarSign, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface PractitionerAnalyticsViewProps {
  userId: string;
}

type Period = '7d' | '30d' | '90d';

const PERIOD_LABELS: Record<Period, string> = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
};

const PractitionerAnalyticsView: React.FC<PractitionerAnalyticsViewProps> = ({ userId }) => {
  const [period, setPeriod] = useState<Period>('30d');

  const { data, isLoading } = useQuery({
    queryKey: ['babalawo-analytics', userId, period],
    queryFn: () =>
      api.get(`/dashboard/babalawo/${userId}/analytics`, { params: { period } }).then(r => r.data),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(v);

  const STAR_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-highlight" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp size={24} className="text-highlight" /> Analytics
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Track your practice performance over time</p>
        </div>
        <div className="flex bg-muted p-1 rounded-xl">
          {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
            <button
              type="button"
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${period === p ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Users size={16} /> Total Clients
          </div>
          <p className="text-3xl font-bold text-foreground">{data?.totalClients ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">{data?.repeatClientRate ?? 0}% repeat</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <TrendingUp size={16} /> Consultations
          </div>
          <p className="text-3xl font-bold text-foreground">
            {data?.consultationTrend?.reduce((s: number, w: any) => s + w.consultations, 0) ?? 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">in selected period</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <DollarSign size={16} /> Income
          </div>
          <p className="text-3xl font-bold text-foreground">
            {formatCurrency(data?.incomeTrend?.reduce((s: number, w: any) => s + w.income, 0) ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">from escrow releases</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Star size={16} /> Avg Rating
          </div>
          <p className="text-3xl font-bold text-foreground">{data?.averageRating ?? '–'}</p>
          <p className="text-xs text-muted-foreground mt-1">{data?.totalReviews ?? 0} reviews total</p>
        </div>
      </div>

      {/* Consultation volume chart */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">Consultation Volume by Week</h3>
        {data?.consultationTrend?.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.consultationTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--foreground)' }}
              />
              <Bar dataKey="consultations" name="Total" fill="#d97706" radius={[6, 6, 0, 0]} />
              <Bar dataKey="completed" name="Completed" fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
            No consultation data for this period
          </div>
        )}
      </div>

      {/* Income trend chart */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">Income Trend</h3>
        {data?.incomeTrend?.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.incomeTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number | string | undefined) => [formatCurrency(Number(v ?? 0)), 'Income']}
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--foreground)' }}
              />
              <Line type="monotone" dataKey="income" stroke="#d97706" strokeWidth={2.5} dot={{ fill: '#d97706', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
            No income data for this period
          </div>
        )}
      </div>

      {/* Rating breakdown */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">Rating Breakdown</h3>
        {data?.ratingBreakdown ? (
          <div className="space-y-3">
            {[...data.ratingBreakdown].reverse().map((r: { stars: number; count: number }) => {
              const max = Math.max(...data.ratingBreakdown.map((x: any) => x.count), 1);
              return (
                <div key={r.stars} className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground w-6 text-right">{r.stars}★</span>
                  <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(r.count / max) * 100}%`,
                        background: STAR_COLORS[r.stars - 1],
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-6">{r.count}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No reviews yet</p>
        )}
      </div>
    </div>
  );
};

export default PractitionerAnalyticsView;
