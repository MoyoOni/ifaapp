import React, { useState, useEffect } from 'react';
import { X, Bell, Calendar, MessageCircle, UserPlus, Award } from 'lucide-react';
import { NotificationBadge } from './notification-badge';

interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'urgent';
  actionLabel?: string;
  actionUrl?: string;
}

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onClose
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'success':
        return <Award className="h-5 w-5 text-success" />;
      case 'warning':
        return <UserPlus className="h-5 w-5 text-warning" />;
      case 'urgent':
        return <Calendar className="h-5 w-5 text-destructive" />;
      default:
        return <MessageCircle className="h-5 w-5 text-primary" />;
    }
  };

  const handleTogglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <NotificationBadge 
        count={unreadCount} 
        hasUnread={unreadCount > 0} 
        onClick={handleTogglePanel}
        className="ml-2"
      />
      
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
          <div 
            className="fixed right-4 top-16 w-full max-w-md bg-background border border-border rounded-lg shadow-lg z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-lg">Notifications</h3>
              <button 
                onClick={() => {
                  onMarkAllAsRead();
                  onClose();
                  setIsOpen(false);
                }}
                className="text-sm text-primary hover:underline"
              >
                Mark all as read
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Bell className="mx-auto h-12 w-12 text-muted" />
                  <p className="mt-2">No notifications yet</p>
                  <p className="text-sm">New notifications will appear here</p>
                </div>
              ) : (
                <ul>
                  {notifications.map((notification) => (
                    <li 
                      key={notification.id} 
                      className={`border-b border-border last:border-0 p-4 ${!notification.read ? 'bg-muted/10' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className="pt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <h4 className={`font-medium truncate ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2"></span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 mb-2">
                            {notification.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end mt-3 space-x-2">
                        <button
                          onClick={() => onMarkAsRead(notification.id)}
                          className="text-xs px-3 py-1 rounded border border-border hover:bg-accent"
                        >
                          Mark as read
                        </button>
                        {notification.actionLabel && notification.actionUrl && (
                          <a 
                            href={notification.actionUrl}
                            className="text-xs px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            {notification.actionLabel}
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="p-3 border-t border-border flex justify-end">
              <button 
                onClick={() => {
                  onClose();
                  setIsOpen(false);
                }}
                className="p-2 rounded-full hover:bg-accent"
                aria-label="Close notifications"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { NotificationPanel, type Notification };