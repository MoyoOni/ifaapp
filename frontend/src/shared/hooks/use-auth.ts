import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserRole, AdminSubRole } from '@common';
import api from '@/lib/api';
import { DEMO_USERS } from '@/demo';
import { logger, setLogContext, clearLogContext } from '@/shared/utils/logger';
import * as Sentry from '@sentry/react';
import { registerPushNotifications, deregisterPushNotifications } from '@/lib/firebase-messaging';
import { isDevModeActive } from '@/shared/utils/dev-mode';
import { decodeJwtPayload } from '@/shared/utils/jwt';
import type { User } from '@/types/user';
import type { AuthResponse } from '@/types/api/auth';
import { mapAuthUserToUser, mapDemoUserToUser } from '@/types/api/mappers/auth.mapper';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Authentication Hook
 * Manages user authentication state and user data
 */
export function useAuth(): AuthState & {
  login: (email: string, password: string) => Promise<void>;
  quickAccess: (email: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole, phone?: string, referredByCode?: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  devLogin: (role: UserRole) => void;
  impersonate: (userId: string, reason: string) => Promise<void>;
} {
  const [user, setUser] = useState<User | null>(null);
  const [tokenCheck, setTokenCheck] = useState(() => !!localStorage.getItem('accessToken'));
  const [isInitializing, setIsInitializing] = useState(true);
  const isAuthenticated = tokenCheck;
  const userId = user?.id || localStorage.getItem('userId');

  logger.info(`[useAuth] Render. tokenCheck: ${tokenCheck}, userId: ${userId}, isAuthenticated: ${isAuthenticated}`);

  // Fetch user data if authenticated
  const { data: userData, isLoading } = useQuery<User | null>({
    queryKey: ['user', userId],
    queryFn: async () => {
      logger.info(`[useAuth] Fetching user ${userId}`);
      if (!userId) return null;
      try {
        // P2-01: GET /users/:id returns a much richer, relational shape
        // (babalawoReviews, templesJoined, circleMemberships, etc.) than the
        // auth endpoints' embedded `user` object — it doesn't have a mapper
        // yet. Left as an untyped passthrough rather than force-fitting it
        // through mapAuthUserToUser, which would silently drop those fields.
        const response = await api.get(`/users/${userId}`);
        logger.info(`[useAuth] Fetched user data:`, response.data);
        return response.data;
      } catch (error: any) {
        logger.error(`[useAuth] Fetch error:`, error);

        // Always capture errors to Sentry
        Sentry.captureException(error, {
          tags: { type: 'auth_user_fetch' },
          extra: { userId }
        });

        // Token might be invalid
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        setTokenCheck(false);
        return null;
      }
    },
    enabled: isAuthenticated && !!userId && !isDevModeActive(),
  });

  // Update user state when data is fetched; set user in log context for tracing
  useEffect(() => {
    if (userData) {
      // isImpersonated/impersonatedBy are JWT session claims, not persisted
      // User fields — GET /users/:id can never return them. Read them off
      // the current access token instead of silently leaving them unset.
      const storedToken = localStorage.getItem('accessToken');
      const claims = storedToken
        ? decodeJwtPayload<{ isImpersonated?: boolean; impersonatedBy?: string }>(storedToken)
        : null;
      setUser({
        ...userData,
        isImpersonated: claims?.isImpersonated ?? false,
        impersonatorId: claims?.impersonatedBy,
      });
      localStorage.setItem('userId', userData.id);
      setLogContext({ userId: userData.id });
    }
  }, [userData]);

  // Handle initialization state
  useEffect(() => {
    if (!isLoading) {
      setIsInitializing(false);
    }
  }, [isLoading]);

  // Check localStorage on mount (only once)
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedToken = localStorage.getItem('accessToken');
    if (storedUserId && storedToken && !tokenCheck) {
      setTokenCheck(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', { email, password });
      const { user: userResponse, accessToken, refreshToken } = response.data;
      const mappedUser = mapAuthUserToUser(userResponse);

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userId', mappedUser.id);

      setTokenCheck(true);
      setUser(mappedUser);
      setLogContext({ userId: mappedUser.id });
      registerPushNotifications().catch(() => {});
    } catch (error: any) {
      // Always capture authentication errors to Sentry
      Sentry.captureException(error, {
        tags: { type: 'auth_login' },
        extra: { email }
      });
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const quickAccess = async (email: string) => {
    try {
      logger.log('Quick Access: Attempting login for', email);
      const response = await api.post<AuthResponse>('/auth/quick-access', { email });
      logger.log('Quick Access: Response received', response.data);

      const { user: userResponse, accessToken, refreshToken } = response.data;

      // Validate response has required fields
      if (!userResponse || !accessToken || !userResponse.id) {
        throw new Error('Invalid response from server');
      }

      // mapAuthUserToUser already defaults hasOnboarded via the DTO's
      // required field — quickAccessLogin always sets it server-side now,
      // but this stays defensive against older seeded rows.
      const mappedUser = { ...mapAuthUserToUser(userResponse), hasOnboarded: userResponse.hasOnboarded ?? true };

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userId', mappedUser.id);

      setTokenCheck(true);
      setUser(mappedUser);
      setLogContext({ userId: mappedUser.id });
      registerPushNotifications().catch(() => {});

      logger.log('Quick Access: Successfully logged in', mappedUser);
    } catch (error: any) {
      logger.error('Quick Access Error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Quick access failed';
      throw new Error(errorMessage);
    }
  };

  const register = async (email: string, password: string, name: string, role: UserRole, phone?: string, referredByCode?: string) => {
    try {
      const response = await api.post<AuthResponse>('/auth/register', {
        email, password, name, role,
        ...(phone ? { phone } : {}),
        ...(referredByCode ? { referredByCode } : {}),
      });
      const { user: userResponse, accessToken, refreshToken } = response.data;
      const mappedUser = mapAuthUserToUser(userResponse);

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userId', mappedUser.id);

      setTokenCheck(true);
      setUser(mappedUser);
      setLogContext({ userId: mappedUser.id });
      registerPushNotifications().catch(() => {});
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    clearLogContext();
    deregisterPushNotifications().catch(() => {});
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    setTokenCheck(false);
    setUser(null);
  };

  // Dev mode Mock Users mapped from single source of truth via mapDemoUserToUser
  // (P2-01) — DemoUser doesn't structurally satisfy User (missing hasOnboarded,
  // optional email/verified where User requires them), so this is the one
  // explicit mapping boundary instead of the `as any` casts it replaces.
  // Derived entirely from the static DEMO_USERS constant, so this is memoized
  // with an empty dep array to give it a stable reference across renders --
  // otherwise a fresh object every render would defeat the mount-only effect
  // below that depends on it.
  const MOCK_USERS: Record<string, User> = useMemo(() => {
    const vendorDemoUser =
      Object.values(DEMO_USERS).find((u) => u.role === UserRole.VENDOR) || DEMO_USERS['demo-vendor-1'];
    return {
      [UserRole.ADMIN]: mapDemoUserToUser(DEMO_USERS['demo-admin-1'], { adminSubRole: AdminSubRole.SUPER }),
      [UserRole.BABALAWO]: mapDemoUserToUser(DEMO_USERS['demo-baba-1']),
      [UserRole.CLIENT]: mapDemoUserToUser(DEMO_USERS['demo-client-1']),
      [UserRole.VENDOR]: mapDemoUserToUser(vendorDemoUser),
    };
  }, []);

  const devLogin = (role: UserRole) => {
    // EMG (P0-02): devLogin fabricates a fully "authenticated" session
    // entirely client-side — a fake accessToken, a mock User object, no
    // backend call at all. It must never run in production. Previously only
    // the /quick-access route's UI widget checked NODE_ENV; devLogin itself
    // and the route registration in App.tsx did not, and QuickAccessPage's
    // catch-block fallback would call this even after the backend correctly
    // rejected /auth/quick-access via ENABLE_QUICK_ACCESS!=true.
    if (process.env.NODE_ENV === 'production') {
      logger.error('devLogin blocked: not available in production');
      return;
    }
    const mockUser = MOCK_USERS[role];
    if (mockUser) {
      logger.log('Orisa dev mode activated:', role);
      // Ensure hasOnboarded is true for dev mode to bypass onboarding
      const devUser = { ...mockUser, hasOnboarded: true };
      setUser(devUser);
      setTokenCheck(true);
      setLogContext({ userId: devUser.id });
      localStorage.setItem('userId', devUser.id);
      localStorage.setItem('dev_mode_role', role);
      // Set a dummy token so standard checks pass
      localStorage.setItem('accessToken', 'dev-token');

      // No reload needed - React will handle state updates
    }
  };

  // Check for dev mode on mount (never rehydrate a fake session in production
  // — see devLogin above)
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const devRole = localStorage.getItem('dev_mode_role');
    if (devRole && MOCK_USERS[devRole]) {
      const devUser = { ...MOCK_USERS[devRole], hasOnboarded: true };
      setUser(devUser);
      setTokenCheck(true);
      setLogContext({ userId: devUser.id });
    }
  }, [MOCK_USERS]);

  return {
    user,
    isAuthenticated,
    isLoading: isInitializing || (isLoading && !user && !isDevModeActive()),
    login,
    quickAccess,
    register,
    logout: () => {
      logout();
      localStorage.removeItem('dev_mode_role');
    },
    setUser,
    devLogin,
    impersonate: async (userId: string, reason: string) => {
      try {
        // P2-01 discovery: this used to call POST /admin/impersonate/:userId
        // expecting { user, accessToken, refreshToken } back — but that route
        // (admin.service.ts::impersonateUser) only logs an audit event and
        // returns { impersonationLogged: true }, no tokens at all. The route
        // that actually establishes an impersonation session is
        // POST /auth/impersonate, which returns a single short-lived
        // (30 min) { token } — no refresh token, by design.
        const response = await api.post<{ token: string }>('/auth/impersonate', { userId, reason });
        const { token } = response.data;
        const claims = decodeJwtPayload<{ sub: string }>(token);
        if (!claims?.sub) {
          throw new Error('Invalid impersonation token returned by server');
        }

        localStorage.setItem('accessToken', token);
        // No refresh token for an impersonation session — leaving the
        // original admin's refresh token in place would let the axios 401
        // interceptor silently swap back to the admin's own identity the
        // moment the 30-minute impersonation token expires, without
        // surfacing that transition anywhere. Ending impersonation is a
        // full logout (see ImpersonationBanner's onStop) until a proper
        // session-restore flow exists.
        localStorage.removeItem('refreshToken');
        localStorage.setItem('userId', claims.sub);
        localStorage.setItem('impersonationStartedAt', new Date().toISOString());

        setTokenCheck(true);
        setLogContext({ userId: claims.sub });

        // Force a page reload to the root to clear any admin-specific states
        window.location.href = '/';
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Impersonation failed';
        throw new Error(errorMessage);
      }
    },
  };
}

