import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { UserRole } from '@common';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn().mockRejectedValue(new Error('no user')),
    post: vi.fn(),
  },
}));

vi.mock('@/lib/firebase-messaging', () => ({
  registerPushNotifications: vi.fn().mockResolvedValue(undefined),
  deregisterPushNotifications: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@sentry/react', () => ({
  setUser: vi.fn(),
  setContext: vi.fn(),
}));

import { useAuth } from './use-auth';

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useAuth — devLogin production guard (P0-02)', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    window.localStorage.clear();
  });

  it('logs the user in via devLogin outside of production', () => {
    process.env.NODE_ENV = 'test';
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.devLogin(UserRole.CLIENT);
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.role).toBe(UserRole.CLIENT);
    expect(window.localStorage.getItem('accessToken')).toBe('dev-token');
  });

  it('does not fabricate a session when devLogin is called in production', () => {
    process.env.NODE_ENV = 'production';
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.devLogin(UserRole.ADMIN);
    });

    expect(result.current.user).toBeNull();
    expect(window.localStorage.getItem('accessToken')).toBeNull();
    expect(window.localStorage.getItem('dev_mode_role')).toBeNull();
  });

  it('does not rehydrate a stale dev_mode_role session from localStorage in production', () => {
    // Simulates a dev_mode_role flag left over from a prior non-production
    // session (or one set some other way) — mounting the hook in production
    // must not resurrect a fake authenticated session from it.
    window.localStorage.setItem('dev_mode_role', UserRole.ADMIN);
    process.env.NODE_ENV = 'production';

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
  });

  it('does rehydrate a dev_mode_role session outside of production (existing behavior)', () => {
    window.localStorage.setItem('dev_mode_role', UserRole.CLIENT);
    process.env.NODE_ENV = 'test';

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.role).toBe(UserRole.CLIENT);
  });
});
