import React from 'react';
import { renderHook, render, screen, act } from '@testing-library/react';
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

import { useAuth, AuthProvider } from './use-auth';

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(AuthProvider, null, children)
  );
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

describe('useAuth — shared state via AuthProvider (regression: "need to refresh before redirect")', () => {
  afterEach(() => {
    process.env.NODE_ENV = 'test';
    window.localStorage.clear();
  });

  it('a state change from one component is immediately visible to a different component under the same AuthProvider, with no remount', () => {
    process.env.NODE_ENV = 'test';

    // Two independent components, each with their own useAuth() call --
    // exactly the LoginForm/LoginPage relationship that was broken before
    // AuthProvider existed: every call site used to get its own isolated
    // useState, so a login completed in one was invisible to the other
    // until a full page refresh remounted everything.
    function ConsumerA() {
      const { user, devLogin } = useAuth();
      return React.createElement(
        'div',
        null,
        React.createElement('span', { 'data-testid': 'consumer-a-role' }, user?.role ?? 'none'),
        React.createElement(
          'button',
          { onClick: () => devLogin(UserRole.CLIENT) },
          'Log in'
        )
      );
    }

    function ConsumerB() {
      const { user } = useAuth();
      return React.createElement('span', { 'data-testid': 'consumer-b-role' }, user?.role ?? 'none');
    }

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          AuthProvider,
          null,
          React.createElement(ConsumerA, null),
          React.createElement(ConsumerB, null)
        )
      )
    );

    expect(screen.getByTestId('consumer-a-role').textContent).toBe('none');
    expect(screen.getByTestId('consumer-b-role').textContent).toBe('none');

    act(() => {
      screen.getByRole('button', { name: 'Log in' }).click();
    });

    // The whole point of AuthProvider: B sees A's login without a remount.
    expect(screen.getByTestId('consumer-a-role').textContent).toBe(UserRole.CLIENT);
    expect(screen.getByTestId('consumer-b-role').textContent).toBe(UserRole.CLIENT);
  });

  it('useAuth() throws a clear error when rendered outside an AuthProvider, instead of silently running isolated state', () => {
    function BareConsumer() {
      useAuth();
      return null;
    }
    // Suppress the expected React error-boundary console.error noise for this one assertion.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(React.createElement(BareConsumer, null))).toThrow(
      'useAuth() must be used within an <AuthProvider>'
    );
    spy.mockRestore();
  });
});

describe('useAuth — logout revokes the session server-side', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('sends the access token on POST /auth/logout even though it clears localStorage right after', async () => {
    const api = (await import('@/lib/api')).default as unknown as { post: ReturnType<typeof vi.fn> };
    api.post.mockReset();
    api.post.mockResolvedValue({ data: {} });
    window.localStorage.setItem('accessToken', 'access-abc');
    window.localStorage.setItem('refreshToken', 'refresh-xyz');

    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => {
      result.current.logout();
    });

    // Explicit header: api's request interceptor reads localStorage a tick later,
    // by which point logout() has already removed the token.
    expect(api.post).toHaveBeenCalledWith('/auth/logout', undefined, {
      headers: { Authorization: 'Bearer access-abc' },
    });
    expect(window.localStorage.getItem('accessToken')).toBeNull();
    expect(window.localStorage.getItem('refreshToken')).toBeNull();
  });

  it('still clears the local session (and skips the call) when there is no token', async () => {
    const api = (await import('@/lib/api')).default as unknown as { post: ReturnType<typeof vi.fn> };
    api.post.mockReset();
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => {
      result.current.logout();
    });
    expect(api.post).not.toHaveBeenCalledWith('/auth/logout', expect.anything(), expect.anything());
    expect(window.localStorage.getItem('accessToken')).toBeNull();
  });
});
