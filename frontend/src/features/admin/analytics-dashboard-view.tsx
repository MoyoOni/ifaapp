import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, DollarSign, Calendar, Package, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface Analytics {
  period: string;
  userGrowth: number;
  transactionVolume: {
    total: number;
    count: number;
  };
  totalRevenue: {
    total: number;
    count: number;
  };
  appointmentStats: Array<{
    status: string;
    _count: number;
  }>;
  prescriptionStats: Array<{
    status: string;
    _count: number;
  }>;
  disputeCount: number;
}

/**
 * Analytics Dashboard View
 * Platform analytics and metrics with configurable time periods
 */
const AnalyticsDashboardView: React.FC = () => {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // Fetch analytics
  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ['admin-analytics', period],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/analytics', {
          params: { period },
        });
        return response.data;
      } catch (error) {
        throw error;
      }
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="md" variant="highlight" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-8">
        <p className="text-stone-500">No analytics data available</p>
      </div>
    );
  }

  const totalAppointments = analytics.appointmentStats.reduce((sum, stat) => sum + stat._count, 0);
  const totalPrescriptions = analytics.prescriptionStats.reduce((sum, stat) => sum + stat._count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-highlight">Analytics Dashboard</h2>
          <p className="text-sm text-stone-500 mt-1">
            Platform metrics and performance indicators
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${period === p
                  ? 'bg-highlight text-white'
                  : 'bg-muted/60 text-stone-500 hover:bg-muted'
                }`}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-blue-400" />
            <TrendingUp className="w-4 h-4 dark:text-green-400 text-green-600" />
          </div>
          <div className="text-2xl font-bold mb-1">{analytics.userGrowth}</div>
          <div className="text-sm text-stone-500">New Users ({period})</div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 dark:text-green-400 text-green-600" />
            <TrendingUp className="w-4 h-4 dark:text-green-400 text-green-600" />
          </div>
          <div className="text-2xl font-bold mb-1">
            {formatCurrency(analytics.transactionVolume.total)}
          </div>
          <div className="text-sm text-stone-500">
            Transaction Volume ({analytics.transactionVolume.count} transactions)
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-highlight" />
            <TrendingUp className="w-4 h-4 dark:text-green-400 text-green-600" />
          </div>
          <div className="text-2xl font-bold mb-1">
            {formatCurrency(analytics.totalRevenue.total)}
          </div>
          <div className="text-sm text-stone-500">
            Total Revenue ({analytics.totalRevenue.count} releases)
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-2xl font-bold mb-1">{analytics.disputeCount}</div>
          <div className="text-sm text-stone-500">Disputes ({period})</div>
        </div>
      </div>

      {/* Appointment Stats */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold">Appointment Statistics</h3>
          <span className="ml-auto text-sm text-stone-500">Total: {totalAppointments}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {analytics.appointmentStats.map((stat) => (
            <div key={stat.status} className="bg-muted/40 rounded-lg p-4 border border-border">
              <div className="text-xl font-bold mb-1">{stat._count}</div>
              <div className="text-sm text-stone-500 capitalize">
                {stat.status.replace('_', ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prescription Stats */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold">Guidance Plan Statistics</h3>
          <span className="ml-auto text-sm text-stone-500">Total: {totalPrescriptions}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {analytics.prescriptionStats.map((stat) => (
            <div key={stat.status} className="bg-muted/40 rounded-lg p-4 border border-border">
              <div className="text-xl font-bold mb-1">{stat._count}</div>
              <div className="text-sm text-stone-500 capitalize">
                {stat.status.replace('_', ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction Volume Details */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h3 className="text-lg font-semibold mb-4">Transaction Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-stone-500 mb-2">Total Volume</div>
            <div className="text-2xl font-bold text-highlight">
              {formatCurrency(analytics.transactionVolume.total)}
            </div>
          </div>
          <div>
            <div className="text-sm text-stone-500 mb-2">Transaction Count</div>
            <div className="text-2xl font-bold">{analytics.transactionVolume.count}</div>
          </div>
        </div>
        {analytics.transactionVolume.count > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-sm text-stone-500">
              Average Transaction:{' '}
              <span className="font-medium text-stone-900 dark:text-stone-100">
                {formatCurrency(
                  analytics.transactionVolume.total / analytics.transactionVolume.count
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboardView;

