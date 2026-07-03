import React from 'react';
import { SidebarLayout } from '@/shared/components/sidebar-layout';
import { DashboardHeader } from './dashboard-header';
import { DashboardStats } from './dashboard-stats';
import { RecentActivity } from './recent-activity';
import { UpcomingSessions } from './upcoming-sessions';
import { QuickActions } from './quick-actions';
import { PerformanceMetrics } from './performance-metrics';

interface DashboardLayoutProps {
  userName: string;
  stats: {
    totalSessions: number;
    upcomingSessions: number;
    pendingRequests: number;
    completedTasks: number;
  };
  recentActivities: any[];
  upcomingSessions: any[];
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  userName,
  stats,
  recentActivities,
  upcomingSessions
}) => {
  
  return (
    <SidebarLayout>
      <div className="flex flex-col gap-6 p-2 sm:p-4 md:p-6">
        <DashboardHeader userName={userName} />
        
        <section aria-labelledby="dashboard-stats-heading" className="mb-6">
          <h2 id="dashboard-stats-heading" className="sr-only">Dashboard Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <DashboardStats 
              totalSessions={stats.totalSessions}
              upcomingSessions={stats.upcomingSessions}
              pendingRequests={stats.pendingRequests}
              completedTasks={stats.completedTasks}
            />
          </div>
        </section>
        
        <section aria-labelledby="performance-metrics-heading" className="mb-6">
          <h2 id="performance-metrics-heading" className="sr-only">Performance Metrics</h2>
          <PerformanceMetrics />
        </section>
        
        <section aria-labelledby="dashboard-activities-heading" className="mb-6">
          <h2 id="dashboard-activities-heading" className="sr-only">Recent Activities and Upcoming Sessions</h2>
          <div className="grid grid-cols-1 gap-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:flex-1" aria-label="Recent Activity">
                <RecentActivity activities={recentActivities} />
              </div>
              <div className="lg:w-1/3" aria-label="Upcoming Sessions">
                <UpcomingSessions sessions={upcomingSessions} />
                <QuickActions className="mt-4" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </SidebarLayout>
  );
};

export { DashboardLayout };