import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Device } from '@capacitor/device';
import api from './api';
import { logger } from '@/shared/utils/logger';

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
 * Register push notifications using Capacitor's native plugin for mobile apps
 */
async function registerNativePush(): Promise<void> {
  try {
    // Called on every login — clear prior listeners first so they don't stack
    await PushNotifications.removeAllListeners();

    // Request permission (native)
    const permStatus = await PushNotifications.requestPermissions();
    if (permStatus.receive === 'granted') {
      // Register with FCM (gets device token)
      await PushNotifications.register();
    }

    // Listen for the token and send it to your backend
    PushNotifications.addListener('registration', async (token) => {
      const deviceInfo = await Device.getInfo();
      await api.post('/notifications/register-device-token', {
        token: token.value,
        platform: deviceInfo.platform, // 'ios' or 'android'
        deviceInfo: {
          model: deviceInfo.model,
          osVersion: deviceInfo.osVersion,
        },
      });
    });

    // Handle incoming notifications
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      // Show a toast or update the UI
      console.log('Push received:', notification);
    });

    // Handle notification taps (opens app)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      // Navigate to the relevant screen (e.g., order detail)
      console.log('Push tapped:', action);
    });

    // Handle notification permission denied
    PushNotifications.addListener('registrationError', (error) => {
      logger.warn('[Capacitor FCM] Registration error:', error);
    });
  } catch (err) {
    logger.warn('[Capacitor FCM] Failed to register push notifications:', err);
  }
}

/**
 * Register push notifications using web FCM for browsers
 */
async function registerWebPush(): Promise<void> {
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
    logger.warn('[FCM] Failed to register push notifications:', err);
  }
}

/**
 * Request notification permission and register the FCM token with the backend.
 * Uses Capacitor native plugin on mobile, web FCM on browsers.
 * Safe to call on every login — deduped server-side by upsert.
 */
export async function registerPushNotifications(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    // Use Capacitor push plugin for iOS/Android
    await registerNativePush();
  } else {
    // Use web FCM service worker for browsers
    await registerWebPush();
  }
}

/**
 * Deregister FCM token on logout.
 */
export async function deregisterPushNotifications(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    // On native platforms, we just remove the token from local storage
    // Actual deregistration happens server-side when token expires
    localStorage.removeItem('fcm_token');
  } else {
    // On web, we might want to call the backend to deregister
    const token = localStorage.getItem('fcm_token');
    if (!token) return;
    try {
      await api.post('/notifications/deregister-device-token', { token });
      localStorage.removeItem('fcm_token');
    } catch {
      // non-critical
    }
  }
}

/**
 * Listen for foreground push messages and show a browser notification.
 */
export function onForegroundMessage(callback: (payload: { title: string; body: string; data?: Record<string, string> }) => void): () => void {
  if (Capacitor.isNativePlatform()) {
    // On native platforms, push notifications are handled by the native plugin
    // This function is mainly for web browsers
    return () => {};
  }

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