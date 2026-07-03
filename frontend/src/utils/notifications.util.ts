import { useNotification } from '../contexts/notification-context';

// Define the Notification type to match what's expected
export interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success' | 'urgent' | 'error';
  category?: string;
  data?: Record<string, any>;
  timestamp: string;
  read: boolean;
}

// Define common notification types
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'urgent';

// Create a custom hook that provides utility functions for common notification scenarios
export const useNotificationUtils = () => {
  const { addNotification, markAsRead, markAllAsRead, removeNotification, clearAllNotifications } = useNotification();

  // Predefined notification for booking confirmations
  const notifyBookingConfirmation = (bookingId: string, clientName: string) => {
    addNotification({
      title: 'Booking Confirmed',
      description: `Your consultation with ${clientName} has been confirmed (ID: ${bookingId}).`,
      type: 'success',
      timestamp: new Date().toISOString(),
    });
  };

  // Predefined notification for upcoming appointments
  const notifyUpcomingAppointment = (appointmentTime: string, clientName: string) => {
    addNotification({
      title: 'Upcoming Appointment',
      description: `You have an appointment with ${clientName} at ${appointmentTime}.`,
      type: 'info',
      timestamp: new Date().toISOString(),
    });
  };

  // Predefined notification for new messages
  const notifyNewMessage = (senderName: string, preview: string) => {
    addNotification({
      title: 'New Message',
      description: `${senderName}: ${preview}`,
      type: 'info',
      timestamp: new Date().toISOString(),
    });
  };

  // Predefined notification for system alerts
  const notifySystemAlert = (alertTitle: string, alertMessage: string, type: NotificationType = 'warning') => {
    addNotification({
      title: alertTitle,
      description: alertMessage,
      type,
      timestamp: new Date().toISOString(),
    });
  };

  // Predefined notification for achievement unlocks
  const notifyAchievement = (achievementTitle: string, description: string) => {
    addNotification({
      title: `Achievement Unlocked: ${achievementTitle}`,
      description,
      type: 'success',
      timestamp: new Date().toISOString(),
    });
  };

  // Predefined notification for reminders
  const notifyReminder = (title: string, description: string) => {
    addNotification({
      title,
      description,
      type: 'urgent',
      timestamp: new Date().toISOString(),
    });
  };

  return {
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    notifyBookingConfirmation,
    notifyUpcomingAppointment,
    notifyNewMessage,
    notifySystemAlert,
    notifyAchievement,
    notifyReminder
  };
};

// Export the base notification template creator
export const createNotification = (
  title: string,
  description: string,
  type: 'info' | 'warning' | 'success' | 'urgent' | 'error',
  category?: string,
  data?: Record<string, any>,
): Omit<Notification, 'id' | 'read'> => {
  return {
    title,
    description,
    type,
    category,
    data,
    timestamp: new Date().toISOString(),
  };
};
