import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NotificationProvider, useNotification } from './notification-context';

// Mock wrapper component to provide the context
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NotificationProvider>{children}</NotificationProvider>
);

describe('NotificationContext', () => {
  it('should initialize with empty notifications', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });
    
    expect(result.current.notifications).toEqual([]);
  });

  it('should add a notification', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });
    
    const newNotification = {
      title: 'Test Notification',
      description: 'This is a test notification',
      timestamp: new Date().toISOString(),
      type: 'info'
    };
    
    act(() => {
      result.current.addNotification(newNotification);
    });
    
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject({
      ...newNotification,
      read: false
    });
  });

  it('should mark a notification as read', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });
    
    const newNotification = {
      title: 'Test Notification',
      description: 'This is a test notification',
      timestamp: new Date().toISOString(),
      type: 'info'
    };
    
    act(() => {
      result.current.addNotification(newNotification);
    });
    
    const notificationId = result.current.notifications[0].id;
    
    act(() => {
      result.current.markAsRead(notificationId);
    });
    
    expect(result.current.notifications[0].read).toBe(true);
  });

  it('should mark all notifications as read', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });
    
    const notification1 = {
      title: 'First Notification',
      description: 'This is the first test notification',
      timestamp: new Date().toISOString(),
      type: 'info'
    };
    
    const notification2 = {
      title: 'Second Notification',
      description: 'This is the second test notification',
      timestamp: new Date().toISOString(),
      type: 'warning'
    };
    
    act(() => {
      result.current.addNotification(notification1);
      result.current.addNotification(notification2);
    });
    
    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.notifications.every(n => n.read === false)).toBe(true);
    
    act(() => {
      result.current.markAllAsRead();
    });
    
    expect(result.current.notifications.every(n => n.read === true)).toBe(true);
  });

  it('should remove a specific notification', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });
    
    const notification1 = {
      title: 'First Notification',
      description: 'This is the first test notification',
      timestamp: new Date().toISOString(),
      type: 'info'
    };
    
    const notification2 = {
      title: 'Second Notification',
      description: 'This is the second test notification',
      timestamp: new Date().toISOString(),
      type: 'warning'
    };
    
    act(() => {
      result.current.addNotification(notification1);
      result.current.addNotification(notification2);
    });
    
    // Get the ID of the first notification to remove
    const firstNotificationId = result.current.notifications.find(n => n.title === 'First Notification')!.id;
    
    // Verify we have both notifications before removal
    expect(result.current.notifications).toHaveLength(2);
    
    act(() => {
      result.current.removeNotification(firstNotificationId);
    });
    
    // After removal, we should have only one notification left
    expect(result.current.notifications).toHaveLength(1);
    // And it should be the second notification
    expect(result.current.notifications[0].title).toBe('Second Notification');
  });

  it('should clear all notifications', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });
    
    const notification1 = {
      title: 'First Notification',
      description: 'This is the first test notification',
      timestamp: new Date().toISOString(),
      type: 'info'
    };
    
    const notification2 = {
      title: 'Second Notification',
      description: 'This is the second test notification',
      timestamp: new Date().toISOString(),
      type: 'warning'
    };
    
    act(() => {
      result.current.addNotification(notification1);
      result.current.addNotification(notification2);
    });
    
    expect(result.current.notifications).toHaveLength(2);
    
    act(() => {
      result.current.clearAllNotifications();
    });
    
    expect(result.current.notifications).toHaveLength(0);
  });
});