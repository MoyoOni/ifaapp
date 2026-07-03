import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, ShoppingBag, DollarSign, Clock,
  RotateCcw, AlertTriangle, UserMinus, RefreshCw,
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/shared/components/ui/button';

interface RevenueChartData {
  month: string;
  revenue: number;
}

interface FinancialMetrics {
  mrr: number;
  totalGmv: number;
  platformRevenue: number;
  pendingPayouts: number;
  refundsIssuedThisMonth: number;
  failedPaymentsThisMonth: number;
  subscriptionChurnThisMonth: number;
}

interface FinancialCommandCentreData {
  metrics: FinancialMetrics;
  revenueChart: RevenueChartData[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const MetricCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent: string;
}> = ({ label, value, sub, icon: Icon, accent }) => (
  <div className={`bg-card border border-border rounded-2xl p-5 flex items-start gap-4`}>
    <div className={`p-2.5 rounded-xl ${accent}`}>
      <Icon size={20} />
    </div>
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-foreground mt-0.5 truncate">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  </div>
);

const FinancialCommandCentreTab: React.FC = () => {
  const { data, isLoading, isError, refetch, isFetching } = useQuery<FinancialCommandCentreData>({
    queryKey: ['admin', 'financial-command-centre'],
    queryFn: async () => {
      const res = await api.get('/admin/financial-command-centre');
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 min — financial data doesn't need to be live
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
        <RefreshCw size={28} className="mx-auto mb-3 animate-spin opacity-50" />
        Loading financial data…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-card rounded-2xl border border-border p-12 text-center">
        <AlertTriangle size={28} className="mx-auto mb-3 text-destructive" />
        <p className="text-foreground font-medium mb-4">Failed to load financial data</p>
        <Button variant="outline" onClick={() => refetch()}>Try again</Button>
      </div>
    );
  }

  const { metrics, revenueChart } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Financial Command Centre</h2>
          <p className="text-sm text-muted-foreground mt-0.5">All money on the platform, one screen</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw size={14} className={`mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Primary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="MRR"
          value={fmt(metrics.mrr)}
          sub="Monthly Recurring Revenue"
          icon={TrendingUp}
          accent="bg-blue-500/10 text-blue-500"
        />
        <MetricCard
          label="Total GMV"
          value={fmt(metrics.totalGmv)}
          sub="Consultations + Marketplace"
          icon={ShoppingBag}
          accent="bg-green-500/10 text-green-500"
        />
        <MetricCard
          label="Platform Revenue"
          value={fmt(metrics.platformRevenue)}
          sub="Commission cut"
          icon={DollarSign}
          accent="bg-highlight/10 text-highlight"
        />
        <MetricCard
          label="Pending Payouts"
          value={fmt(metrics.pendingPayouts)}
          sub="Awaiting approval"
          icon={Clock}
          accent="bg-yellow-500/10 text-yellow-500"
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Refunds This Month"
          value={fmt(metrics.refundsIssuedThisMonth)}
          icon={RotateCcw}
          accent="bg-red-500/10 text-red-500"
        />
        <MetricCard
          label="Failed Payments"
          value={fmt(metrics.failedPaymentsThisMonth)}
          sub="This month"
          icon={AlertTriangle}
          accent="bg-orange-500/10 text-orange-500"
        />
        <MetricCard
          label="Subscription Churn"
          value={String(metrics.subscriptionChurnThisMonth)}
          sub="Cancellations this month"
          icon={UserMinus}
          accent="bg-indigo-500/10 text-indigo-500"
        />
      </div>

      {/* 6-month revenue chart */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-base font-semibold text-foreground mb-6">6-Month Revenue Trend</h3>
        {revenueChart.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            No revenue data available yet
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueChart} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  width={60}
                />
                <Tooltip
                  formatter={(value) => fmt(value as number)}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.75rem',
                    color: 'hsl(var(--foreground))',
                    fontSize: 13,
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--highlight, 221 83% 53%))"
                  strokeWidth={2}
                  dot={{ r: 4, fill: 'hsl(var(--highlight, 221 83% 53%))' }}
                  activeDot={{ r: 6 }}
                  name="Revenue (₦)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialCommandCentreTab;
