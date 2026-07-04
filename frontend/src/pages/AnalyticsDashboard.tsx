import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import MetricCard from '@/components/analytics/MetricCard';
import {
  TimelineChart,
  EngagementChart,
  DistributionChart,
  ComparisonChart,
} from '@/components/analytics/AnalyticsCharts';
import AnalyticsService from '@/services/analyticsService';
import ExportButton from '@/components/ExportButton';
import './AnalyticsDashboard.css';
import { STAGGER_DELAY_1, STAGGER_DELAY_3, STAGGER_DELAY_4 } from '@/shared/constants/motion';

interface DateRange {
  startDate: string;
  endDate: string;
}

const AnalyticsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const [selectedMetric, setSelectedMetric] = useState<'sessions' | 'users' | 'engagement'>(
    'sessions'
  );

  // Fetch analytics data
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['analytics', dateRange],
    queryFn: () =>
      AnalyticsService.getDashboardData(dateRange.startDate, dateRange.endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch timeline data
  const { data: timelineData } = useQuery({
    queryKey: ['timeline', selectedMetric],
    queryFn: () => AnalyticsService.getTimelineData(30, selectedMetric),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch top items
  const { data: topFeatures } = useQuery({
    queryKey: ['top-features'],
    queryFn: () => AnalyticsService.getTopItems('features'),
    staleTime: 5 * 60 * 1000,
  });

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const exportData = {
    title: 'Analytics Report',
    data: dashboardData || {},
  };

  if (isLoading) {
    return (
      <div className="analytics-loading">
        <div className="spinner" />
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Track engagement and user behavior</p>
        </div>

        <div className="analytics-controls">
          <div className="date-filters">
            <div className="date-input-group">
              <label>From</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={e => handleDateChange('startDate', e.target.value)}
              />
            </div>
            <div className="date-input-group">
              <label>To</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={e => handleDateChange('endDate', e.target.value)}
              />
            </div>
          </div>

          <div className="button-group">
            <button className="btn-icon" onClick={() => refetch()} title="Refresh">
              <RefreshCw size={18} />
            </button>
            <ExportButton data={exportData} formats={['json', 'csv']} buttonLabel="Export" />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <section className="metrics-section">
        <h2 className="section-title">Key Metrics</h2>
        <div className="metrics-grid">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <MetricCard
              label="Total Users"
              value={dashboardData?.summary?.totalUsers || 0}
              change={12}
              changeType="positive"
              color="blue"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: STAGGER_DELAY_1 }}
          >
            <MetricCard
              label="Active Users"
              value={dashboardData?.summary?.activeUsers || 0}
              change={8}
              changeType="positive"
              color="green"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: STAGGER_DELAY_3 }}
          >
            <MetricCard
              label="Total Sessions"
              value={dashboardData?.summary?.totalSessions || 0}
              change={-3}
              changeType="negative"
              color="purple"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: STAGGER_DELAY_4 }}
          >
            <MetricCard
              label="Conversion Rate"
              value={`${dashboardData?.summary?.conversionRate || 0}%`}
              change={5}
              changeType="positive"
              color="orange"
            />
          </motion.div>
        </div>
      </section>

      {/* Metric Selector */}
      <section className="metric-selector-section">
        <div className="metric-tabs">
          {['sessions', 'users', 'engagement'].map(metric => (
            <button
              key={metric}
              className={`metric-tab ${selectedMetric === metric ? 'active' : ''}`}
              onClick={() => setSelectedMetric(metric as typeof selectedMetric)}
            >
              {metric.charAt(0).toUpperCase() + metric.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Charts Section */}
      <section className="charts-section">
        <div className="charts-grid">
          {timelineData && (
            <TimelineChart
              title={`${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Trend`}
              data={timelineData}
              dataKeys={[selectedMetric]}
            />
          )}

          {topFeatures && (
            <EngagementChart
              title="Top Features"
              data={topFeatures.slice(0, 5)}
            />
          )}

          {topFeatures && (
            <DistributionChart
              title="Feature Distribution"
              data={topFeatures.slice(0, 5)}
              nameKey="name"
              dataKey="value"
            />
          )}

          {timelineData && (
            <ComparisonChart
              title="Period Comparison"
              data={timelineData.slice(0, 7)}
              dataKeys={['sessions', 'users']}
            />
          )}
        </div>
      </section>

      {/* Footer */}
      <div className="analytics-footer">
        <p>Data last updated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
