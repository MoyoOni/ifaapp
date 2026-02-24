import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserRole, AdminSubRole } from '@common';
import api from '@/lib/api';
import { DEMO_USERS } from '@/demo';
import { logger, setLogContext, clearLogContext } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import * as Sentry from '@sentry/react';

interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  adminSubRole?: AdminSubRole;
  verified: boolean;
  yorubaName?: string;
  avatar?: string;
  hasOnboarded: boolean;
  culturalLevel?: string;
  isImpersonated?: boolean;
  impersonatorId?: string;
}

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
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
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

  console.log(`[useAuth] Render. tokenCheck: ${tokenCheck}, userId: ${userId}, isAuthenticated: ${isAuthenticated}`);

  // Fetch user data if authenticated
  const { data: userData, isLoading } = useQuery<User | null>({
    queryKey: ['user', userId],
    queryFn: async () => {
      console.log(`[useAuth] Fetching user ${userId}`);
      if (!userId) return null;
      try {
        const response = await api.get(`/users/${userId}`);
        console.log(`[useAuth] Fetched user data:`, response.data);
        return response.data;
      } catch (error: any) {
        console.error(`[useAuth] Fetch error:`, error);

        if (!isDemoMode && error.response?.status >= 500) {
          Sentry.captureException(error, {
            tags: { type: 'auth_user_fetch' },
            extra: { userId }
          });
        }

        // Token might be invalid
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        setTokenCheck(false);
        return null;
      }
    },
    enabled: isAuthenticated && !!userId && !localStorage.getItem('dev_mode_role'),
  });

  // Update user state when data is fetched; set user in log context for tracing
  useEffect(() => {
    if (userData) {
      setUser(userData);
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
      const response = await api.post('/auth/login', { email, password });
      const { user: userResponse, accessToken, refreshToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userId', userResponse.id);

      setTokenCheck(true);
      setUser(userResponse);
      setLogContext({ userId: userResponse.id });
    } catch (error: any) {
      if (!isDemoMode) {
        Sentry.captureException(error, {
          tags: { type: 'auth_login' },
          extra: { email }
        });
      }
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const quickAccess = async (email: string) => {
    try {
      logger.log('Quick Access: Attempting login for', email);
      const response = await api.post('/auth/quick-access', { email });
      logger.log('Quick Access: Response received', response.data);

      const { user: userResponse, accessToken, refreshToken } = response.data;

      // Validate response has required fields
      if (!userResponse || !accessToken || !userResponse.id) {
        throw new Error('Invalid response from server');
      }

      // Ensure hasOnboarded is set (default to true if missing for seeded users)
      const userWithOnboarded = {
        ...userResponse,
        hasOnboarded: userResponse.hasOnboarded ?? true,
      };

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userId', userWithOnboarded.id);

      setTokenCheck(true);
      setUser(userWithOnboarded);
      setLogContext({ userId: userWithOnboarded.id });

      logger.log('Quick Access: Successfully logged in', userWithOnboarded);
    } catch (error: any) {
      logger.error('Quick Access Error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Quick access failed';
      throw new Error(errorMessage);
    }
  };

  const register = async (email: string, password: string, name: string, role: UserRole) => {
    try {
      const response = await api.post('/auth/register', { email, password, name, role });
      const { user: userResponse, accessToken, refreshToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userId', userResponse.id);

      setTokenCheck(true);
      setUser(userResponse);
      setLogContext({ userId: userResponse.id });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    clearLogContext();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    setTokenCheck(false);
    setUser(null);
  };

  // Dev mode Mock Users
  // Dev mode Mock Users mapped from single source of truth
  const MOCK_USERS: Record<string, User> = {
    [UserRole.ADMIN]: { ...(DEMO_USERS['demo-admin-1'] as any), adminSubRole: AdminSubRole.SUPER },
    [UserRole.BABALAWO]: DEMO_USERS['demo-baba-1'] as any,
    [UserRole.CLIENT]: DEMO_USERS['demo-client-1'] as any,
    // Finding the first vendor in demo users (usually client-2 or vendor-1)
    [UserRole.VENDOR]: Object.values(DEMO_USERS).find((u: any) => u.role === UserRole.VENDOR) as any || DEMO_USERS['demo-vendor-1'] as any
  };

  const devLogin = (role: UserRole) => {
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

  // Check for dev mode on mount
  useEffect(() => {
    const devRole = localStorage.getItem('dev_mode_role');
    if (devRole && MOCK_USERS[devRole]) {
      const devUser = { ...MOCK_USERS[devRole], hasOnboarded: true };
      setUser(devUser);
      setTokenCheck(true);
      setLogContext({ userId: devUser.id });
    }
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading: isInitializing || (isLoading && !user && !localStorage.getItem('dev_mode_role')),
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
        const response = await api.post(`/admin/impersonate/${userId}`, { reason });
        const { user: userResponse, accessToken, refreshToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userId', userResponse.id);

        setTokenCheck(true);
        setUser(userResponse);
        setLogContext({ userId: userResponse.id });

        // Force a page reload to the root to clear any admin-specific states
        window.location.href = '/';
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Impersonation failed';
        throw new Error(errorMessage);
      }
    },
  };
}
