import React, { useState } from 'react';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import { UserRole } from '@common';

interface LoginFormProps {
  selectedRole?: UserRole;
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  onSwitchToQuickAccess?: () => void; // Add prop for quick access
}

/**
 * Login Form Component
 * Authenticates users with email and password
 */
const LoginForm: React.FC<LoginFormProps> = ({ selectedRole, onSuccess, onSwitchToRegister, onSwitchToQuickAccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (role: 'admin' | 'babalawo' | 'client') => {
    let demoEmail = '';
    let demoPass = '';

    switch (role) {
      case 'admin':
        demoEmail = 'admin@ilease.ng';
        demoPass = 'admin123';
        break;
      case 'babalawo':
        demoEmail = 'babalawo@ilease.ng';
        demoPass = 'babalawo123';
        break;
      case 'client':
        demoEmail = 'client@ilease.ng';
        demoPass = 'client123';
        break;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await login(demoEmail, demoPass);
      onSuccess?.();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-10 md:p-12 border border-stone-100 shadow-2xl space-y-8 max-w-md w-full relative overflow-hidden font-sans">
      {/* Decorative Gold Line */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-stone-100 via-highlight to-stone-100"></div>

      {/* Single overlay during sign-in to prevent form flicker */}
      {isSubmitting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[2.5rem] bg-white/90 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-highlight" />
            <span className="text-sm font-bold text-stone-600">Signing in...</span>
          </div>
        </div>
      )}

      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold brand-font text-stone-800 tracking-tight">Welcome Back</h2>
        <p className="text-stone-500 font-medium">
          {selectedRole ? (
            <>Signing in as <span className="text-highlight font-bold capitalize">{selectedRole}</span></>
          ) : (
            'Enter your details to access your sanctuary'
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-xs font-bold uppercase text-stone-400 tracking-widest ml-1"
          >
            Email Address
          </label>
          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-highlight transition-colors" size={20} />
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="name@example.com"
              className="w-full bg-stone-50 border border-stone-200 p-4 pl-14 rounded-2xl text-stone-800 outline-none focus:bg-white focus:border-highlight focus:ring-4 focus:ring-highlight/10 transition-all font-medium placeholder:text-stone-300"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <label
              htmlFor="password"
              className="text-xs font-bold uppercase text-stone-400 tracking-widest"
            >
              Password
            </label>
            <button type="button" className="text-xs font-bold text-highlight hover:text-yellow-600 transition-colors">
              Forgot?
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
              minLength={8}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="w-full bg-stone-50 border border-stone-200 p-4 pl-14 rounded-2xl text-stone-800 outline-none focus:bg-white focus:border-highlight focus:ring-4 focus:ring-highlight/10 transition-all font-medium placeholder:text-stone-300"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-center">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-highlight text-white rounded-2xl font-bold text-base shadow-lg shadow-highlight/20 hover:shadow-xl hover:bg-yellow-500 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Accessing...</span>
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Demo Login Buttons */}
      <div className="pt-8 border-t border-stone-100">
        <p className="text-[10px] font-bold uppercase text-stone-300 tracking-widest text-center mb-4">
          Quick Access (Demo)
        </p>
        <div className="grid grid-cols-3 gap-3">
          {(['admin', 'babalawo', 'client'] as const).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => handleDemoLogin(role)}
              disabled={isSubmitting}
              className="py-2 px-3 bg-stone-50 hover:bg-stone-100 text-stone-500 hover:text-stone-800 border border-stone-100 rounded-xl text-xs font-bold transition-all capitalize"
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Switch to Register */}
      {onSwitchToRegister && (
        <div className="text-center pt-2">
          <p className="text-stone-400 text-sm font-medium">
            New to Ifá?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-highlight hover:text-yellow-600 font-bold transition-colors ml-1"
            >
              Start your journey
            </button>
          </p>
        </div>
      )}

      {/* Switch to Quick Access */}
      {onSwitchToQuickAccess && (
        <div className="text-center pt-2">
          <p className="text-stone-400 text-sm font-medium">
            Need a demo account?{' '}
            <button
              onClick={onSwitchToQuickAccess}
              className="text-highlight hover:text-yellow-600 font-bold transition-colors ml-1"
            >
              Try Quick Access
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
