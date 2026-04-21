import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PreferencesProvider, usePreferences } from './preferences-context';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Wrapper component to provide the context
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <PreferencesProvider>{children}</PreferencesProvider>
);

describe('PreferencesContext', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it('should initialize with default preferences', () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });
    
    expect(result.current.theme).toBe('system');
    expect(result.current.language).toBe('en-US');
    expect(result.current.notifications.email).toBe(true);
    expect(result.current.privacy.showProfilePublicly).toBe(true);
    expect(result.current.accessibility.highContrast).toBe(false);
  });

  it('should update theme', () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });
    
    act(() => {
      result.current.updateTheme('dark');
    });
    
    expect(result.current.theme).toBe('dark');
  });

  it('should toggle email notifications', () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });
    
    // Initially true
    expect(result.current.notifications.email).toBe(true);
    
    act(() => {
      result.current.toggleEmailNotifications();
    });
    
    // Should be false after toggle
    expect(result.current.notifications.email).toBe(false);
    
    act(() => {
      result.current.toggleEmailNotifications(true);
    });
    
    // Should be true when explicitly set
    expect(result.current.notifications.email).toBe(true);
  });

  it('should toggle privacy settings', () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });
    
    // Initially true
    expect(result.current.privacy.showProfilePublicly).toBe(true);
    
    act(() => {
      result.current.toggleShowProfilePublicly();
    });
    
    // Should be false after toggle
    expect(result.current.privacy.showProfilePublicly).toBe(false);
  });

  it('should update date format', () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });
    
    act(() => {
      result.current.updateDateFormat('dd/MM/yyyy');
    });
    
    expect(result.current.dateFormat).toBe('dd/MM/yyyy');
  });

  it('should reset preferences to defaults', () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });
    
    // Change a value first
    act(() => {
      result.current.updateTheme('dark');
    });
    
    expect(result.current.theme).toBe('dark');
    
    // Reset to defaults
    act(() => {
      result.current.resetPreferences();
    });
    
    expect(result.current.theme).toBe('system');
  });

  it('should save preferences to localStorage', () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });
    
    act(() => {
      result.current.updateTheme('dark');
    });
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'user-preferences',
      JSON.stringify({ ...result.current })
    );
  });

  it('should load preferences from localStorage if available', () => {
    const storedPrefs = {
      theme: 'dark',
      language: 'es',
      notifications: { email: false, push: true, sms: false },
      privacy: { showProfilePublicly: false, showOnlineStatus: true, allowMessaging: true },
      accessibility: { highContrast: true, fontSize: 'large', reduceMotion: false },
      dateFormat: 'dd/MM/yyyy',
      timeFormat: 'HH:mm'
    };
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedPrefs));
    
    const { result } = renderHook(() => usePreferences(), { wrapper });
    
    expect(result.current.theme).toBe('dark');
    expect(result.current.language).toBe('es');
  });
});