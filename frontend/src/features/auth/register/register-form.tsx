import React, { useState } from 'react';
import { Mail, Lock, User, Phone, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import { UserRole } from '@common';
import appLogo from '@/assets/logo.png';
import GoogleAuthButton from '../components/google-auth-button';

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Seeker',
  BABALAWO: 'Babalawo',
  VENDOR: 'Vendor',
  ADMIN: 'Administrator',
  ADVISORY_BOARD_MEMBER: 'Advisory Board Member',
};

interface RegisterFormProps {
  selectedRole: UserRole;
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  onBack?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ selectedRole, onSuccess, onSwitchToLogin, onBack }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, password, name, selectedRole, phone || undefined);
      setRegisteredEmail(email);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registeredEmail) {
    return (
      <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-stone-100 shadow-2xl space-y-6 max-w-md w-full relative overflow-hidden font-sans text-center">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-input via-highlight to-input" />
        <CheckCircle size={48} className="text-green-500 mx-auto" />
        <h2 className="text-2xl font-bold brand-font text-stone-800">Check your email</h2>
        <p className="text-stone-500 text-sm leading-relaxed">
          We sent a verification link to{' '}
          <span className="font-semibold text-stone-700">{registeredEmail}</span>.
          Click the link to verify your address, then continue.
        </p>
        <button
          type="button"
          onClick={onSuccess}
          className="w-full py-4 bg-highlight text-white rounded-2xl font-bold shadow-lg shadow-highlight/20 hover:bg-yellow-500 transition-all"
        >
          Continue to onboarding →
        </button>
        <p className="text-xs text-stone-400">
          Didn't receive it? Check your spam folder or{' '}
          <button
            type="button"
            onClick={() => setRegisteredEmail(null)}
            className="text-highlight hover:text-yellow-600 font-medium"
          >
            go back
          </button>.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-stone-100 shadow-2xl space-y-6 max-w-md w-full relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-input via-highlight to-input" />

      {/* Header */}
      <div className="flex items-start gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-1 p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors flex-shrink-0"
            aria-label="Back to role selection"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        )}
        <div className="flex-1 text-center">
          <img src={appLogo} alt="Ilu Ase" className="w-12 h-12 mx-auto rounded-2xl shadow-lg mb-3" />
          <h2 className="text-2xl font-bold brand-font text-stone-800">Create Account</h2>
          <p className="text-sm text-stone-500 mt-1">
            Joining as a{' '}
            <span className="text-highlight font-bold">{ROLE_LABELS[selectedRole] ?? selectedRole}</span>
          </p>
        </div>
      </div>

      {/* Google Sign-Up */}
      <GoogleAuthButton
        label="Sign up with Google"
        onSuccess={onSuccess}
        onError={setError}
      />

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-stone-100" />
        <span className="text-xs text-stone-300 font-semibold uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-stone-100" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div className="relative group">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-highlight transition-colors" size={18} />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            placeholder="Full name"
            className="w-full bg-stone-50 border border-stone-200 p-4 pl-12 rounded-2xl text-stone-800 outline-none focus:bg-white focus:border-highlight focus:ring-4 focus:ring-highlight/10 transition-all font-medium placeholder:text-stone-300"
          />
        </div>

        {/* Email */}
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-highlight transition-colors" size={18} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email address"
            className="w-full bg-stone-50 border border-stone-200 p-4 pl-12 rounded-2xl text-stone-800 outline-none focus:bg-white focus:border-highlight focus:ring-4 focus:ring-highlight/10 transition-all font-medium placeholder:text-stone-300"
          />
        </div>

        {/* Phone (optional, Nigerian context) */}
        <div className="relative group">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-highlight transition-colors" size={18} />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number (optional) — e.g. 08012345678"
            className="w-full bg-stone-50 border border-stone-200 p-4 pl-12 rounded-2xl text-stone-800 outline-none focus:bg-white focus:border-highlight focus:ring-4 focus:ring-highlight/10 transition-all font-medium placeholder:text-stone-300"
          />
        </div>

        {/* Password */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-highlight transition-colors" size={18} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Password"
              className="w-full bg-stone-50 border border-stone-200 p-4 pl-12 rounded-2xl text-stone-800 outline-none focus:bg-white focus:border-highlight focus:ring-4 focus:ring-highlight/10 transition-all font-medium placeholder:text-stone-300"
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-highlight transition-colors" size={18} />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Confirm"
              className="w-full bg-stone-50 border border-stone-200 p-4 pl-12 rounded-2xl text-stone-800 outline-none focus:bg-white focus:border-highlight focus:ring-4 focus:ring-highlight/10 transition-all font-medium placeholder:text-stone-300"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium text-center">
            {error}
          </div>
        )}

        <p className="text-xs text-stone-400 text-center px-2">
          By creating an account you agree to our{' '}
          <a href="/terms" className="text-highlight hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="text-highlight hover:underline">Privacy Policy</a>.
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          aria-label="Create account"
          className="w-full py-4 bg-highlight text-white rounded-2xl font-bold text-base shadow-lg shadow-highlight/20 hover:bg-yellow-500 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSubmitting ? (
            <><Loader2 size={20} className="animate-spin" /> Creating account...</>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {onSwitchToLogin && (
        <p className="text-center text-stone-400 text-sm">
          Already have an account?{' '}
          <button type="button" onClick={onSwitchToLogin} className="text-highlight hover:text-yellow-600 font-bold transition-colors">
            Sign in
          </button>
        </p>
      )}
    </div>
  );
};

export default RegisterForm;
