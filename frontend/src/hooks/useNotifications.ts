import { useEffect, useState, useCallback } from 'react';
import notificationService, {
  Notification,
  NotificationPreferences,
} from '@/services/notificationService';

/**
 * Hook for managing notifications
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Subscribe to notifications
    const unsubscribe = notificationService.subscribe(notification => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return unsubscribe;
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    notificationService.markAsRead(notificationId);
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const clearAll = useCallback(() => {
    notificationService.clearAll();
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const setPreferences = useCallback((prefs: Partial<NotificationPreferences>) => {
    notificationService.setPreferences(prefs);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
    setPreferences,
  };
};

export default useNotifications;
