import React from 'react';
import { Plus, Calendar, MessageSquare, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickActionsProps {
  className?: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({ className = "" }) => {
  const actions = [
    { 
      title: 'Book New Session', 
      icon: <Calendar className="w-5 h-5" />, 
      onClick: () => {} 
    },
    { 
      title: 'Send Message', 
      icon: <MessageSquare className="w-5 h-5" />, 
      onClick: () => {} 
    },
    { 
      title: 'Add Note', 
      icon: <Plus className="w-5 h-5" />, 
      onClick: () => {} 
    },
    { 
      title: 'Settings', 
      icon: <Settings className="w-5 h-5" />, 
      onClick: () => {} 
    },
  ];

  return (
    <div className={`bg-card border border-border rounded-xl p-6 ${className}`}>
      <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className="flex flex-col items-center justify-center p-4 border border-border rounded-lg hover:bg-accent transition-colors group"
          >
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              {action.icon}
            </div>
            <span className="mt-2 text-sm font-medium text-foreground text-center">
              {action.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export { QuickActions };