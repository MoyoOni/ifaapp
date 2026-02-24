import React from 'react';
import NotificationCenter from '@/features/notifications/notification-center';

const NotificationsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <NotificationCenter />
    </div>
  );
};

export default NotificationsPage;
