import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, Wallet, Clock, CheckCircle2, Info } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { isDevModeActive } from '@/shared/utils/dev-mode';

interface VendorEarnings {
  totalAllTime: number;
  totalThisMonth: number;
  totalLastMonth: number;
  earningsByProduct: Array<{ productId: string; name: string; revenue: number }>;
  weeklyEarnings: Array<{ weekStart: string; revenue: number }>;
  breakdown: { pending: number; available: number; paidOut: number };
  commission: { ratePct: number; deducted: boolean; totalRetainedAllTime?: number; note: string };
  payoutEligibility: { minPayoutThresholdNgn: number; isEligibleNow: boolean; amountNeeded: number; nextEscrowReleaseDate: string | null };
}

const fmt = (n: number) => `₦${Number(n ?? 0).toLocaleString()}`;

// VENDOR_BACKLOG.md VND-001: the marketplace equivalent of a Babalawo's
// /practitioner/earnings. Note this is the marketplace side only -- the
// practitioner earnings route currently redirects to a "paused" page since
// it depended on Consultations, which is paused platform-wide per
// MVP_PIVOT_BACKLOG.md. Marketplace is not paused, so this is fully live.
const VendorEarningsView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: vendorData } = useQuery({
    queryKey: ['vendor-profile', user?.id],
    queryFn: async () => (await api.get('/marketplace/vendors/me')).data,
    enabled: !!user?.id && !isDevModeActive(),
  });

  const { data: earnings, isLoading } = useQuery<VendorEarnings>({
    queryKey: ['vendor-earnings', vendorData?.id],
    queryFn: async () => (await api.get(`/marketplace/vendors/${vendorData!.id}/earnings`)).data,
    enabled: !!vendorData?.id,
  });

  const monthGrowth =
    earnings && earnings.totalLastMonth > 0
      ? Math.round(((earnings.totalThisMonth - earnings.totalLastMonth) / earnings.totalLastMonth) * 100)
      : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div>
        <button onClick={() => navigate('/vendor/dashboard')} className="text-sm font-bold text-muted-foreground hover:text-foreground mb-1">
          ← Dashboard
        </button>
        <h1 className="text-3xl font-bold brand-font text-foreground">Earnings Report</h1>
        <p className="text-muted-foreground">Where your money comes from, and where it currently sits</p>
      </div>

      {isLoading || !earnings ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Gross / this month / last month */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">All-Time Earnings</p>
              <p className="text-2xl font-bold text-foreground">{fmt(earnings.totalAllTime)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">This Month</p>
              <p className="text-2xl font-bold text-foreground">{fmt(earnings.totalThisMonth)}</p>
              {monthGrowth !== null && (
                <p className={`text-xs font-bold mt-1 ${monthGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {monthGrowth >= 0 ? '+' : ''}{monthGrowth}% vs last month
                </p>
              )}
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Last Month</p>
              <p className="text-2xl font-bold text-foreground">{fmt(earnings.totalLastMonth)}</p>
            </div>
          </div>

          {/* Commission transparency */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl p-4 flex items-start gap-3">
            <Info size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">Platform commission: {earnings.commission.ratePct}%</p>
              <p className="text-sm text-muted-foreground">{earnings.commission.note}</p>
              {earnings.commission.deducted && (
                <p className="text-xs text-muted-foreground mt-1">
                  Total commission retained to date: {fmt(earnings.commission.totalRetainedAllTime ?? 0)}
                </p>
              )}
            </div>
          </div>

          {/* Pending / Available / Paid Out */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                <Clock size={12} /> Pending (In Escrow)
              </p>
              <p className="text-2xl font-bold text-foreground">{fmt(earnings.breakdown.pending)}</p>
              {earnings.payoutEligibility.nextEscrowReleaseDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Next release around {new Date(earnings.payoutEligibility.nextEscrowReleaseDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                <Wallet size={12} /> Available (Withdrawable)
              </p>
              <p className="text-2xl font-bold text-foreground">{fmt(earnings.breakdown.available)}</p>
              <p className="text-xs mt-1 font-bold">
                {earnings.payoutEligibility.isEligibleNow ? (
                  <span className="text-green-600">Eligible for payout now</span>
                ) : (
                  <span className="text-muted-foreground">
                    {fmt(earnings.payoutEligibility.amountNeeded)} more to reach the {fmt(earnings.payoutEligibility.minPayoutThresholdNgn)} minimum
                  </span>
                )}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                <CheckCircle2 size={12} /> Paid Out
              </p>
              <p className="text-2xl font-bold text-foreground">{fmt(earnings.breakdown.paidOut)}</p>
            </div>
          </div>

          {/* Weekly chart */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-bold text-foreground mb-4">Weekly Earnings (12 weeks)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={earnings.weeklyEarnings} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="weekStart"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--foreground)' }}
                  formatter={(value?: number) => [fmt(value ?? 0), 'Revenue']}
                  labelFormatter={(v) => new Date(v).toLocaleDateString()}
                />
                <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2.5} dot={{ fill: '#16a34a', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Earnings by product */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-bold text-foreground mb-4">Earnings by Product</h3>
            {earnings.earningsByProduct.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed sales yet.</p>
            ) : (
              <div className="space-y-2">
                {earnings.earningsByProduct.map((p) => (
                  <div key={p.productId} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0">
                    <span className="text-foreground font-medium">{p.name}</span>
                    <span className="font-bold text-foreground">{fmt(p.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VendorEarningsView;
