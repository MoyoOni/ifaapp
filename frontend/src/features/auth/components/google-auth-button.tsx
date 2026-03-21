import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

interface GoogleAuthButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  label?: string;
}

const GoogleSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

/**
 * Inner component — only rendered when Google Client ID is configured.
 * Keeps useGoogleLogin away from renders where clientId is empty.
 */
const GoogleLoginButton: React.FC<GoogleAuthButtonProps> = ({ onSuccess, onError, label }) => {
  const { setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoRes.json();

        const response = await api.post('/auth/google/token', {
          credential: tokenResponse.access_token,
          userInfo,
        });

        const { user, accessToken, refreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userId', user.id);
        setUser(user);
        onSuccess?.();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Google sign-in failed';
        logger.error('Google auth failed:', err);
        onError?.(message);
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      logger.error('Google login error:', error);
      onError?.('Google sign-in was cancelled or failed');
    },
    flow: 'implicit',
  });

  return (
    <button
      type="button"
      onClick={() => login()}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-card border border-border rounded-2xl text-stone-700 dark:text-stone-300 font-semibold hover:bg-muted/40 hover:border-stone-300 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? <Loader2 size={20} className="animate-spin text-stone-400" /> : <GoogleSVG />}
      <span>{label}</span>
    </button>
  );
};

/**
 * Public component — safe to render anywhere.
 * Shows nothing if Google Client ID is not configured.
 */
const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = (props) => {
  if (!GOOGLE_CLIENT_ID) return null;
  return <GoogleLoginButton {...props} />;
};

export default GoogleAuthButton;
