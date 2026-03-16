import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, DollarSign, TrendingUp, Calendar, Loader2 } from 'lucide-react';
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
    case 'paid': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'refunded': return 'bg-red-100 text-red-800';
    default: return 'bg-stone-100 text-stone-800';
  }
};

const EarningsReportView: React.FC = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  const { data, isLoading } = useQuery<{ transactions?: unknown[] }>({
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900">Earnings Report</h1>
          <p className="text-stone-600 text-lg">Track your income and financial performance.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-500 text-sm font-bold uppercase tracking-wider">Total Earnings</p>
              <h3 className="text-2xl font-bold text-stone-900 mt-1">{formatCurrency(totalEarnings)}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-xl text-green-700"><DollarSign size={24} /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-500 text-sm font-bold uppercase tracking-wider">Sessions</p>
              <h3 className="text-2xl font-bold text-stone-900 mt-1">{transactions.length}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl text-blue-700"><Calendar size={24} /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-500 text-sm font-bold uppercase tracking-wider">Avg Per Session</p>
              <h3 className="text-2xl font-bold text-stone-900 mt-1">{formatCurrency(avgPerSession)}</h3>
            </div>
            <div className="bg-purple-100 p-3 rounded-xl text-purple-700"><TrendingUp size={24} /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-500 text-sm font-bold uppercase tracking-wider">Pending</p>
              <h3 className="text-2xl font-bold text-stone-900 mt-1">
                {formatCurrency(transactions.filter(t => t.status === 'pending').reduce((s, t) => s + t.amount, 0))}
              </h3>
            </div>
            <div className="bg-orange-100 p-3 rounded-xl text-orange-700"><BarChart size={24} /></div>
          </div>
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-stone-900">Earnings History</h2>
          <div className="flex gap-2">
            {(['week', 'month', 'year'] as const).map(range => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeRange === range ? 'bg-highlight text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Earnings Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <h2 className="text-xl font-bold text-stone-900">Recent Earnings</h2>
          <p className="text-stone-500 mt-1">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</p>
        </div>

        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-lg font-bold text-stone-900 mb-2">No earnings for this period</h3>
            <p className="text-stone-500">Your earnings will appear here once you complete sessions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {transactions.map(earning => (
                  <tr key={earning.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-800">
                      {earning.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-stone-900">{earning.clientName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">{earning.sessionType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-stone-900">{formatCurrency(earning.amount)}</td>
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
