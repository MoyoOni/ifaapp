import React, { useState } from 'react';
import { BarChart, TrendingUp, DollarSign, Calendar, Download, PieChart, LineChart } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';

interface RevenueRecord {
  id: string;
  date: Date;
  amount: number;
  orderId: string;
  productName: string;
  status: 'completed' | 'pending' | 'refunded';
}

interface RevenueSummary {
  totalRevenue: number;
  thisMonth: number;
  thisWeek: number;
  averageOrderValue: number;
  totalOrders: number;
  refundRate: number;
}

const VendorRevenueView: React.FC = () => {
  const { user: _user } = useAuth();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');

  // Mock revenue data
  const revenueData: RevenueRecord[] = [
    {
      id: 'rev-1',
      date: new Date(Date.now() - 86400000),
      amount: 25000,
      orderId: 'order-001',
      productName: 'Ifa Divination Chain',
      status: 'completed'
    },
    {
      id: 'rev-2',
      date: new Date(Date.now() - 172800000),
      amount: 12000,
      orderId: 'order-002',
      productName: 'Sacred Palm Nuts',
      status: 'completed'
    },
    {
      id: 'rev-3',
      date: new Date(Date.now() - 259200000),
      amount: 8000,
      orderId: 'order-003',
      productName: 'Ritual Beads',
      status: 'completed'
    },
    {
      id: 'rev-4',
      date: new Date(Date.now() - 345600000),
      amount: 15000,
      orderId: 'order-004',
      productName: 'Divination Board',
      status: 'pending'
    },
    {
      id: 'rev-5',
      date: new Date(Date.now() - 432000000),
      amount: -5000,
      orderId: 'order-005',
      productName: 'Ifa Divination Chain',
      status: 'refunded'
    }
  ];

  // Calculate summaries
  const completedRevenue = revenueData.filter(r => r.status === 'completed');
  const summary: RevenueSummary = {
    totalRevenue: completedRevenue.reduce((sum, r) => sum + r.amount, 0),
    thisMonth: completedRevenue.filter(r => 
      r.date.getMonth() === new Date().getMonth()
    ).reduce((sum, r) => sum + r.amount, 0),
    thisWeek: completedRevenue.filter(r => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return r.date >= weekAgo;
    }).reduce((sum, r) => sum + r.amount, 0),
    averageOrderValue: completedRevenue.length > 0 
      ? completedRevenue.reduce((sum, r) => sum + r.amount, 0) / completedRevenue.length
      : 0,
    totalOrders: revenueData.filter(r => r.status !== 'refunded').length,
    refundRate: revenueData.length > 0 
      ? (revenueData.filter(r => r.status === 'refunded').length / revenueData.length) * 100
      : 0
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Generate chart data based on time range
  const generateChartData = () => {
    const data = [];
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dayRevenue = revenueData
        .filter(r => r.date.toDateString() === date.toDateString() && r.status === 'completed')
        .reduce((sum, r) => sum + r.amount, 0);
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayRevenue,
        orders: revenueData.filter(r => r.date.toDateString() === date.toDateString()).length
      });
    }
    
    return data;
  };

  const chartData = generateChartData();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900">
            Revenue Analytics
          </h1>
          <p className="text-stone-600 text-lg">
            Track your store performance and financial metrics.
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
              <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-2xl font-bold text-stone-900 mt-1">{formatCurrency(summary.totalRevenue)}</h3>
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
              <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Avg Order Value</p>
              <h3 className="text-2xl font-bold text-stone-900 mt-1">{formatCurrency(summary.averageOrderValue)}</h3>
            </div>
            <div className="bg-purple-100 p-3 rounded-xl text-purple-700">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Refund Rate</p>
              <h3 className="text-2xl font-bold text-stone-900 mt-1">{summary.refundRate.toFixed(1)}%</h3>
            </div>
            <div className="bg-orange-100 p-3 rounded-xl text-orange-700">
              <PieChart size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-stone-900">Revenue Trends</h2>
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1">
              {(['week', 'month', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-highlight text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {(['bar', 'line', 'pie'] as const).map((type) => {
                const Icon = type === 'bar' ? BarChart : type === 'line' ? LineChart : PieChart;
                return (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                      chartType === type
                        ? 'bg-highlight text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    <Icon size={16} /> {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Visualization */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <div className="h-64 flex items-center justify-center bg-stone-50 rounded-xl">
          <div className="text-center">
            <BarChart size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-lg font-bold text-stone-900 mb-2">Revenue Chart</h3>
            <p className="text-stone-600">
              Interactive chart visualization would appear here
            </p>
            <p className="text-sm text-stone-500 mt-2">
              Showing {chartData.length} data points for the selected period
            </p>
          </div>
        </div>
      </div>

      {/* Revenue History Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <h2 className="text-xl font-bold text-stone-900">Revenue History</h2>
          <p className="text-stone-600 mt-1">{revenueData.length} transactions</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {revenueData.map((revenue) => (
                <tr key={revenue.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                    {revenue.date.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-stone-600">
                    {revenue.orderId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                    {revenue.productName}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                    revenue.status === 'refunded' ? 'text-red-600' : 'text-stone-900'
                  }`}>
                    {revenue.status === 'refunded' ? '-' : ''}{formatCurrency(revenue.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(revenue.status)}`}>
                      {revenue.status.charAt(0).toUpperCase() + revenue.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {revenueData.length === 0 && (
          <div className="p-12 text-center">
            <DollarSign size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-lg font-bold text-stone-900 mb-2">No revenue recorded</h3>
            <p className="text-stone-600">Your revenue will appear here once you complete sales.</p>
          </div>
        )}
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-xl text-blue-700">
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">Performance Insights</h3>
              <ul className="space-y-2 text-sm text-stone-600">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Highest selling day: {new Date().toLocaleDateString()}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Best selling product: Ifa Divination Chain
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Average processing time: 2.3 days
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-xl text-green-700">
              <DollarSign size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">Payout Information</h3>
              <p className="text-stone-600 mb-3 text-sm">
                Revenue is transferred to your wallet 48 hours after order completion. 
                Standard marketplace fees apply.
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-stone-900">Marketplace Fee:</span>
                  <span className="text-stone-600">15%</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-stone-900">Next Payout:</span>
                  <span className="text-stone-600">
                    {new Date(Date.now() + 172800000).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-stone-900">Available Balance:</span>
                  <span className="font-bold text-green-700">
                    {formatCurrency(summary.totalRevenue * 0.85)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorRevenueView;