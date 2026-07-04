import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { TrendingUp, Award, BarChart2, DollarSign } from 'lucide-react';

type SortBy = 'bookings' | 'revenue' | 'rating';

interface Practitioner {
  id: string;
  name: string;
  trustScore: number;
  totalBookings: number;
  thisMonthBookings: number;
  momGrowth: number;
  thisMonthRevenue: number;
  avgConsultationPrice: number;
}

interface MarketSignals {
  topPractitioners: Array<{ name: string; bookings: number }>;
  topSpecialisations: Array<{ term: string; count: number }>;
  avgConsultationPrice: number;
  minPrice: number;
  maxPrice: number;
}

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function AdminMarketIntelligenceTab() {
  const [sortBy, setSortBy] = useState<SortBy>('bookings');

  const { data: leaderboard = [], isLoading: boardLoading } = useQuery<Practitioner[]>({
    queryKey: ['admin', 'market-intelligence', 'leaderboard', sortBy],
    queryFn: () => api.get('/admin/market-intelligence/leaderboard', { params: { sortBy } }).then((r) => r.data),
  });

  const { data: signals, isLoading: signalsLoading } = useQuery<MarketSignals>({
    queryKey: ['admin', 'market-intelligence', 'signals'],
    queryFn: () => api.get('/admin/market-intelligence/signals').then((r) => r.data),
  });

  const isLoading = boardLoading || signalsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Market Intelligence</h2>
        <p className="text-sm text-muted-foreground mt-1">Practitioner leaderboard and demand signals.</p>
      </div>

      {/* Demand signals */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-card border border-border rounded-lg p-4 h-20 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={BarChart2} label="Avg Consultation" value={`₦${signals?.avgConsultationPrice.toLocaleString() ?? 0}`} sub="this month" />
          <StatCard icon={DollarSign} label="Min Price" value={`₦${signals?.minPrice.toLocaleString() ?? 0}`} sub="lowest booked" />
          <StatCard icon={DollarSign} label="Max Price" value={`₦${signals?.maxPrice.toLocaleString() ?? 0}`} sub="highest booked" />
          <StatCard icon={Award} label="Top Practitioners" value={signals?.topPractitioners.length ?? 0} sub="active this month" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Practitioner Leaderboard */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-highlight flex items-center justify-between">
            <span className="font-medium text-sm">Practitioner Leaderboard</span>
            <div className="flex gap-1">
              {(['bookings', 'revenue', 'rating'] as SortBy[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSortBy(s)}
                  className={`px-2 py-1 text-xs rounded border transition-colors capitalize ${sortBy === s ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:text-foreground'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {boardLoading ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : !leaderboard.length ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No data available</p>
          ) : (
            leaderboard.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                <span className="text-sm font-bold text-muted-foreground w-5">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.thisMonthBookings} bookings · ₦{p.thisMonthRevenue.toLocaleString()} revenue
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">{p.trustScore.toFixed(1)}⭐</p>
                  {p.momGrowth !== 0 && (
                    <p className={`text-xs ${p.momGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {p.momGrowth > 0 ? '+' : ''}{p.momGrowth}% MoM
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Top Specialisations & Practitioners */}
        <div className="space-y-4">
          {/* Top Specialisations */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-highlight">
              <span className="font-medium text-sm">Most Searched Interests</span>
            </div>
            {signalsLoading ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</p>
            ) : !signals?.topSpecialisations.length ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No data</p>
            ) : (
              signals.topSpecialisations.map((s, i) => {
                const max = signals.topSpecialisations[0]?.count ?? 1;
                const pct = Math.round((s.count / max) * 100);
                return (
                  <div key={s.term} className="px-4 py-3 border-b border-border last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{s.term}</span>
                      <span className="text-xs text-muted-foreground">{s.count}</span>
                    </div>
                    <div className="h-1.5 bg-highlight rounded-full overflow-hidden">
                      <div className="h-full bg-foreground rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Top Practitioners */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-highlight">
              <span className="font-medium text-sm">Top Practitioners (This Month)</span>
            </div>
            {signalsLoading ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</p>
            ) : !signals?.topPractitioners.length ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No data</p>
            ) : (
              signals.topPractitioners.map((p, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 border-b border-border last:border-0">
                  <span className="text-xs font-bold text-muted-foreground w-4">#{i + 1}</span>
                  <span className="text-sm truncate">{p.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">{p.bookings}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
