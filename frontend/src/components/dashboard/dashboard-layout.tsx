import React from 'react';
import { SidebarLayout } from '@/shared/components/sidebar-layout';
import { DashboardHeader } from './dashboard-header';
import { DashboardStats } from './dashboard-stats';
import { RecentActivity } from './recent-activity';
import { UpcomingSessions } from './upcoming-sessions';
import { QuickActions } from './quick-actions';

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
      <div className="flex flex-col gap-6 p-6">
        <DashboardHeader userName={userName} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardStats 
            totalSessions={stats.totalSessions}
            upcomingSessions={stats.upcomingSessions}
            pendingRequests={stats.pendingRequests}
            completedTasks={stats.completedTasks}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentActivity activities={recentActivities} />
          </div>
          <div>
            <UpcomingSessions sessions={upcomingSessions} />
            <QuickActions className="mt-4" />
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export { DashboardLayout };