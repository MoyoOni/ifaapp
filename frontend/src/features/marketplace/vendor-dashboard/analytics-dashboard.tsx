import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MonthlyBucket { month: string; revenue: number; orders: number; }
interface TopProduct { id: string; name: string; orderCount: number; }

interface AnalyticsData {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalRevenue: number;
  revenueGrowth: number;
  avgOrderValue: number;
  monthlyRevenue?: MonthlyBucket[];
  topProducts?: TopProduct[];
}

interface AnalyticsDashboardProps {
  vendorId: string;
  activeTab: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ vendorId, activeTab }) => {
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['vendor-analytics', vendorId],
    queryFn: async () => {
      const response = await api.get(`/marketplace/vendors/${vendorId}/analytics`);
      return response.data;
    },
    enabled: !!vendorId && !localStorage.getItem('dev_mode_role'),
  });

  if (activeTab !== 'revenue' && activeTab !== 'analytics') return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const growth = data?.revenueGrowth ?? 0;
  const monthly = data?.monthlyRevenue ?? [];
  const maxRevenue = Math.max(...monthly.map(m => m.revenue), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Earnings Report</h2>
        <p className="text-muted-foreground">Your store performance at a glance</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: fmt(data?.totalRevenue ?? 0), sub: `${growth >= 0 ? '+' : ''}${growth}% vs last month`, up: growth >= 0 },
          { label: 'Completed Orders', value: String(data?.totalSales ?? 0), sub: `of ${data?.totalOrders ?? 0} total`, up: true },
          { label: 'Avg. Order Value', value: fmt(data?.avgOrderValue ?? 0), sub: 'per completed order', up: true },
          { label: 'Active Products', value: String(data?.totalProducts ?? 0), sub: 'listed in marketplace', up: true },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{kpi.value}</div>
              <p className={`text-xs mt-1 flex items-center gap-1 ${kpi.up ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {kpi.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {kpi.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly revenue bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Revenue (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            {monthly.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No sales data yet</p>
            ) : (
              <div className="flex items-end gap-2 h-40">
                {monthly.map(m => {
                  const pct = Math.max((m.revenue / maxRevenue) * 100, 4);
                  const hasRevenue = m.revenue > 0;
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full relative group"
                        // dynamic height must use CSS var — Tailwind can't do runtime percentages
                        // eslint-disable-next-line react/forbid-dom-props
                        style={{ ['--bar-h' as string]: `${pct}%`, height: 'var(--bar-h)' }}
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-popover border border-border rounded px-1.5 py-0.5 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          {fmt(m.revenue)}
                        </div>
                        <div className={`h-full w-full rounded-t-md ${hasRevenue ? 'bg-primary' : 'bg-primary/20'}`} />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{m.month}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            {!data?.topProducts?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">Complete some orders to see top products</p>
            ) : (
              <div className="space-y-3">
                {data.topProducts.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {i + 1}
                    </div>
                    <p className="flex-1 text-sm font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.orderCount} sold</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
