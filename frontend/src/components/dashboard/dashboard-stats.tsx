import React from 'react';
import { Clock, CheckCircle, MessageCircle, Users } from 'lucide-react';

interface DashboardStatsProps {
  totalSessions: number;
  upcomingSessions: number;
  pendingRequests: number;
  completedTasks: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalSessions,
  upcomingSessions,
  pendingRequests,
  completedTasks
}) => {
  const stats = [
    {
      title: 'Total Sessions',
      value: totalSessions,
      icon: <Users className="w-6 h-6 text-primary" />,
      change: '+12% from last month'
    },
    {
      title: 'Upcoming Sessions',
      value: upcomingSessions,
      icon: <Clock className="w-6 h-6 text-success" />,
      change: 'Scheduled for this week'
    },
    {
      title: 'Pending Requests',
      value: pendingRequests,
      icon: <MessageCircle className="w-6 h-6 text-warning" />,
      change: 'Requires attention'
    },
    {
      title: 'Completed Tasks',
      value: completedTasks,
      icon: <CheckCircle className="w-6 h-6 text-success" />,
      change: '+8% from last month'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className="bg-card border border-border rounded-xl p-4 flex flex-col"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              {stat.icon}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">{stat.change}</p>
        </div>
      ))}
    </div>
  );
};

export { DashboardStats };