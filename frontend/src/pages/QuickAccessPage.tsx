import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import { DEMO_USERS } from '@/demo';
import { getDashboardPathForRole } from '@/shared/config/navigation';

const QuickAccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { quickAccess, user, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate(getDashboardPathForRole(user.role), { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleQuickAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await quickAccess(email);
      setSuccess(true);
      // The user will be automatically redirected by the LoginPage effect
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Quick access failed. Please try again.';
      setError(errorMessage);
      console.error('Quick Access Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle demo user selection
  const handleDemoUserSelect = (email: string) => {
    setEmail(email);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-stone-100 shadow-2xl space-y-8 max-w-md w-full relative overflow-hidden font-sans">
        {/* Decorative Gold Line */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-stone-100 via-highlight to-stone-100"></div>

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold brand-font text-stone-800 tracking-tight">Quick Access</h2>
          <p className="text-stone-500 font-medium">
            Access with a demo account
          </p>
        </div>

        {/* Quick Access Form */}
        <form onSubmit={handleQuickAccess} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-xs font-bold uppercase text-stone-400 tracking-widest ml-1"
            >
              Demo User Email
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
                placeholder="Select or enter demo email"
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

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-center">
              Successfully logged in! Redirecting...
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="w-full py-4 bg-highlight text-white rounded-2xl font-bold text-base shadow-lg shadow-highlight/20 hover:shadow-xl hover:bg-yellow-500 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Accessing...</span>
              </>
            ) : (
              'Sign In with Demo Account'
            )}
          </button>
        </form>

        {/* Demo User Selection */}
        <div className="pt-6 border-t border-stone-100">
          <p className="text-[10px] font-bold uppercase text-stone-300 tracking-widest text-center mb-4">
            Or Select a Demo User
          </p>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(DEMO_USERS).map(([key, user]) => (
              user && user.email ? ( // Properly check that both user and email exist
                <button
                  key={key}
                  type="button"
                  onClick={() => user.email && handleDemoUserSelect(user.email)} // Ensure email exists
                  className="py-3 px-2 bg-stone-50 hover:bg-stone-100 text-stone-500 hover:text-stone-800 border border-stone-100 rounded-xl text-xs font-bold transition-all truncate"
                  title={`${user.name} (${user.role})`}
                >
                  <div className="flex flex-col items-center">
                    <User size={14} className="mb-1" />
                    <span className="truncate">{key.split('-').slice(1).join(' ')}</span>
                  </div>
                </button>
              ) : null
            ))}
          </div>
        </div>

        {/* Back to Login */}
        <div className="text-center pt-4">
          <button
            onClick={() => navigate('/login')}
            className="text-stone-400 hover:text-stone-600 font-medium flex items-center justify-center gap-2 text-sm"
          >
            <ArrowLeft size={16} />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickAccessPage;