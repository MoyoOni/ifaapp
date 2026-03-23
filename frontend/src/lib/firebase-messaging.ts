import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import api from './api';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.messagingSenderId
);

let messaging: Messaging | null = null;

function getFirebaseMessaging(): Messaging | null {
  if (!isConfigured) return null;
  if (!('serviceWorker' in navigator)) return null;

  try {
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    return getMessaging(app);
  } catch {
    return null;
  }
}

/**
 * Request notification permission and register the FCM token with the backend.
 * Safe to call on every login — deduped server-side by upsert.
 */
export async function registerPushNotifications(): Promise<void> {
  if (!isConfigured) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const sw = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    messaging = getFirebaseMessaging();
    if (!messaging) return;

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: sw,
    });

    if (token) {
      await api.post('/notifications/register-device-token', {
        token,
        platform: 'WEB',
        deviceType: navigator.userAgent,
      });

      localStorage.setItem('fcm_token', token);
    }
  } catch (err) {
    // Never break the app — push is non-critical
    console.warn('[FCM] Failed to register push notifications:', err);
  }
}

/**
 * Deregister FCM token on logout.
 */
export async function deregisterPushNotifications(): Promise<void> {
  const token = localStorage.getItem('fcm_token');
  if (!token) return;
  try {
    await api.post('/notifications/deregister-device-token', { token });
    localStorage.removeItem('fcm_token');
  } catch {
    // non-critical
  }
}

/**
 * Listen for foreground push messages and show a browser notification.
 */
export function onForegroundMessage(callback: (payload: { title: string; body: string; data?: Record<string, string> }) => void): () => void {
  if (!messaging) {
    messaging = getFirebaseMessaging();
  }
  if (!messaging) return () => {};

  const unsub = onMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? 'Ìlú Àṣẹ';
    const body = payload.notification?.body ?? '';
    const data = payload.data as Record<string, string> | undefined;
    callback({ title, body, data });
  });

  return unsub;
}
