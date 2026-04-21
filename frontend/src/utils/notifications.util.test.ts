import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotification } from '../contexts/notification-context';
import { useNotificationUtils, createNotification } from './notifications.util';

// Mock the useNotification hook with a proper async import
vi.mock('../contexts/notification-context', async () => {
  const actual = await vi.importActual('../contexts/notification-context');
  return {
    ...actual,
    useNotification: vi.fn()
  };
});

const mockAddNotification = vi.fn();
const mockMarkAsRead = vi.fn();
const mockMarkAllAsRead = vi.fn();
const mockRemoveNotification = vi.fn();
const mockClearAllNotifications = vi.fn();

describe('Notification Utilities', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (useNotification as vi.Mock).mockReturnValue({
      notifications: [],
      addNotification: mockAddNotification,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      removeNotification: mockRemoveNotification,
      clearAllNotifications: mockClearAllNotifications
    });
  });

  describe('useNotificationUtils', () => {
    it('should provide all notification utility functions', () => {
      const { result } = renderHook(() => useNotificationUtils());
      
      expect(typeof result.current.addNotification).toBe('function');
      expect(typeof result.current.markAsRead).toBe('function');
      expect(typeof result.current.markAllAsRead).toBe('function');
      expect(typeof result.current.removeNotification).toBe('function');
      expect(typeof result.current.clearAllNotifications).toBe('function');
      expect(typeof result.current.notifyBookingConfirmation).toBe('function');
      expect(typeof result.current.notifyUpcomingAppointment).toBe('function');
      expect(typeof result.current.notifyNewMessage).toBe('function');
      expect(typeof result.current.notifySystemAlert).toBe('function');
      expect(typeof result.current.notifyAchievement).toBe('function');
      expect(typeof result.current.notifyReminder).toBe('function');
    });

    it('should call addNotification with correct parameters for booking confirmation', () => {
      const { result } = renderHook(() => useNotificationUtils());
      
      act(() => {
        result.current.notifyBookingConfirmation('B001', 'John Doe');
      });
      
      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'Booking Confirmed',
        description: 'Your consultation with John Doe has been confirmed (ID: B001).',
        type: 'success',
        timestamp: expect.any(String)
      });
    });

    it('should call addNotification with correct parameters for upcoming appointment', () => {
      const { result } = renderHook(() => useNotificationUtils());
      
      act(() => {
        result.current.notifyUpcomingAppointment('10:00 AM', 'Jane Smith');
      });
      
      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'Upcoming Appointment',
        description: 'You have an appointment with Jane Smith at 10:00 AM.',
        type: 'info',
        timestamp: expect.any(String)
      });
    });

    it('should call addNotification with correct parameters for new message', () => {
      const { result } = renderHook(() => useNotificationUtils());
      
      act(() => {
        result.current.notifyNewMessage('Alex Johnson', 'Hello there!');
      });
      
      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'New Message',
        description: 'Alex Johnson: Hello there!',
        type: 'info',
        timestamp: expect.any(String)
      });
    });

    it('should call addNotification with correct parameters for achievement unlock', () => {
      const { result } = renderHook(() => useNotificationUtils());
      
      act(() => {
        result.current.notifyAchievement('Top Consultant', 'You completed 100 consultations');
      });
      
      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'Achievement Unlocked: Top Consultant',
        description: 'You completed 100 consultations',
        type: 'success',
        timestamp: expect.any(String)
      });
    });

    it('should call addNotification with correct parameters for system alerts', () => {
      const { result } = renderHook(() => useNotificationUtils());
      
      act(() => {
        result.current.notifySystemAlert('Maintenance Notice', 'System will be down for maintenance tonight', 'warning');
      });
      
      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'Maintenance Notice',
        description: 'System will be down for maintenance tonight',
        type: 'warning',
        timestamp: expect.any(String)
      });
    });
  });

  describe('createNotification', () => {
    it('should create a notification object with provided parameters', () => {
      const timestamp = new Date().toISOString();
      const notification = createNotification('Test Title', 'Test Description', 'info', timestamp);
      
      expect(notification).toEqual({
        title: 'Test Title',
        description: 'Test Description',
        type: 'info',
        timestamp
      });
    });

    it('should use current timestamp if none is provided', () => {
      const notification = createNotification('Test Title', 'Test Description', 'info');
      
      expect(notification.title).toBe('Test Title');
      expect(notification.description).toBe('Test Description');
      expect(notification.type).toBe('info');
      expect(notification.timestamp).toBeDefined();
      expect(typeof notification.timestamp).toBe('string');
    });

    it('should support all notification types', () => {
      const types: Array<'info' | 'success' | 'warning' | 'error' | 'urgent'> = ['info', 'success', 'warning', 'error', 'urgent'];
      
      types.forEach(type => {
        const notification = createNotification(`Title for ${type}`, `Description for ${type}`, type);
        expect(notification.type).toBe(type);
      });
    });
  });
});