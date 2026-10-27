import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { parseApiError } from '@/shared/utils/api-error';

// The login page's "Forgot password?" button used to do nothing, so a member
// who forgot their password had no way back in. The backend answers the same
// whether or not the email has an account, and so does this page.
const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(res.data?.message || 'If an account exists for that email, a password reset link is on its way.');
    } catch (err) {
      setError(parseApiError(err).userMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-6">
      <div className="bg-card rounded-[2.5rem] p-10 border border-border/50 shadow-2xl max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold brand-font text-foreground">Forgot your password?</h1>
          <p className="text-sm text-muted-foreground">Enter your email and we'll send you a link to choose a new one.</p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle size={44} className="text-success" />
            <p className="text-foreground font-medium">{sent}</p>
            <p className="text-sm text-muted-foreground">The link expires in 1 hour. Check your spam folder if it doesn't arrive.</p>
            <Link to="/login" className="text-sm font-semibold text-highlight hover:underline">Back to Sign In</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="forgot-email" className="text-xs font-bold uppercase text-muted-foreground tracking-widest ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  id="forgot-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-muted/40 border border-border p-4 pl-12 rounded-2xl text-foreground outline-none focus:border-highlight focus:ring-4 focus:ring-highlight/10"
                />
              </div>
            </div>
            {error && (
              <div role="alert" className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle size={14} /> {error}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting || !email.trim()}
              className="w-full py-4 bg-highlight text-highlight-foreground rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting && <Loader2 size={18} className="animate-spin" />}
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
            <p className="text-center">
              <Link to="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground">Back to Sign In</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
