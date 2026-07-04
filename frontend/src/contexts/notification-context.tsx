import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Define constants
const MAX_NOTIFICATIONS = 50;

let notificationIdCounter = 0;
function generateNotificationId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${(++notificationIdCounter).toString(36)}`;
}

// Define types
type NotificationType = 'info' | 'warning' | 'success' | 'urgent' | 'error';
type NotificationCategory = 'booking' | 'reminder' | 'plan' | 'messages' | 'general';

interface Notification {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  category?: NotificationCategory;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  actionUrl?: string;
  data?: Record<string, any>;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'read'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'CLEAR_ALL_NOTIFICATIONS' };

// Initial state
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
};

// Reducer function
const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const newNotification: Notification = {
        ...action.payload,
        id: generateNotificationId(),
        read: false,
      };
      
      return {
        ...state,
        notifications: [newNotification, ...state.notifications.slice(0, MAX_NOTIFICATIONS - 1)],
        unreadCount: state.unreadCount + 1,
      };
    }
    
    case 'REMOVE_NOTIFICATION': {
      const notifications = state.notifications.filter(notification => notification.id !== action.payload);
      return {
        ...state,
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
      };
    }
    
    case 'MARK_AS_READ': {
      const notifications = state.notifications.map(notification =>
        notification.id === action.payload ? { ...notification, read: true } : notification
      );
      return {
        ...state,
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
      };
    }
    
    case 'MARK_ALL_AS_READ': {
      const notifications = state.notifications.map(notification => ({ ...notification, read: true }));
      return {
        ...state,
        notifications,
        unreadCount: 0,
      };
    }
    
    case 'CLEAR_ALL_NOTIFICATIONS': {
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };
    }
    
    default:
      return state;
  }
};

// Create context
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider component
interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const addNotification = (notification: Omit<Notification, 'id' | 'read'>) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const markAsRead = (id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: id });
  };

  const markAllAsRead = () => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
  };

  const clearAllNotifications = () => {
    dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' });
  };

  const contextValue: NotificationContextType = {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};