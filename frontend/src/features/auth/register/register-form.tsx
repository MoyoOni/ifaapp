import React, { useState } from 'react';
import { Mail, Lock, User, Phone, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import { useSearchParams } from 'react-router-dom';
import { UserRole } from '@common';
import appLogo from '@/assets/logo.png';
import GoogleAuthButton from '../components/google-auth-button';
import { logger } from '@/shared/utils/logger';

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  const checks = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)];
  const score = checks.filter(Boolean).length;
  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score === 2) return { score, label: 'Fair', color: 'bg-amber-500' };
  if (score === 3) return { score, label: 'Good', color: 'bg-yellow-400' };
  return { score, label: 'Strong', color: 'bg-emerald-500' };
}

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
  const [searchParams] = useSearchParams();
  const urlRef = searchParams.get('ref') || '';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [refCode, setRefCode] = useState(urlRef);
  const [refExpanded, setRefExpanded] = useState(!!urlRef);
  const [refValid, setRefValid] = useState<boolean | null>(null);
  const [refValidationMsg, setRefValidationMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const referredByCode = refCode.trim() || undefined;

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

    // Validate referral code if provided
    if (refCode.trim()) {
      try {
        const response = await fetch(`/api/users/referral/validate/${refCode.trim()}`);
        const result = await response.json();
        
        if (!result.valid) {
          setError(result.message || 'Referral code is invalid');
          return;
        }
      } catch (err) {
        // If validation fails, we'll still allow registration but log the error
        logger.warn('Referral code validation failed:', err);
      }
    }

    setIsSubmitting(true);
    try {
      await register(email, password, name, selectedRole, phone || undefined, referredByCode);
      setRegisteredEmail(email);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registeredEmail) {
    return (
      <div className="bg-card rounded-[2.5rem] p-8 md:p-10 border border-border/50 shadow-2xl space-y-6 max-w-md w-full relative overflow-hidden font-sans text-center">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-input via-highlight to-input" />
        <CheckCircle size={48} className="text-green-500 dark:text-green-400 mx-auto" />
        <h2 className="text-2xl font-bold brand-font text-stone-800 dark:text-stone-200">Check your email</h2>
        <p className="text-stone-500 text-sm leading-relaxed">
          We sent a verification link to{' '}
          <span className="font-semibold text-stone-700 dark:text-stone-300">{registeredEmail}</span>.
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
            className="text-highlight hover:text-yellow-600 dark:text-yellow-400 font-medium"
          >
            go back
          </button>.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-[2.5rem] p-8 md:p-10 border border-border/50 shadow-2xl space-y-6 max-w-md w-full relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-input via-highlight to-input" />

      {/* Header */}
      <div className="flex items-start gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-1 p-1.5 rounded-xl hover:bg-muted/60 text-stone-400 hover:text-stone-700 dark:text-stone-300 transition-colors flex-shrink-0"
            aria-label="Back to role selection"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        )}
        <div className="flex-1 text-center">
          <img src={appLogo} alt="Ilu Ase" className="w-12 h-12 mx-auto rounded-2xl shadow-lg mb-3" />
          <h2 className="text-2xl font-bold brand-font text-stone-800 dark:text-stone-200">Create Account</h2>
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
        <div className="flex-1 h-px bg-muted/60" />
        <span className="text-xs text-stone-300 font-semibold uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-muted/60" />
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
            className="w-full bg-muted/40 border border-border p-4 pl-12 rounded-2xl text-stone-800 dark:text-stone-200 outline-none focus:bg-card focus:border-highlight focus:ring-4 focus:ring-highlight/10 transition-all font-medium placeholder:text-stone-300"
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
            className="w-full bg-muted/40 border border-border p-4 pl-12 rounded-2xl text-stone-800 dark:text-stone-200 outline-none focus:bg-card focus:border-highlight focus:ring-4 focus:ring-highlight/10 transition-all font-medium placeholder:text-stone-300"
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
            className="w-full bg-muted/40 border border-border p-4 pl-12 rounded-2xl text-stone-800 dark:text-stone-200 outline-none focus:bg-card focus:border-highlight focus:ring-4 focus:ring-highlight/10 transition-all font-medium placeholder:text-stone-300"
          />
        </div>

        {/* Referral code (collapsible) */}
        <div>
          <button
            type="button"
            onClick={() => setRefExpanded(e => !e)}
            className="text-xs text-stone-400 hover:text-highlight transition-colors flex items-center gap-1 font-medium"
          >
            {refExpanded ? '▾' : '▸'} Have a referral code?
            {refCode && !refExpanded && <span className="text-primary font-bold ml-1">({refCode})</span>}
          </button>
          {refExpanded && (
            <div className="mt-2 relative group">
              <input
                type="text"
                value={refCode}
                onChange={e => setRefCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="e.g. MOYOONI"
                maxLength={20}
                className="w-full bg-muted/40 border border-border p-3 pl-4 rounded-2xl text-stone-800 dark:text-stone-200 outline-none focus:bg-card focus:border-highlight focus:ring-4 focus:ring-highlight/10 transition-all font-mono text-sm placeholder:text-stone-300 uppercase tracking-widest"
              />
              {refCode && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {refValid === null ? (
                    <span className="text-xs text-primary font-semibold">✓ Applied</span>
                  ) : refValid ? (
                    <>
                      <CheckCircle size={14} className="text-green-500" />
                      <span className="text-xs text-green-500">Valid</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-red-500">{refValidationMsg || 'Invalid'}</span>
                    </>
                  )}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Password */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
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
                className="w-full bg-muted/40 border border-border p-4 pl-12 rounded-2xl text-stone-800 dark:text-stone-200 outline-none focus:bg-card focus:border-highlight focus:ring-4 focus:ring-highlight/10 transition-all font-medium placeholder:text-stone-300"
              />
            </div>
            {password.length > 0 && (() => {
              const { score, label, color } = getPasswordStrength(password);
              return (
                <div className="space-y-1 px-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? color : 'bg-border'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${score <= 1 ? 'text-red-500' : score === 2 ? 'text-amber-500' : score === 3 ? 'text-yellow-500' : 'text-emerald-500'}`}>{label}</p>
                </div>
              );
            })()}
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
              className="w-full bg-muted/40 border border-border p-4 pl-12 rounded-2xl text-stone-800 dark:text-stone-200 outline-none focus:bg-card focus:border-highlight focus:ring-4 focus:ring-highlight/10 transition-all font-medium placeholder:text-stone-300"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium text-center">
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
          <button type="button" onClick={onSwitchToLogin} className="text-highlight hover:text-yellow-600 dark:text-yellow-400 font-bold transition-colors">
            Sign in
          </button>
        </p>
      )}
    </div>
  );
};

export default RegisterForm;