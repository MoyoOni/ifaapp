import React, { useState } from 'react';
import { BarChart, DollarSign, TrendingUp, Calendar, Download } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';

interface EarningRecord {
  id: string;
  date: Date;
  amount: number;
  clientName: string;
  sessionType: string;
  status: 'paid' | 'pending' | 'refunded';
}

interface EarningsSummary {
  totalEarnings: number;
  thisMonth: number;
  thisWeek: number;
  averagePerSession: number;
  totalSessions: number;
}

const EarningsReportView: React.FC = () => {
  const { user: _user } = useAuth();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  // Mock earnings data
  const earningsData: EarningRecord[] = [
    {
      id: 'earn-1',
      date: new Date(Date.now() - 86400000),
      amount: 15000,
      clientName: 'Amara Johnson',
      sessionType: 'Career Guidance',
      status: 'paid'
    },
    {
      id: 'earn-2',
      date: new Date(Date.now() - 172800000),
      amount: 12000,
      clientName: 'David Chen',
      sessionType: 'Relationship Advice',
      status: 'paid'
    },
    {
      id: 'earn-3',
      date: new Date(Date.now() - 259200000),
      amount: 15000,
      clientName: 'Sarah Williams',
      sessionType: 'Initial Consultation',
      status: 'paid'
    },
    {
      id: 'earn-4',
      date: new Date(Date.now() - 345600000),
      amount: 10000,
      clientName: 'Michael Brown',
      sessionType: 'Follow-up Session',
      status: 'pending'
    }
  ];

  // Calculate summaries
  const summary: EarningsSummary = {
    totalEarnings: earningsData.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0),
    thisMonth: earningsData.filter(e => 
      e.date.getMonth() === new Date().getMonth() && e.status === 'paid'
    ).reduce((sum, e) => sum + e.amount, 0),
    thisWeek: earningsData.filter(e => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return e.date >= weekAgo && e.status === 'paid';
    }).reduce((sum, e) => sum + e.amount, 0),
    averagePerSession: earningsData.filter(e => e.status === 'paid').length > 0 
      ? earningsData.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0) / 
        earningsData.filter(e => e.status === 'paid').length
      : 0,
    totalSessions: earningsData.length
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900">
            Earnings Report
          </h1>
          <p className="text-stone-600 text-lg">
            Track your income and financial performance.
          </p>
        </div>
        <button className="px-4 py-2 bg-highlight text-white font-bold rounded-xl shadow-lg hover:bg-yellow-600 transition-colors flex items-center gap-2">
          <Download size={18} /> Export Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Total Earnings</p>
              <h3 className="text-2xl font-bold text-stone-900 mt-1">{formatCurrency(summary.totalEarnings)}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-xl text-green-700">
              <DollarSign size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">This Month</p>
              <h3 className="text-2xl font-bold text-stone-900 mt-1">{formatCurrency(summary.thisMonth)}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl text-blue-700">
              <Calendar size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">This Week</p>
              <h3 className="text-2xl font-bold text-stone-900 mt-1">{formatCurrency(summary.thisWeek)}</h3>
            </div>
            <div className="bg-purple-100 p-3 rounded-xl text-purple-700">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Avg Per Session</p>
              <h3 className="text-2xl font-bold text-stone-900 mt-1">{formatCurrency(summary.averagePerSession)}</h3>
            </div>
            <div className="bg-orange-100 p-3 rounded-xl text-orange-700">
              <BarChart size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-stone-900">Earnings History</h2>
          <div className="flex gap-2">
            {(['week', 'month', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-highlight text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
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
          <p className="text-stone-600 mt-1">{earningsData.length} transactions</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Session Type</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {earningsData.map((earning) => (
                <tr key={earning.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                    {earning.date.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">
                    {earning.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">
                    {earning.sessionType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-stone-900">
                    {formatCurrency(earning.amount)}
                  </td>
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
        
        {earningsData.length === 0 && (
          <div className="p-12 text-center">
            <DollarSign size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-lg font-bold text-stone-900 mb-2">No earnings recorded</h3>
            <p className="text-stone-600">Your earnings will appear here once you complete sessions.</p>
          </div>
        )}
      </div>

      {/* Payment Information */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-100">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 rounded-xl text-green-700">
            <DollarSign size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900 mb-2">Payment Information</h3>
            <p className="text-stone-600 mb-3">
              Earnings are automatically transferred to your wallet 24 hours after session completion. 
              Standard session rates apply unless otherwise agreed upon.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-bold text-stone-900">Standard Rate:</span>
                <span className="text-stone-600 ml-2">₦15,000/session</span>
              </div>
              <div>
                <span className="font-bold text-stone-900">Processing Fee:</span>
                <span className="text-stone-600 ml-2">10%</span>
              </div>
              <div>
                <span className="font-bold text-stone-900">Next Payout:</span>
                <span className="text-stone-600 ml-2">
                  {new Date(Date.now() + 86400000).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsReportView;