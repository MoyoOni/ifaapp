import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie,
} from 'recharts';
import { Loader2, Users, Globe2, FileDown, ArrowUpDown } from 'lucide-react';
import api from '@/lib/api';
import { isDevModeActive } from '@/shared/utils/dev-mode';

interface SalesAnalytics {
  period: { from: string; to: string };
  revenueTrend: Array<{ date: string; revenue: number }>;
  avgOrderValueTrend: Array<{ date: string; avgOrderValue: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
  topProductsByRevenue: Array<{ productId: string; name: string; revenue: number }>;
  topProductsByUnits: Array<{ productId: string; name: string; units: number }>;
  repeatCustomerRate: number;
  geoBreakdown: Array<{ country: string; count: number }>;
  productPerformanceTable: Array<{ productId: string; name: string; orders: number; revenue: number; returnRate: number; avgRating: number | null }>;
}

const PIE_COLORS = ['#d97706', '#16a34a', '#2563eb', '#dc2626', '#7c3aed', '#0891b2'];
const PERIOD_OPTIONS = [
  { label: 'Today', days: 0 },
  { label: 'This Week', days: 7 },
  { label: 'This Month', days: 30 },
  { label: 'Last 3 Months', days: 90 },
];

type SortKey = 'name' | 'orders' | 'revenue' | 'returnRate' | 'avgRating';

const fmt = (n: number) => `₦${Number(n ?? 0).toLocaleString()}`;

const toCsv = (rows: SalesAnalytics['productPerformanceTable']) => {
  const header = ['Product', 'Orders', 'Revenue', 'Return Rate', 'Avg Rating'];
  const lines = rows.map((r) => [
    r.name.includes(',') ? `"${r.name}"` : r.name,
    String(r.orders),
    r.revenue.toFixed(2),
    (r.returnRate * 100).toFixed(1) + '%',
    r.avgRating !== null ? r.avgRating.toFixed(1) : 'N/A',
  ].join(','));
  return [header.join(','), ...lines].join('\n');
};

// VENDOR_BACKLOG.md VND-013
const VendorAnalyticsView: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDays, setSelectedDays] = useState(30);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [sortDesc, setSortDesc] = useState(true);

  const { data: vendorData } = useQuery({
    queryKey: ['vendor-profile'],
    queryFn: async () => (await api.get('/marketplace/vendors/me')).data,
    enabled: !isDevModeActive(),
  });

  const { from, to } = useMemo(() => {
    if (useCustomRange && customFrom && customTo) return { from: customFrom, to: customTo };
    const toDate = new Date();
    const fromDate = new Date(toDate.getTime() - selectedDays * 24 * 60 * 60 * 1000);
    return { from: fromDate.toISOString().slice(0, 10), to: toDate.toISOString().slice(0, 10) };
  }, [selectedDays, useCustomRange, customFrom, customTo]);

  const { data: analytics, isLoading } = useQuery<SalesAnalytics>({
    queryKey: ['vendor-sales-analytics', vendorData?.id, from, to],
    queryFn: async () => (await api.get(`/marketplace/vendors/${vendorData!.id}/sales-analytics`, { params: { from, to } })).data,
    enabled: !!vendorData?.id,
  });

  const sortedTable = useMemo(() => {
    if (!analytics) return [];
    const rows = [...analytics.productPerformanceTable];
    rows.sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      const cmp = typeof av === 'string' ? av.localeCompare(String(bv)) : Number(av) - Number(bv);
      return sortDesc ? -cmp : cmp;
    });
    return rows;
  }, [analytics, sortKey, sortDesc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDesc((d) => !d);
    else { setSortKey(key); setSortDesc(true); }
  };

  const exportCsv = () => {
    if (!analytics) return;
    const csv = toCsv(sortedTable);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `product-performance-${from}-to-${to}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div>
        <button onClick={() => navigate('/vendor/dashboard')} className="text-sm font-bold text-muted-foreground hover:text-foreground mb-1">
          ← Dashboard
        </button>
        <h1 className="text-3xl font-bold brand-font text-foreground">Sales Analytics</h1>
        <p className="text-muted-foreground">Understand what's working and what's not</p>
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap gap-2 items-center">
        {PERIOD_OPTIONS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => { setSelectedDays(p.days || 1); setUseCustomRange(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${!useCustomRange && selectedDays === (p.days || 1) ? 'bg-highlight text-foreground border-highlight' : 'border-border text-muted-foreground hover:bg-muted'}`}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setUseCustomRange(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${useCustomRange ? 'bg-highlight text-foreground border-highlight' : 'border-border text-muted-foreground hover:bg-muted'}`}
        >
          Custom Range
        </button>
        {useCustomRange && (
          <>
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground" />
            <span className="text-muted-foreground text-xs">to</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground" />
          </>
        )}
      </div>

      {isLoading || !analytics ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Repeat customer rate quick stat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-3">
              <Users className="text-highlight" size={24} />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Repeat Customer Rate</p>
                <p className="text-2xl font-bold text-foreground">{(analytics.repeatCustomerRate * 100).toFixed(0)}%</p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                <Globe2 size={12} /> Customers By Country
              </p>
              <div className="space-y-1">
                {analytics.geoBreakdown.slice(0, 4).map((g) => (
                  <div key={g.country} className="flex justify-between text-sm">
                    <span className="text-foreground">{g.country}</span>
                    <span className="text-muted-foreground">{g.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue trend + Orders by status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analytics.revenueTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                  <Tooltip formatter={(v?: number) => [fmt(v ?? 0), 'Revenue']} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--foreground)' }} />
                  <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2.5} dot={{ fill: '#16a34a', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Orders by Status</h3>
              {analytics.ordersByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics.ordersByStatus}
                      cx="50%" cy="50%" labelLine={false} outerRadius={80}
                      dataKey="count" nameKey="status"
                      label={({ status, percent }: any) => `${status}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                      fill="#d97706"
                    >
                      {analytics.ordersByStatus.map((_entry, index) => (
                        <rect key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} orders`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">No orders in this period</div>
              )}
            </div>
          </div>

          {/* Top products by revenue / units */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Top 5 Products by Revenue</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.topProductsByRevenue} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                  <Tooltip formatter={(v?: number) => [fmt(v ?? 0), 'Revenue']} />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Top 5 Products by Units Sold</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.topProductsByUnits} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                  <Tooltip formatter={(v?: number) => [`${v ?? 0} units`, 'Units']} />
                  <Bar dataKey="units" fill="#d97706" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Avg order value trend */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Average Order Value Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={analytics.avgOrderValueTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <Tooltip formatter={(v?: number) => [fmt(v ?? 0), 'Avg Order Value']} />
                <Line type="monotone" dataKey="avgOrderValue" stroke="#7c3aed" strokeWidth={2.5} dot={{ fill: '#7c3aed', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Product performance table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 flex items-center justify-between border-b border-border">
              <h3 className="text-lg font-bold text-foreground">Product Performance</h3>
              <button
                type="button"
                onClick={exportCsv}
                className="px-3 py-1.5 border border-border rounded-lg text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1"
              >
                <FileDown size={12} /> Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    {([
                      ['name', 'Product'], ['orders', 'Orders'], ['revenue', 'Revenue'], ['returnRate', 'Return Rate'], ['avgRating', 'Avg Rating'],
                    ] as [SortKey, string][]).map(([key, label]) => (
                      <th key={key} className="p-3 font-bold text-muted-foreground uppercase tracking-wider text-xs cursor-pointer select-none" onClick={() => toggleSort(key)}>
                        <span className="flex items-center gap-1">{label} <ArrowUpDown size={10} /></span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {sortedTable.length === 0 ? (
                    <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No product data yet</td></tr>
                  ) : (
                    sortedTable.map((row) => (
                      <tr key={row.productId}>
                        <td className="p-3 font-medium text-foreground">{row.name}</td>
                        <td className="p-3 text-foreground">{row.orders}</td>
                        <td className="p-3 font-bold text-foreground">{fmt(row.revenue)}</td>
                        <td className="p-3 text-foreground">{(row.returnRate * 100).toFixed(0)}%</td>
                        <td className="p-3 text-foreground">{row.avgRating !== null ? `${row.avgRating.toFixed(1)}★` : 'N/A'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground p-3 border-t border-border">
              Views and add-to-carts aren't tracked yet, so they're not shown here rather than faked.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default VendorAnalyticsView;
