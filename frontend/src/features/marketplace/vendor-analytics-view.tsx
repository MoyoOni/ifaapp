import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, ShoppingCart, DollarSign, Calendar, Download, Eye } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';

interface VendorAnalyticsViewProps {
  onBack?: () => void;
}

interface AnalyticsData {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  uniqueCustomers: number;
  salesByCategory: { category: string; sales: number }[];
  monthlySales: { month: string; sales: number }[];
  topProducts: { name: string; sales: number }[];
}

const VendorAnalyticsView: React.FC<VendorAnalyticsViewProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('last30');

  const { data: analytics = {
    totalSales: 125000,
    totalOrders: 42,
    avgOrderValue: 2976,
    uniqueCustomers: 32,
    salesByCategory: [
      { category: 'Ritual Items', sales: 52000 },
      { category: 'Books', sales: 31000 },
      { category: 'Consultations', sales: 28000 },
      { category: 'Herbs', sales: 14000 },
    ],
    monthlySales: [
      { month: 'Jan', sales: 18000 },
      { month: 'Feb', sales: 22000 },
      { month: 'Mar', sales: 19000 },
      { month: 'Apr', sales: 24000 },
      { month: 'May', sales: 21000 },
      { month: 'Jun', sales: 21000 },
    ],
    topProducts: [
      { name: 'Ifa Divination Chain', sales: 15 },
      { name: 'Sacred Palm Nuts', sales: 12 },
      { name: 'Ritual Beads', sales: 9 },
      { name: 'Ifa Oracle Book', sales: 7 },
      { name: 'Spiritual Herbs Bundle', sales: 6 },
    ]
  } as AnalyticsData, isLoading } = useQuery({
    queryKey: ['vendor-analytics', user?.id, dateRange],
    queryFn: async () => {
      // In a real implementation, this would fetch from the backend
      // For demo purposes, returning mock data
      return {
        totalSales: 125000,
        totalOrders: 42,
        avgOrderValue: 2976,
        uniqueCustomers: 32,
        salesByCategory: [
          { category: 'Ritual Items', sales: 52000 },
          { category: 'Books', sales: 31000 },
          { category: 'Consultations', sales: 28000 },
          { category: 'Herbs', sales: 14000 },
        ],
        monthlySales: [
          { month: 'Jan', sales: 18000 },
          { month: 'Feb', sales: 22000 },
          { month: 'Mar', sales: 19000 },
          { month: 'Apr', sales: 24000 },
          { month: 'May', sales: 21000 },
          { month: 'Jun', sales: 21000 },
        ],
        topProducts: [
          { name: 'Ifa Divination Chain', sales: 15 },
          { name: 'Sacred Palm Nuts', sales: 12 },
          { name: 'Ritual Beads', sales: 9 },
          { name: 'Ifa Oracle Book', sales: 7 },
          { name: 'Spiritual Herbs Bundle', sales: 6 },
        ]
      };
    },
    enabled: !!user?.id
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-stone-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                  <div className="h-6 bg-stone-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-stone-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <button 
            onClick={onBack || (() => window.history.back())}
            className="text-sm font-bold text-stone-500 hover:text-stone-800 mb-2 flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold brand-font text-stone-800">Performance Analytics</h1>
              <p className="text-stone-500">Track your sales performance and business insights</p>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <select 
                  value={dateRange} 
                  onChange={(e) => setDateRange(e.target.value)}
                  className="appearance-none bg-white border border-stone-200 rounded-xl px-4 py-2 pr-8 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-highlight focus:border-highlight"
                >
                  <option value="last7">Last 7 days</option>
                  <option value="last30">Last 30 days</option>
                  <option value="last90">Last 90 days</option>
                  <option value="year">This year</option>
                </select>
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-xl text-stone-600 hover:bg-white font-bold text-sm">
                <Download size={16} />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs sm:text-sm font-bold text-stone-400 uppercase tracking-wider">Total Sales</span>
              <div className="p-2 bg-green-50 text-green-500 rounded-lg">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-stone-800">₦{analytics.totalSales.toLocaleString()}</div>
            <div className="text-xs text-stone-500 mt-1 font-medium">+12% from last period</div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs sm:text-sm font-bold text-stone-400 uppercase tracking-wider">Total Orders</span>
              <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                <ShoppingCart size={20} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-stone-800">{analytics.totalOrders}</div>
            <div className="text-xs text-stone-500 mt-1 font-medium">+8% from last period</div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs sm:text-sm font-bold text-stone-400 uppercase tracking-wider">Avg. Order Value</span>
              <div className="p-2 bg-purple-50 text-purple-500 rounded-lg">
                <BarChart3 size={20} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-stone-800">₦{analytics.avgOrderValue.toLocaleString()}</div>
            <div className="text-xs text-stone-500 mt-1 font-medium">+4% from last period</div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs sm:text-sm font-bold text-stone-400 uppercase tracking-wider">Unique Customers</span>
              <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
                <Users size={20} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-stone-800">{analytics.uniqueCustomers}</div>
            <div className="text-xs text-stone-500 mt-1 font-medium">+6% from last period</div>
          </div>
        </div>

        {/* Charts and Data Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sales Trend Chart */}
          <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-stone-800">Sales Trend</h2>
              <TrendingUp className="text-stone-400" size={20} />
            </div>
            <div className="h-64 flex items-end justify-between gap-2 pt-6 border-t border-stone-100">
              {analytics.monthlySales.map((month, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full bg-highlight rounded-t-lg max-h-40" 
                    style={{ height: `${(month.sales / Math.max(...analytics.monthlySales.map(m => m.sales))) * 80}%` }}
                  ></div>
                  <span className="text-xs text-stone-500 mt-2">{month.month}</span>
                  <span className="text-xs text-stone-800 font-bold">₦{month.sales.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-stone-800">Top Selling Products</h2>
              <BarChart3 className="text-stone-400" size={20} />
            </div>
            <div className="space-y-4">
              {analytics.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-stone-800">{product.name}</p>
                    <p className="text-xs text-stone-500">Units sold: {product.sales}</p>
                  </div>
                  <button className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors">
                    <Eye size={16} className="text-stone-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sales by Category */}
        <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-stone-800">Sales by Category</h2>
            <BarChart3 className="text-stone-400" size={20} />
          </div>
          <div className="space-y-4">
            {analytics.salesByCategory.map((category, index) => {
              const percentage = (category.sales / analytics.totalSales) * 100;
              return (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-stone-800">{category.category}</span>
                    <span className="text-stone-500">₦{category.sales.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2">
                    <div 
                      className="bg-highlight h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorAnalyticsView;