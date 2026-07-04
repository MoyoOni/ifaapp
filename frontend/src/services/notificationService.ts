/**
 * Notification Service
 * Manages real-time notifications via WebSocket and Push API
 */

import io from 'socket.io-client';
import { logger } from '@/shared/utils/logger';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'alert';
  action?: {
    label: string;
    href?: string;
  };
  timestamp: Date;
  read: boolean;
  imageUrl?: string;
}

export interface NotificationPreferences {
  enablePush: boolean;
  enableSound: boolean;
  enableEmail: boolean;
  quietHours?: {
    start: string;
    end: string;
  };
  categories: {
    [key: string]: boolean;
  };
}

type NotificationListener = (notification: Notification) => void;

class NotificationService {
  private socket: ReturnType<typeof io> | null = null;
  private listeners: NotificationListener[] = [];
  private notifications: Notification[] = [];
  private preferences: NotificationPreferences | null = null;
  private audioContext: AudioContext | null = null;

  /**
   * Initialize notification service
   */
  initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const socketUrl = process.env.VITE_API_URL || 'http://localhost:3001';
        this.socket = io(socketUrl, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ['websocket', 'polling'],
        });

        // Socket event handlers
        this.socket.on('connect', () => {
          resolve();
        });

        this.socket.on('notification', (notification: Notification) => {
          this.handleNotification(notification);
        });

        this.socket.on('notifications:batch', (notifications: Notification[]) => {
          notifications.forEach(n => this.handleNotification(n));
        });

        this.socket.on('disconnect', () => {});

        this.socket.on('error', (error) => {
          logger.error('Notification service error:', error);
          reject(error);
        });

        // Request push notification permission
        this.requestPushPermission();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Request push notification permission
   */
  private async requestPushPermission(): Promise<void> {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      return;
    }

    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Subscribe to push notifications
          this.subscribeToPushNotifications();
        }
      } catch (error) {
        logger.error('Push notification permission error:', error);
      }
    }
  }

  /**
   * Subscribe to push notifications
   */
  private async subscribeToPushNotifications(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.VITE_VAPID_PUBLIC_KEY || ''
        ),
      });

      // Send subscription to server
      if (this.socket) {
        this.socket.emit('push:subscribe', subscription);
      }
    } catch (error) {
      logger.error('Push subscription error:', error);
    }
  }

  /**
   * Handle incoming notification
   */
  private handleNotification(notification: Notification): void {
    const enriched: Notification = {
      ...notification,
      timestamp: new Date(notification.timestamp),
      read: false,
    };

    this.notifications.push(enriched);

    // Notify listeners
    this.listeners.forEach(listener => listener(enriched));

    // Show browser notification if enabled
    if (this.shouldShowNotification(enriched)) {
      this.showBrowserNotification(enriched);
    }

    // Play sound if enabled
    if (this.preferences?.enableSound) {
      this.playNotificationSound();
    }
  }

  /**
   * Check if notification should be shown based on preferences
   */
  private shouldShowNotification(notification: Notification): boolean {
    if (!this.preferences) return true;

    // Check if category is enabled
    const categoryKey = `${notification.type}_notifications`;
    if (this.preferences.categories[categoryKey] === false) {
      return false;
    }

    // Check quiet hours
    if (this.preferences.quietHours) {
      const now = new Date();
      const hours = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      if (hours >= this.preferences.quietHours.start && hours <= this.preferences.quietHours.end) {
        return false;
      }
    }

    return true;
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(notification: Notification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notification.title, {
          body: notification.message,
          icon: notification.imageUrl || '/logo.png',
          tag: notification.id,
          requireInteraction: notification.type === 'alert',
        });
      } catch (error) {
        logger.error('Browser notification error:', error);
      }
    }
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = this.audioContext;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (error) {
      logger.warn('Notification sound error:', error);
    }
  }

  /**
   * Subscribe to notification updates
   */
  subscribe(listener: NotificationListener): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Get all notifications
   */
  getNotifications(): Notification[] {
    return this.notifications;
  }

  /**
   * Get unread notifications count
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      if (this.socket) {
        this.socket.emit('notification:read', { notificationId });
      }
    }
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications = [];
    if (this.socket) {
      this.socket.emit('notifications:clear');
    }
  }

  /**
   * Set notification preferences
   */
  setPreferences(preferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences } as NotificationPreferences;
    if (this.socket) {
      this.socket.emit('preferences:update', this.preferences);
    }
  }

  /**
   * Disconnect service
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

// Export singleton instance
export default new NotificationService();
