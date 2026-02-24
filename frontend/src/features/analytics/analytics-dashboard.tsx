import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, DollarSign, Users, Calendar, Package, Loader2, BarChart3 } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';

/**
 * Analytics Dashboard Component
 * Shows analytics for Babalawos and Vendors
 */
const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch analytics data (this would be a real endpoint in production)
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', user?.id],
    queryFn: async () => {
      // In production, this would call a real analytics endpoint
      // For now, return mock data structure
      return {
        role: user?.role,
        bookings: {
          total: 45,
          upcoming: 8,
          completed: 37,
          cancelled: 2,
          revenue: 1250000,
        },
        clients: {
          total: 23,
          active: 15,
          retention: 65,
        },
        products: {
          total: 12,
          sold: 89,
          revenue: 450000,
        },
        courses: {
          total: 3,
          enrollments: 156,
          revenue: 780000,
        },
      };
    },
    enabled: !!user && (user.role === 'BABALAWO' || user.role === 'VENDOR'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-12 h-12 animate-spin text-highlight" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-muted">
        <BarChart3 size={64} className="mx-auto mb-4 opacity-50" />
        <p className="text-xl">Analytics not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold brand-font text-white mb-2">Analytics Dashboard</h1>
          <p className="text-muted">Track your performance and growth</p>
        </div>
      </div>

      {/* Babalawo Analytics */}
      {user?.role === 'BABALAWO' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar size={24} className="text-blue-400" />
              <TrendingUp size={20} className="text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{analytics.bookings.total}</div>
            <div className="text-sm text-muted">Total Bookings</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Users size={24} className="text-purple-400" />
              <TrendingUp size={20} className="text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{analytics.clients.total}</div>
            <div className="text-sm text-muted">Total Clients</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign size={24} className="text-highlight" />
              <TrendingUp size={20} className="text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              ₦{(analytics.bookings.revenue / 1000).toFixed(0)}k
            </div>
            <div className="text-sm text-muted">Total Revenue</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp size={24} className="text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{analytics.clients.retention}%</div>
            <div className="text-sm text-muted">Client Retention</div>
          </div>
        </div>
      )}

      {/* Vendor Analytics */}
      {user?.role === 'VENDOR' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Package size={24} className="text-blue-400" />
              <TrendingUp size={20} className="text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{analytics.products.total}</div>
            <div className="text-sm text-muted">Total Products</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Package size={24} className="text-purple-400" />
              <TrendingUp size={20} className="text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{analytics.products.sold}</div>
            <div className="text-sm text-muted">Units Sold</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign size={24} className="text-highlight" />
              <TrendingUp size={20} className="text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              ₦{(analytics.products.revenue / 1000).toFixed(0)}k
            </div>
            <div className="text-sm text-muted">Product Revenue</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp size={24} className="text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {analytics.products.sold > 0
                ? ((analytics.products.sold / analytics.products.total) * 100).toFixed(0)
                : 0}%
            </div>
            <div className="text-sm text-muted">Sales Rate</div>
          </div>
        </div>
      )}

      {/* Charts Placeholder */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Performance Trends</h2>
        <div className="h-64 flex items-center justify-center text-muted">
          <div className="text-center">
            <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
            <p>Charts and visualizations coming soon</p>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button className="px-6 py-3 border border-white/20 text-white rounded-xl font-bold hover:bg-white/10 transition-colors">
          Export Data
        </button>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
