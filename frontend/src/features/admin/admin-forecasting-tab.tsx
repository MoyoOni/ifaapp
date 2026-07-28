import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { TrendingUp, DollarSign, Zap, AlertTriangle } from 'lucide-react';

interface RevenueData {
  currentMRR: number;
  projectedMRR: number;
  churnAdjustedMRR: number;
  thisMonthGMV: number;
  monthlyGrowthRate: number;
  projectedAnnualGMV: number;
  projectedAnnualPlatformRevenue: number;
  consultationCommissionPct: number;
  marketplaceCommissionPct: number;
  // ILUASE_V1_BACKLOG.md 🔴 Critical fix: platformCostNgn/breakEvenThreshold/
  // monthsToBreakEven are now honestly null until an admin sets a real
  // operating-cost figure, instead of a fabricated placeholder number.
  platformCostNgn: number | null;
  platformCostTracked: boolean;
  platformCostNote?: string;
  breakEvenThreshold: number | null;
  monthsToBreakEven: number | null;
  churnRate: number;
  currentSubscribers: number;
  trend: Array<{ month: string; gmv: number; revenue: number }>;
}

function StatCard({ icon: Icon, label, value, sub, alert }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; sub?: string; alert?: boolean }) {
  return (
    <div className={`border rounded-lg p-4 space-y-1 ${alert ? 'border-amber-300 bg-amber-50' : 'border-border bg-card'}`}>
      <div className={`flex items-center gap-2 text-sm ${alert ? 'text-amber-700' : 'text-muted-foreground'}`}>
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <p className={`text-2xl font-bold ${alert ? 'text-amber-900' : 'text-foreground'}`}>{value}</p>
      {sub && <p className={`text-xs ${alert ? 'text-amber-600' : 'text-muted-foreground'}`}>{sub}</p>}
    </div>
  );
}

export function AdminForecastingTab() {
  const { data, isLoading } = useQuery<RevenueData>({
    queryKey: ['admin', 'forecasting', 'revenue'],
    queryFn: () => api.get('/admin/forecasting/revenue').then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-card border border-border rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return <div>No data available</div>;
  }

  const breakEvenWarning = data.monthsToBreakEven !== null && data.monthsToBreakEven > 6;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Revenue Forecasting</h2>
        <p className="text-sm text-muted-foreground mt-1">Platform financial trajectory and break-even scenario modeling.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Current MRR"
          value={`₦${Math.round(data.currentMRR).toLocaleString()}`}
          sub={`${data.currentSubscribers} active subscribers`}
        />
        <StatCard
          icon={TrendingUp}
          label="Monthly Growth"
          value={`${data.monthlyGrowthRate}%`}
          sub="last 2 months"
        />
        <StatCard
          icon={DollarSign}
          label="Projected Annual Platform Revenue"
          value={`₦${Math.round(data.projectedAnnualPlatformRevenue).toLocaleString()}`}
          sub="commission only"
        />
        <StatCard
          icon={AlertTriangle}
          label="Break-even in"
          value={data.platformCostTracked ? (data.monthsToBreakEven === null ? '∞' : `${data.monthsToBreakEven} mo`) : 'Not tracked'}
          sub={data.platformCostTracked ? `Costs: ₦${Math.round(data.platformCostNgn!).toLocaleString()}/mo` : 'Set an operating cost in Platform Settings'}
          alert={breakEvenWarning}
        />
      </div>

      {/* Scenario Modeling */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-highlight font-medium text-sm">
            Revenue Scenarios
          </div>
          <div className="p-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Current MRR</p>
              <p className="text-lg font-semibold">₦{Math.round(data.currentMRR).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">From {data.currentSubscribers} devoted subscribers</p>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Projected MRR (with growth)</p>
              <p className="text-lg font-semibold">₦{Math.round(data.projectedMRR).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">If {data.monthlyGrowthRate}% growth continues</p>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Churn-Adjusted MRR (conservative)</p>
              <p className="text-lg font-semibold">₦{Math.round(data.churnAdjustedMRR).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Assuming 5% monthly churn</p>
            </div>
          </div>
        </div>

        {/* Trend Chart (text-based) */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-highlight font-medium text-sm">
            Last 3 Months Trend
          </div>
          <div className="p-4 space-y-4">
            {data.trend.map((t) => {
              const maxGMV = Math.max(...data.trend.map((x) => x.gmv), 1);
              const pct = Math.round((t.gmv / maxGMV) * 100);
              return (
                <div key={t.month}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{t.month}</span>
                    <span className="text-xs text-muted-foreground">₦{t.revenue.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-highlight rounded-full overflow-hidden">
                    <div className="h-full bg-foreground rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">GMV: ₦{t.gmv.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Break-even Analysis */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-highlight font-medium text-sm flex items-center gap-2">
          <Zap className="w-4 h-4" /> Break-even Scenario
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Monthly Platform Costs</p>
              <p className="text-lg font-semibold">
                {data.platformCostTracked ? `₦${Math.round(data.platformCostNgn!).toLocaleString()}` : 'Not tracked'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Current Monthly Revenue</p>
              <p className="text-lg font-semibold text-green-600">₦{Math.round(data.trend[data.trend.length - 1]?.revenue ?? 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="border-t border-border pt-3">
            {!data.platformCostTracked ? (
              <p className="text-sm text-amber-700 bg-amber-50 rounded px-3 py-2">
                ⚠️ {data.platformCostNote}
              </p>
            ) : data.monthsToBreakEven === null ? (
              <p className="text-sm text-amber-700 bg-amber-50 rounded px-3 py-2">
                ⚠️ Current commission revenue is ₦0 or the cost figure is invalid -- can't project a break-even date. Increase commission revenue or reduce costs.
              </p>
            ) : (
              <p className="text-sm text-green-700 bg-green-50 rounded px-3 py-2">
                ✓ Platform will break even in approximately <strong>{data.monthsToBreakEven} months</strong> at current growth rate.
              </p>
            )}
          </div>
          <div className="bg-muted/40 rounded px-3 py-2 text-xs text-muted-foreground space-y-1">
            <p><strong>Key assumptions:</strong></p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Monthly growth rate: {data.monthlyGrowthRate}%</li>
              <li>Churn rate: {data.churnRate}%</li>
              <li>Commission: {data.consultationCommissionPct}% of consultation GMV + {data.marketplaceCommissionPct}% of marketplace GMV (configured rates, from Platform Settings)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
