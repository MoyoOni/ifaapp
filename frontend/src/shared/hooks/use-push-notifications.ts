import { useEffect } from 'react';
import { useAuth } from '@/shared/hooks/use-auth';
import { registerPushNotifications, onForegroundMessage, deregisterPushNotifications } from '@/lib/firebase-messaging';

// Re-export for logout usage
export { deregisterPushNotifications };

/**
 * Registers FCM push notifications after login and listens for foreground messages.
 * Mount this once at the app shell level.
 */
export function usePushNotifications() {
  const { user } = useAuth();

  // Deliberately depends on `user?.id`, not `user`, so this doesn't
  // re-register push notifications every time an unrelated user field
  // (e.g. profile edits) changes -- only login/logout should re-run it.
  useEffect(() => {
    if (!user) return;

    // Register token (requests permission first time, then silently refreshes)
    registerPushNotifications();

    // Forward foreground messages to the browser Notification API
    const unsub = onForegroundMessage(({ title, body, data }) => {
      if (Notification.permission === 'granted') {
        const n = new Notification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          data,
        });
        // Auto-close after 6 seconds
        setTimeout(() => n.close(), 6000);
        // Navigate on click
        n.onclick = () => {
          window.focus();
          if (data?.clickAction) window.location.pathname = data.clickAction;
          n.close();
        };
      }
    });

    return () => unsub();
    // Deliberately depends on `user?.id`, not `user`, so this doesn't
    // re-register push notifications every time an unrelated user field
    // (e.g. profile edits) changes -- only login/logout should re-run it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);
}
