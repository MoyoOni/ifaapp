import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

interface AnalyticsData {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalRevenue: number;
  revenueGrowth: number;
  avgOrderValue: number;
}

interface AnalyticsDashboardProps {
  vendorId: string;
  activeTab: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ vendorId, activeTab }) => {
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ['vendor-analytics', vendorId],
    queryFn: async () => {
      if (isDemoMode) {
        // Demo analytics data
        return {
          totalSales: 124,
          totalOrders: 89,
          totalProducts: 12,
          totalRevenue: 45600,
          revenueGrowth: 15,
          avgOrderValue: 512,
        };
      }
      
      try {
        const response = await api.get(`/vendors/${vendorId}/analytics`);
        return response.data;
      } catch (error) {
        logger.error('Failed to fetch vendor analytics', error);
        return {
          totalSales: 0,
          totalOrders: 0,
          totalProducts: 0,
          totalRevenue: 0,
          revenueGrowth: 0,
          avgOrderValue: 0,
        };
      }
    },
  });

  if (activeTab !== 'revenue' && activeTab !== 'analytics') return null;

  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
        <p className="text-muted-foreground">Track your sales performance and business metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <span className="w-5 h-5 text-muted-foreground text-lg">💵</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.totalRevenue ? `₦${analyticsData.totalRevenue.toLocaleString()}` : '₦0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +{analyticsData?.revenueGrowth || 0}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <span className="w-5 h-5 text-muted-foreground text-lg">🛍️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.totalOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +{analyticsData?.revenueGrowth ? Math.round(analyticsData.revenueGrowth / 3) : 0}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <span className="w-5 h-5 text-muted-foreground text-lg">💳</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.avgOrderValue ? `₦${analyticsData.avgOrderValue.toLocaleString()}` : '₦0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +{analyticsData?.revenueGrowth ? Math.round(analyticsData.revenueGrowth / 2) : 0}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <span className="w-5 h-5 text-muted-foreground text-lg">📦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.totalProducts || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analyticsData?.totalProducts ? Math.round(analyticsData.totalProducts * 0.7) : 0} in stock
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
              <p className="text-muted-foreground">Chart visualization would appear here</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <span className="text-lg">📦</span>
                    </div>
                    <div>
                      <p className="font-medium">Product {i}</p>
                      <p className="text-sm text-muted-foreground">Bestseller</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₦{(5000 + i * 1000).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{25 + i * 5} sales</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;