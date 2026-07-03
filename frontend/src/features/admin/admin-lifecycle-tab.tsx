import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Users, Zap, Globe, TrendingUp, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface LifecycleData {
  funnel: {
    registered: number;
    consultationBookers: number;
    consultationConversionPct: number;
    devoutSubscribers: number;
    devoutConversionPct: number;
    totalSubscribers: number;
    cancelledSubscribers: number;
    churnPct: number;
  };
  cohorts: {
    thisMonthSignups: number;
    lastMonthSignups: number;
    twoMonthsAgoSignups: number;
    threeMonthsAgoSignups: number;
    retentionM0: number;
    retentionM1Cohort: number;
    activeFromM1: number;
    retentionM1Pct: number;
  };
  geographic: {
    userDistribution: {
      uk: { users: number; pct: number };
      nigeria: { users: number; pct: number };
      usa: { users: number; pct: number };
      other: { users: number; pct: number };
    };
    revenueByGeo: {
      uk: number;
      nigeria: number;
      usa: number;
    };
    forumActivityByGeo: {
      uk: number;
      nigeria: number;
      usa: number;
    };
  };
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="border rounded-lg p-4 space-y-1 border-border bg-card">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

const GEO_COLORS = {
  uk: '#8b5cf6',
  nigeria: '#ef4444',
  usa: '#3b82f6',
  other: '#6b7280',
};

export function AdminLifecycleTab() {
  const { data, isLoading } = useQuery<LifecycleData>({
    queryKey: ['admin', 'analytics', 'lifecycle'],
    queryFn: () => api.get('/admin/analytics/lifecycle').then((r) => r.data),
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

  // Funnel data for visualization
  const funnelData = [
    { stage: 'Registered', users: data.funnel.registered },
    { stage: 'Consultation Booker', users: data.funnel.consultationBookers },
    { stage: 'Devoted Subscriber', users: data.funnel.devoutSubscribers },
  ];

  // Cohort retention data
  const cohortData = [
    { cohort: 'M-3', signups: data.cohorts.threeMonthsAgoSignups },
    { cohort: 'M-2', signups: data.cohorts.twoMonthsAgoSignups },
    { cohort: 'M-1', signups: data.cohorts.lastMonthSignups },
    { cohort: 'This Month', signups: data.cohorts.thisMonthSignups },
  ];

  // Geographic data
  const geoDistributionData = [
    { name: 'UK', value: data.geographic.userDistribution.uk.users, fill: GEO_COLORS.uk },
    { name: 'Nigeria', value: data.geographic.userDistribution.nigeria.users, fill: GEO_COLORS.nigeria },
    { name: 'USA', value: data.geographic.userDistribution.usa.users, fill: GEO_COLORS.usa },
    { name: 'Other', value: data.geographic.userDistribution.other.users, fill: GEO_COLORS.other },
  ];

  const geoRevenueData = [
    { region: 'UK', revenue: data.geographic.revenueByGeo.uk },
    { region: 'Nigeria', revenue: data.geographic.revenueByGeo.nigeria },
    { region: 'USA', revenue: data.geographic.revenueByGeo.usa },
  ];

  const geoForumData = [
    { region: 'UK', posts: data.geographic.forumActivityByGeo.uk },
    { region: 'Nigeria', posts: data.geographic.forumActivityByGeo.nigeria },
    { region: 'USA', posts: data.geographic.forumActivityByGeo.usa },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" /> User Lifecycle Analytics
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Understand user retention, conversion funnels, and geographic distribution.</p>
      </div>

      {/* ──── KEY LIFECYCLE METRICS ──── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={data.funnel.registered}
          sub="Registered users"
        />
        <StatCard
          icon={Target}
          label="Consultation Conversion"
          value={`${data.funnel.consultationConversionPct.toFixed(2)}%`}
          sub="From registration"
        />
        <StatCard
          icon={Zap}
          label="Subscription Rate"
          value={`${data.funnel.devoutConversionPct.toFixed(2)}%`}
          sub="Of registered users"
        />
        <StatCard
          icon={Globe}
          label="Churn Rate"
          value={`${data.funnel.churnPct.toFixed(2)}%`}
          sub="Of subscribers"
        />
      </div>

      {/* ──── CONVERSION FUNNELS ──── */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
          <Target className="w-4 h-4" /> Conversion Funnels
        </h3>

        {/* Funnel 1: Registered → Consultation Booker */}
        <div className="border border-border rounded-lg p-4">
          <p className="font-medium text-sm mb-3">Registered → First Consultation Booked</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Registered Users</span>
              <span className="font-semibold">{data.funnel.registered}</span>
            </div>
            <div className="h-2 bg-highlight rounded-full w-full" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Consultation Bookers</span>
              <span className="font-semibold">{data.funnel.consultationBookers}</span>
            </div>
            <div className="h-2 bg-foreground rounded-full" style={{ width: `${Math.min(100, (data.funnel.consultationBookers / data.funnel.registered) * 100)}%` }} />
            <p className="text-xs text-foreground font-semibold mt-2">Conversion: {data.funnel.consultationConversionPct.toFixed(2)}%</p>
          </div>
        </div>

        {/* Funnel 2: Registered → Devoted Subscriber */}
        <div className="border border-border rounded-lg p-4">
          <p className="font-medium text-sm mb-3">Registered → Devoted Subscriber</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Registered Users</span>
              <span className="font-semibold">{data.funnel.registered}</span>
            </div>
            <div className="h-2 bg-highlight rounded-full w-full" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Devoted Subscribers</span>
              <span className="font-semibold">{data.funnel.devoutSubscribers}</span>
            </div>
            <div className="h-2 bg-foreground rounded-full" style={{ width: `${Math.min(100, (data.funnel.devoutSubscribers / data.funnel.registered) * 100)}%` }} />
            <p className="text-xs text-foreground font-semibold mt-2">Conversion: {data.funnel.devoutConversionPct.toFixed(2)}%</p>
          </div>
        </div>

        {/* Churn */}
        <div className="border border-border rounded-lg p-4">
          <p className="font-medium text-sm mb-3">Subscription Churn</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Active Subscribers</p>
              <p className="text-xl font-semibold">{data.funnel.totalSubscribers - data.funnel.cancelledSubscribers}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Cancelled</p>
              <p className="text-xl font-semibold">{data.funnel.cancelledSubscribers}</p>
            </div>
          </div>
          <p className="text-xs text-foreground font-semibold mt-3 border-t border-border pt-3">Churn Rate: {data.funnel.churnPct.toFixed(2)}%</p>
        </div>
      </div>

      {/* ──── COHORT RETENTION ──── */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
          <TrendingUp className="w-4 h-4" /> Cohort Retention
        </h3>

        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-highlight font-medium text-sm">Monthly Signups & Retention</div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cohortData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="cohort" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="signups" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-6 border-t border-border pt-4 space-y-2">
              <p className="font-medium text-sm">M-1 Cohort Retention</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Signed up in M-1</span>
                <span className="font-semibold">{data.cohorts.retentionM1Cohort}</span>
              </div>
              <div className="h-2 bg-highlight rounded-full w-full" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Still active (4+ weeks later)</span>
                <span className="font-semibold">{data.cohorts.activeFromM1}</span>
              </div>
              <div className="h-2 bg-foreground rounded-full" style={{ width: `${Math.min(100, (data.cohorts.activeFromM1 / data.cohorts.retentionM1Cohort) * 100)}%` }} />
              <p className="text-xs text-foreground font-semibold mt-2">Retention at +4 weeks: {data.cohorts.retentionM1Pct.toFixed(2)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* ──── GEOGRAPHIC BREAKDOWN ──── */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
          <Globe className="w-4 h-4" /> Geographic Breakdown
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Distribution */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-highlight font-medium text-sm">User Distribution</div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={geoDistributionData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name} ${(value / (data.geographic.userDistribution.uk.users + data.geographic.userDistribution.nigeria.users + data.geographic.userDistribution.usa.users + data.geographic.userDistribution.other.users) * 100).toFixed(1)}%`} outerRadius={80} dataKey="value">
                    {geoDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-4 space-y-2 text-sm border-t border-border pt-4">
                {Object.entries(data.geographic.userDistribution).map(([region, dataEntry]) => (
                  <div key={region} className="flex items-center justify-between">
                    <span className="text-muted-foreground capitalize">{region}</span>
                    <span className="font-semibold">
                      {dataEntry.users} ({dataEntry.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue by Geography */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-highlight font-medium text-sm">Revenue by Region</div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={geoRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`₦${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Forum Activity by Geography */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-highlight font-medium text-sm">Forum Activity by Region</div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={geoForumData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="region" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [`${Number(value).toLocaleString()} posts`, 'Posts']}
                />
                <Bar dataKey="posts" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Key Insights Summary */}
      <div className="border border-border rounded-lg p-4 bg-highlight/30">
        <p className="font-medium text-sm mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" /> Key Insights
        </p>
        <ul className="space-y-2 text-sm text-foreground">
          <li>
            • <strong>{data.funnel.consultationConversionPct.toFixed(2)}%</strong> of users book at least one consultation
          </li>
          <li>
            • <strong>{data.funnel.devoutConversionPct.toFixed(2)}%</strong> of users subscribe to Devoted
          </li>
          <li>
            • <strong>{data.cohorts.retentionM1Pct.toFixed(2)}%</strong> of M-1 cohort still active after 4+ weeks
          </li>
          <li>
            • <strong>Nigeria</strong> leads in user distribution at <strong>{data.geographic.userDistribution.nigeria.pct}%</strong>
          </li>
          <li>
            • Forum is most active in <strong>Nigeria</strong> with <strong>{data.geographic.forumActivityByGeo.nigeria}</strong> posts
          </li>
        </ul>
      </div>
    </div>
  );
}
