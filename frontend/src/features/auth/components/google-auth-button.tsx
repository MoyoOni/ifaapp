import React, { useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
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

/**
 * Inner component — only rendered when Google Client ID is configured.
 * Keeps GoogleLogin away from renders where clientId is empty.
 *
 * Uses the ID-token flow (GoogleLogin's `credential` field, a signed JWT)
 * rather than useGoogleLogin's implicit/auth-code flows, which only yield an
 * opaque access token. The backend's /auth/google/token verifies the token
 * via Google's verifyIdToken (OAuth2Client) -- that call only accepts a real
 * ID token, so sending it an access token always failed with
 * "Invalid Google token" regardless of configuration.
 */
const GoogleLoginButton: React.FC<GoogleAuthButtonProps> = ({ onSuccess, onError, label }) => {
  const { setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      onError?.('Google sign-in did not return a credential');
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post('/auth/google/token', {
        credential: credentialResponse.credential,
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
  };

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-card border border-border rounded-2xl text-foreground font-semibold">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
        <span>Signing in…</span>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center [&>div]:w-full">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => {
          logger.error('Google login error');
          onError?.('Google sign-in was cancelled or failed');
        }}
        text={label?.toLowerCase().includes('sign up') ? 'signup_with' : 'continue_with'}
        shape="pill"
        width="100%"
      />
    </div>
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
