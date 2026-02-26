import React from 'react';
import { Calendar, Clock, User, CheckCircle } from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'session' | 'message' | 'task' | 'notification';
  user?: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'session': return <Calendar className="w-4 h-4 text-primary" />;
      case 'message': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'task': return <CheckCircle className="w-4 h-4 text-warning" />;
      case 'notification': return <User className="w-4 h-4 text-muted-foreground" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
      
      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map(activity => (
            <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
              <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">{activity.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                
                <div className="flex items-center gap-2 mt-1">
                  {activity.user && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {activity.user}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {activity.time}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent activity</p>
            <p className="text-sm mt-1">Your activity will appear here</p>
          </div>
        )}
      </div>
      
      <button className="w-full mt-4 py-2 text-center text-primary hover:underline text-sm font-medium">
        View all activity
      </button>
    </div>
  );
};

export { RecentActivity };