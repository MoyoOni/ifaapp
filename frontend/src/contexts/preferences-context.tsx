import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { logger } from '@/shared/utils/logger';

// Define types for user preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    showProfilePublicly: boolean;
    showOnlineStatus: boolean;
    allowMessaging: boolean;
  };
  accessibility: {
    highContrast: boolean;
    fontSize: 'small' | 'normal' | 'large';
    reduceMotion: boolean;
  };
  dateFormat: string;
  timeFormat: string;
}

// Define initial state
const initialPreferences: UserPreferences = {
  theme: 'system',
  language: 'en-US',
  notifications: {
    email: true,
    push: true,
    sms: false
  },
  privacy: {
    showProfilePublicly: true,
    showOnlineStatus: true,
    allowMessaging: true
  },
  accessibility: {
    highContrast: false,
    fontSize: 'normal',
    reduceMotion: false
  },
  dateFormat: 'MM/dd/yyyy',
  timeFormat: 'h:mm a'
};

// Define action types
type PreferencesAction =
  | { type: 'SET_THEME'; payload: UserPreferences['theme'] }
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'TOGGLE_EMAIL_NOTIFICATIONS'; payload?: boolean }
  | { type: 'TOGGLE_PUSH_NOTIFICATIONS'; payload?: boolean }
  | { type: 'TOGGLE_SMS_NOTIFICATIONS'; payload?: boolean }
  | { type: 'TOGGLE_SHOW_PROFILE_PUBLICLY'; payload?: boolean }
  | { type: 'TOGGLE_SHOW_ONLINE_STATUS'; payload?: boolean }
  | { type: 'TOGGLE_ALLOW_MESSAGING'; payload?: boolean }
  | { type: 'TOGGLE_HIGH_CONTRAST'; payload?: boolean }
  | { type: 'SET_FONT_SIZE'; payload: UserPreferences['accessibility']['fontSize'] }
  | { type: 'TOGGLE_REDUCE_MOTION'; payload?: boolean }
  | { type: 'SET_DATE_FORMAT'; payload: string }
  | { type: 'SET_TIME_FORMAT'; payload: string }
  | { type: 'RESET_PREFERENCES' }
  | { type: 'LOAD_PREFERENCES'; payload: Partial<UserPreferences> };

// Reducer function
const preferencesReducer = (state: UserPreferences, action: PreferencesAction): UserPreferences => {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'TOGGLE_EMAIL_NOTIFICATIONS':
      return { ...state, notifications: { ...state.notifications, email: action.payload ?? !state.notifications.email } };
    case 'TOGGLE_PUSH_NOTIFICATIONS':
      return { ...state, notifications: { ...state.notifications, push: action.payload ?? !state.notifications.push } };
    case 'TOGGLE_SMS_NOTIFICATIONS':
      return { ...state, notifications: { ...state.notifications, sms: action.payload ?? !state.notifications.sms } };
    case 'TOGGLE_SHOW_PROFILE_PUBLICLY':
      return { ...state, privacy: { ...state.privacy, showProfilePublicly: action.payload ?? !state.privacy.showProfilePublicly } };
    case 'TOGGLE_SHOW_ONLINE_STATUS':
      return { ...state, privacy: { ...state.privacy, showOnlineStatus: action.payload ?? !state.privacy.showOnlineStatus } };
    case 'TOGGLE_ALLOW_MESSAGING':
      return { ...state, privacy: { ...state.privacy, allowMessaging: action.payload ?? !state.privacy.allowMessaging } };
    case 'TOGGLE_HIGH_CONTRAST':
      return { ...state, accessibility: { ...state.accessibility, highContrast: action.payload ?? !state.accessibility.highContrast } };
    case 'SET_FONT_SIZE':
      return { ...state, accessibility: { ...state.accessibility, fontSize: action.payload } };
    case 'TOGGLE_REDUCE_MOTION':
      return { ...state, accessibility: { ...state.accessibility, reduceMotion: action.payload ?? !state.accessibility.reduceMotion } };
    case 'SET_DATE_FORMAT':
      return { ...state, dateFormat: action.payload };
    case 'SET_TIME_FORMAT':
      return { ...state, timeFormat: action.payload };
    case 'LOAD_PREFERENCES':
      return { ...state, ...action.payload };
    case 'RESET_PREFERENCES':
      return initialPreferences;
    default:
      return state;
  }
};

// Create context
interface PreferencesContextProps extends UserPreferences {
  updateTheme: (theme: UserPreferences['theme']) => void;
  updateLanguage: (language: string) => void;
  toggleEmailNotifications: (value?: boolean) => void;
  togglePushNotifications: (value?: boolean) => void;
  toggleSmsNotifications: (value?: boolean) => void;
  toggleShowProfilePublicly: (value?: boolean) => void;
  toggleShowOnlineStatus: (value?: boolean) => void;
  toggleAllowMessaging: (value?: boolean) => void;
  toggleHighContrast: (value?: boolean) => void;
  updateFontSize: (size: UserPreferences['accessibility']['fontSize']) => void;
  toggleReduceMotion: (value?: boolean) => void;
  updateDateFormat: (format: string) => void;
  updateTimeFormat: (format: string) => void;
  resetPreferences: () => void;
  savePreferences: () => void;
  loadPreferences: () => void;
}

const PreferencesContext = createContext<PreferencesContextProps | undefined>(undefined);

// Provider component
interface PreferencesProviderProps {
  children: ReactNode;
}

export const PreferencesProvider: React.FC<PreferencesProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(preferencesReducer, initialPreferences);

  // Load preferences from localStorage on initial render
  useEffect(() => {
    loadPreferences();
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    savePreferences();
  }, [state]);

  const updateTheme = (theme: UserPreferences['theme']) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  };

  const updateLanguage = (language: string) => {
    dispatch({ type: 'SET_LANGUAGE', payload: language });
  };

  const toggleEmailNotifications = (value?: boolean) => {
    dispatch({ type: 'TOGGLE_EMAIL_NOTIFICATIONS', payload: value });
  };

  const togglePushNotifications = (value?: boolean) => {
    dispatch({ type: 'TOGGLE_PUSH_NOTIFICATIONS', payload: value });
  };

  const toggleSmsNotifications = (value?: boolean) => {
    dispatch({ type: 'TOGGLE_SMS_NOTIFICATIONS', payload: value });
  };

  const toggleShowProfilePublicly = (value?: boolean) => {
    dispatch({ type: 'TOGGLE_SHOW_PROFILE_PUBLICLY', payload: value });
  };

  const toggleShowOnlineStatus = (value?: boolean) => {
    dispatch({ type: 'TOGGLE_SHOW_ONLINE_STATUS', payload: value });
  };

  const toggleAllowMessaging = (value?: boolean) => {
    dispatch({ type: 'TOGGLE_ALLOW_MESSAGING', payload: value });
  };

  const toggleHighContrast = (value?: boolean) => {
    dispatch({ type: 'TOGGLE_HIGH_CONTRAST', payload: value });
  };

  const updateFontSize = (size: UserPreferences['accessibility']['fontSize']) => {
    dispatch({ type: 'SET_FONT_SIZE', payload: size });
  };

  const toggleReduceMotion = (value?: boolean) => {
    dispatch({ type: 'TOGGLE_REDUCE_MOTION', payload: value });
  };

  const updateDateFormat = (format: string) => {
    dispatch({ type: 'SET_DATE_FORMAT', payload: format });
  };

  const updateTimeFormat = (format: string) => {
    dispatch({ type: 'SET_TIME_FORMAT', payload: format });
  };

  const resetPreferences = () => {
    dispatch({ type: 'RESET_PREFERENCES' });
  };

  const savePreferences = () => {
    try {
      localStorage.setItem('user-preferences', JSON.stringify(state));
    } catch (error) {
      logger.error('Failed to save preferences to localStorage:', error);
    }
  };

  const loadPreferences = () => {
    try {
      const storedPreferences = localStorage.getItem('user-preferences');
      if (storedPreferences) {
        const parsedPreferences = JSON.parse(storedPreferences);
        dispatch({ type: 'LOAD_PREFERENCES', payload: parsedPreferences });
      }
    } catch (error) {
      logger.error('Failed to load preferences from localStorage:', error);
    }
  };

  return (
    <PreferencesContext.Provider
      value={{
        ...state,
        updateTheme,
        updateLanguage,
        toggleEmailNotifications,
        togglePushNotifications,
        toggleSmsNotifications,
        toggleShowProfilePublicly,
        toggleShowOnlineStatus,
        toggleAllowMessaging,
        toggleHighContrast,
        updateFontSize,
        toggleReduceMotion,
        updateDateFormat,
        updateTimeFormat,
        resetPreferences,
        savePreferences,
        loadPreferences
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

// Custom hook
export const usePreferences = (): PreferencesContextProps => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};