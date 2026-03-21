import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, DollarSign, TrendingUp, Calendar, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';

interface EarningRecord {
  id: string;
  date: Date;
  amount: number;
  clientName: string;
  sessionType: string;
  status: 'paid' | 'pending' | 'refunded';
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
    case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
    case 'refunded': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
    default: return 'bg-muted text-foreground';
  }
};

const EarningsReportView: React.FC = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  const { data, isLoading, isError, refetch } = useQuery<{ transactions?: unknown[] }>({
    queryKey: ['earnings', user?.id, timeRange],
    queryFn: async () => {
      const now = new Date();
      const start = new Date();
      if (timeRange === 'week') start.setDate(now.getDate() - 7);
      else if (timeRange === 'month') start.setMonth(now.getMonth() - 1);
      else start.setFullYear(now.getFullYear() - 1);
      const res = await api.get(`/wallet/${user!.id}/transactions`, {
        params: { type: 'CREDIT', startDate: start.toISOString(), endDate: now.toISOString() },
      });
      return res.data;
    },
    enabled: !!user?.id,
  });

  const transactions: EarningRecord[] = ((data?.transactions ?? []) as Record<string, unknown>[]).map((tx) => ({
    id: tx.id as string,
    date: new Date(tx.createdAt as string),
    amount: tx.amount as number,
    clientName: (tx.description as string) || 'Session Payment',
    sessionType: (tx.type as string) ?? 'Consultation',
    status: (tx.status as string) === 'COMPLETED' ? 'paid' : 'pending',
  }));

  const paid = transactions.filter(t => t.status === 'paid');
  const totalEarnings = paid.reduce((s, t) => s + t.amount, 0);
  const avgPerSession = paid.length > 0 ? totalEarnings / paid.length : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-highlight" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <p className="text-foreground font-medium mb-2">Could not load earnings data</p>
        <p className="text-muted-foreground text-sm mb-6">Check your connection and try again.</p>
        <button type="button" onClick={() => refetch()} className="px-4 py-2 bg-highlight text-white rounded-xl font-medium hover:opacity-90">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-foreground">Earnings Report</h1>
          <p className="text-muted-foreground text-lg">Track your income and financial performance.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-bold uppercase tracking-wider">Total Earnings</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalEarnings)}</h3>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl text-green-700 dark:text-green-400"><DollarSign size={24} /></div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-bold uppercase tracking-wider">Sessions</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{transactions.length}</h3>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl text-blue-700 dark:text-blue-400"><Calendar size={24} /></div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-bold uppercase tracking-wider">Avg Per Session</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{formatCurrency(avgPerSession)}</h3>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl text-purple-700 dark:text-purple-400"><TrendingUp size={24} /></div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-bold uppercase tracking-wider">Pending</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {formatCurrency(transactions.filter(t => t.status === 'pending').reduce((s, t) => s + t.amount, 0))}
              </h3>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl text-orange-700 dark:text-orange-300"><BarChart size={24} /></div>
          </div>
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-foreground">Earnings History</h2>
          <div className="flex gap-2">
            {(['week', 'month', 'year'] as const).map(range => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeRange === range ? 'bg-highlight text-white' : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Earnings Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border/60">
          <h2 className="text-xl font-bold text-foreground">Recent Earnings</h2>
          <p className="text-muted-foreground mt-1">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</p>
        </div>

        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">No earnings for this period</h3>
            <p className="text-muted-foreground">Your earnings will appear here once you complete sessions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {transactions.map(earning => (
                  <tr key={earning.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {earning.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{earning.clientName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{earning.sessionType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-foreground">{formatCurrency(earning.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(earning.status)}`}>
                        {earning.status.charAt(0).toUpperCase() + earning.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EarningsReportView;
