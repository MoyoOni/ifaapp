import React, { useState } from 'react';
import { Mail, Lock, User, Loader2 } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import { UserRole } from '@common';

interface RegisterFormProps {
  selectedRole: UserRole;
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

/**
 * Register Form Component
 * Creates new user accounts
 */
const RegisterForm: React.FC<RegisterFormProps> = ({ selectedRole, onSuccess, onSwitchToLogin }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [yorubaName, setYorubaName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      await register(email, password, name, selectedRole);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-10 md:p-12 border border-stone-100 shadow-2xl space-y-8 max-w-md w-full relative overflow-hidden font-sans">
      {/* Decorative Gold Line */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-stone-100 via-highlight to-stone-100"></div>

      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold brand-font text-stone-800 tracking-tight">Begin Your Journey</h2>
        <p className="text-stone-500 font-medium">
          Joining the community as a <span className="text-highlight font-bold capitalize">{selectedRole === UserRole.CLIENT ? 'Seeker' : selectedRole.toLowerCase()}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase text-stone-400 tracking-widest ml-1">
            Full Name
          </label>
          <div className="relative group">
            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-highlight transition-colors" size={20} />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              placeholder="Your full name"
              className="w-full bg-stone-50 border border-stone-200 p-4 pl-14 rounded-2xl text-stone-800 outline-none focus:bg-white focus:border-highlight focus:ring-4 focus:ring-highlight/10 transition-all font-medium placeholder:text-stone-300"
            />
          </div>
        </div>

        {/* Yoruba Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase text-stone-400 tracking-widest ml-1">
            Yoruba Name <span className="text-stone-300 font-normal normal-case tracking-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={yorubaName}
            onChange={(e) => setYorubaName(e.target.value)}
            placeholder="Your name in tradition"
            className="w-full bg-stone-50 border border-stone-200 p-4 rounded-2xl text-stone-800 outline-none focus:bg-white focus:border-highlight focus:ring-4 focus:ring-highlight/10 transition-all font-medium placeholder:text-stone-300"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase text-stone-400 tracking-widest ml-1">
            Email Address
          </label>
          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-highlight transition-colors" size={20} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              className="w-full bg-stone-50 border border-stone-200 p-4 pl-14 rounded-2xl text-stone-800 outline-none focus:bg-white focus:border-highlight focus:ring-4 focus:ring-highlight/10 transition-all font-medium placeholder:text-stone-300"
            />
          </div>
        </div>

        {/* Password */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-stone-400 tracking-widest ml-1">
              Password
            </label>
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
                autoComplete="new-password"
                placeholder="********"
                className="w-full bg-stone-50 border border-stone-200 p-4 pl-14 rounded-2xl text-stone-800 outline-none focus:bg-white focus:border-highlight focus:ring-4 focus:ring-highlight/10 transition-all font-medium placeholder:text-stone-300"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-stone-400 tracking-widest ml-1">
              Confirm
            </label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-highlight transition-colors" size={20} />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="********"
                className="w-full bg-stone-50 border border-stone-200 p-4 pl-14 rounded-2xl text-stone-800 outline-none focus:bg-white focus:border-highlight focus:ring-4 focus:ring-highlight/10 transition-all font-medium placeholder:text-stone-300"
              />
            </div>
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
          className="w-full py-4 bg-highlight text-white rounded-2xl font-bold text-base shadow-lg shadow-highlight/20 hover:shadow-xl hover:bg-yellow-500 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Joining...</span>
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Switch to Login */}
      {onSwitchToLogin && (
        <div className="text-center pt-2">
          <p className="text-stone-400 text-sm font-medium">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-highlight hover:text-yellow-600 font-bold transition-colors ml-1"
            >
              Sign In
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export default RegisterForm;
