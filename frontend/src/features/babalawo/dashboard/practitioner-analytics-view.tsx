import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie } from 'recharts';
import { TrendingUp, Users, Star, Calendar, Clock, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface PractitionerAnalyticsViewProps {
  userId: string;
}

const PIE_COLORS = ['#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fef3c7'];

const PractitionerAnalyticsView: React.FC<PractitionerAnalyticsViewProps> = ({ userId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['practitioner-analytics', userId],
    queryFn: () => api.get(`/practitioners/analytics`).then(r => r.data),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-highlight" />
      </div>
    );
  }

  const monthlySessionsData: Array<{ month: string; sessions: number }> = data?.monthlySessions ?? [];
  const serviceOfferingsData: Array<{ service: string; count: number }> = data?.serviceOfferings ?? [];
  const avgRatingOverTime: Array<{ month: string; rating: number }> = data?.avgRatingOverTime ?? [];
  const incomeOverTime: Array<{ month: string; income: number }> = data?.incomeOverTime ?? [];
  const gp = data?.guidancePlanStats as { total: number; completed: number; inProgress: number; completionRate: number; avgItemsCompleted: number } | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp size={24} className="text-highlight" /> Practice Analytics
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Track your practice performance and growth</p>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Users size={16} /> Total Sessions
          </div>
          <p className="text-3xl font-bold text-foreground">{data?.totalSessions ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">since {data?.memberSince ? new Date(data.memberSince).toLocaleDateString() : 'joining'}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Users size={16} /> Unique Clients
          </div>
          <p className="text-3xl font-bold text-foreground">{data?.totalClients ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">{data?.repeatClientRate?.toFixed(1) ?? 0}% return rate</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Star size={16} /> Avg Rating
          </div>
          <p className="text-3xl font-bold text-foreground">{data?.avgRating?.toFixed(1) ?? '–'}</p>
          <p className="text-xs text-muted-foreground mt-1">overall rating</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Calendar size={16} /> Most Popular
          </div>
          <p className="text-xl font-bold text-foreground">{data?.mostPopularService || 'N/A'}</p>
          <p className="text-xs text-muted-foreground mt-1">service offering</p>
        </div>
      </div>

      {/* Monthly sessions chart */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">Monthly Sessions (Last 6 Months)</h3>
        {monthlySessionsData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlySessionsData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--foreground)' }} />
              <Bar dataKey="sessions" name="Sessions" fill="#d97706" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">No session data available</div>
        )}
      </div>

      {/* Average rating over time */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">Average Rating Over Time</h3>
        {avgRatingOverTime.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={avgRatingOverTime} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--foreground)' }} />
              <Line type="monotone" dataKey="rating" stroke="#16a34a" strokeWidth={2.5} dot={{ fill: '#16a34a', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">No rating history yet</div>
        )}
      </div>

      {/* Service offerings + practice insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Service Offerings Distribution</h3>
          {serviceOfferingsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={serviceOfferingsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  dataKey="count"
                  nameKey="service"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  fill="#d97706"
                >
                  {serviceOfferingsData.map((_entry, index) => (
                    <rect key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} sessions`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">No service offering data</div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Practice Insights</h3>
          <div className="space-y-4">
            {[
              { icon: <Calendar size={18} />, label: 'Busiest Day', value: data?.busiestDayOfWeek || 'N/A' },
              { icon: <Clock size={18} />, label: 'Peak Time', value: data?.busiestTimeOfDay || 'N/A' },
              { icon: <Users size={18} />, label: 'Return Clients', value: `${data?.repeatClientRate?.toFixed(1) ?? 0}%` },
              { icon: <Star size={18} />, label: 'Avg Rating', value: `${data?.avgRating?.toFixed(1) ?? 0}★` },
              { icon: <TrendingUp size={18} />, label: 'Total Sessions', value: String(data?.totalSessions ?? 0) },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                <div className="flex items-center gap-2 text-highlight">{icon}<span className="text-sm font-medium text-foreground">{label}</span></div>
                <span className="text-sm font-bold text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Income over time */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">Income Over Time (Last 6 Months)</h3>
        {incomeOverTime.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={incomeOverTime} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--foreground)' }}
                formatter={(v: number | undefined) => [`₦${(v ?? 0).toLocaleString()}`, 'Income']}
              />
              <Bar dataKey="income" name="Income" fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">No income data available</div>
        )}
      </div>

      {/* Guidance plan completion */}
      {gp && gp.total > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Guidance Plan Outcomes</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Issued', value: String(gp.total) },
              { label: 'Completed', value: String(gp.completed) },
              { label: 'In Progress', value: String(gp.inProgress) },
              { label: 'Completion Rate', value: `${gp.completionRate}%` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-muted/40 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
          {gp.avgItemsCompleted > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Avg items completed per plan</span>
                <span className="font-semibold text-foreground">{gp.avgItemsCompleted}%</span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  /* eslint-disable-next-line react/forbid-dom-props */
                  style={{ width: `${gp.avgItemsCompleted}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PractitionerAnalyticsView;
