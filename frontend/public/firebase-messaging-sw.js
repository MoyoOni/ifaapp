/* eslint-disable no-undef */
// Firebase Cloud Messaging Service Worker
// This file is served from the root (/) so FCM can find it.
// It is intentionally NOT bundled by Vite — it runs in the SW scope.

importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');

// Config is injected at build time via a separate endpoint or hardcoded here.
// We read it from the SW script URL query params set by the frontend.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    const config = event.data.config;
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
      const messaging = firebase.messaging();

      // Handle background messages
      messaging.onBackgroundMessage((payload) => {
        const title = payload.notification?.title ?? 'Ìlú Àṣẹ';
        const body = payload.notification?.body ?? '';
        const data = payload.data ?? {};

        self.registration.showNotification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          data,
          actions: [{ action: 'open', title: 'Open' }],
        });
      });
    }
  }
});

// Also support direct initialisation via query params (fallback)
const urlParams = new URL(location.href).searchParams;
const apiKey = urlParams.get('apiKey');
const projectId = urlParams.get('projectId');
const messagingSenderId = urlParams.get('messagingSenderId');
const appId = urlParams.get('appId');

if (apiKey && projectId && messagingSenderId && appId) {
  if (!firebase.apps.length) {
    firebase.initializeApp({ apiKey, projectId, messagingSenderId, appId });
  }
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title ?? 'Ìlú Àṣẹ';
    const body = payload.notification?.body ?? '';
    const clickAction = payload.data?.clickAction ?? '/';

    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: { clickAction },
      actions: [{ action: 'open', title: 'Open App' }],
    });
  });
}

// Handle notification click — navigate to the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const clickAction = event.notification.data?.clickAction ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(self.location.origin + clickAction);
      } else {
        clients.openWindow(self.location.origin + clickAction);
      }
    })
  );
});
