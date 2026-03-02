import React from 'react';
import { Calendar, Bell, Search } from 'lucide-react';

interface DashboardHeaderProps {
  userName: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Good morning, {userName}!</h1>
        <p className="text-muted-foreground">Here's what's happening with your account today.</p>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <button className="p-2 rounded-lg border border-input hover:bg-accent" aria-label="View notifications" title="Notifications">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </button>
        
        <button className="p-2 rounded-lg border border-input hover:bg-accent" aria-label="View calendar" title="Calendar">
          <Calendar className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export { DashboardHeader };