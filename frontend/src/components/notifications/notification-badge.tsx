import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationBadgeProps {
  count?: number;
  hasUnread?: boolean;
  onClick?: () => void;
  className?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count = 0,
  hasUnread = false,
  onClick,
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      <button 
        onClick={onClick}
        className="relative p-2 rounded-full hover:bg-accent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label={count > 0 ? `${count} unread notifications` : 'Notifications'}
      >
        <Bell 
          className={`h-5 w-5 ${hasUnread ? 'text-primary' : 'text-muted-foreground'}`} 
        />
        {count > 0 && (
          <span 
            className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 bg-destructive text-white text-xs rounded-full"
            aria-label={`${count} notifications`}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
    </div>
  );
};

export { NotificationBadge };