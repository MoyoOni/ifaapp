import React, { useState } from 'react';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import appLogo from '@/assets/logo.png';
import GoogleAuthButton from '../components/google-auth-button';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const { login } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(emailOrPhone, password);
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-10 md:p-12 border border-stone-100 shadow-2xl space-y-7 max-w-md w-full relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-input via-highlight to-input" />

      {/* Loading overlay */}
      {isSubmitting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[2.5rem] bg-white/90 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-highlight" />
            <span className="text-sm font-bold text-stone-600">Signing in...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-3">
        <img src={appLogo} alt="Ilu Ase" className="w-16 h-16 mx-auto rounded-2xl shadow-lg" />
        <h2 className="text-3xl font-bold brand-font text-stone-800 tracking-tight">Welcome Back</h2>
        <p className="text-stone-500 text-base font-medium">Enter your details to access your sanctuary</p>
      </div>

      {/* Google Sign-In */}
      <GoogleAuthButton
        label="Continue with Google"
        onSuccess={onSuccess}
        onError={setError}
      />

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-stone-100" />
        <span className="text-xs text-stone-300 font-semibold uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-stone-100" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email or Phone */}
        <div className="space-y-1.5">
          <label htmlFor="emailOrPhone" className="text-xs font-bold uppercase text-stone-400 tracking-widest ml-1">
            Email or Phone Number
          </label>
          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-highlight transition-colors" size={20} />
            <input
              id="emailOrPhone"
              name="emailOrPhone"
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              required
              autoComplete="username"
              placeholder="name@example.com or 08012345678"
              className="w-full bg-stone-50 border border-stone-200 p-4 pl-14 rounded-2xl text-stone-800 outline-none focus:bg-white focus:border-highlight focus:ring-4 focus:ring-highlight/10 transition-all font-medium placeholder:text-stone-300"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between ml-1">
            <label htmlFor="password" className="text-xs font-bold uppercase text-stone-400 tracking-widest">
              Password
            </label>
            <button type="button" className="text-xs font-semibold text-highlight hover:text-yellow-600 transition-colors">
              Forgot password?
            </button>
          </div>
          <div className="relative group">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-highlight transition-colors" size={20} />
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="w-full bg-stone-50 border border-stone-200 p-4 pl-14 rounded-2xl text-stone-800 outline-none focus:bg-white focus:border-highlight focus:ring-4 focus:ring-highlight/10 transition-all font-medium placeholder:text-stone-300"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          aria-label="Sign in"
          className="w-full py-4 bg-highlight text-white rounded-2xl font-bold text-base shadow-lg shadow-highlight/20 hover:bg-yellow-500 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          Sign In
        </button>
      </form>

      {onSwitchToRegister && (
        <p className="text-center text-stone-400 text-sm font-medium pt-1">
          New to Ifa?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-highlight hover:text-yellow-600 font-bold transition-colors"
          >
            Start your journey
          </button>
        </p>
      )}
    </div>
  );
};

export default LoginForm;
