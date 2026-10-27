import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { parseApiError } from '@/shared/utils/api-error';

// Target of the emailed reset link (/reset-password?token=...). The email
// template has always linked here, but neither this page nor the backend
// endpoint existed.
const MIN_LENGTH = 8;

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_LENGTH) { setError(`Your password needs at least ${MIN_LENGTH} characters.`); return; }
    if (password !== confirm) { setError("The two passwords don't match."); return; }
    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err) {
      setError(parseApiError(err).userMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full bg-muted/40 border border-border p-4 pl-12 rounded-2xl text-foreground outline-none focus:border-highlight focus:ring-4 focus:ring-highlight/10';

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-6">
      <div className="bg-card rounded-[2.5rem] p-10 border border-border/50 shadow-2xl max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold brand-font text-foreground text-center">Choose a new password</h1>

        {!token ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <XCircle size={44} className="text-destructive" />
            <p className="text-muted-foreground">This link is missing its reset code. Please use the link from your email, or request a new one.</p>
            <Link to="/forgot-password" className="text-sm font-semibold text-highlight hover:underline">Request a new link</Link>
          </div>
        ) : done ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle size={44} className="text-success" />
            <p className="text-foreground font-medium">Your password has been reset. You can now sign in.</p>
            <Link to="/login" className="w-full py-4 bg-highlight text-highlight-foreground rounded-2xl font-bold text-center">Continue to Sign In</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="reset-password" className="text-xs font-bold uppercase text-muted-foreground tracking-widest ml-1">New password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input id="reset-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={`At least ${MIN_LENGTH} characters`} className={inputClass} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="reset-password-confirm" className="text-xs font-bold uppercase text-muted-foreground tracking-widest ml-1">Confirm new password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input id="reset-password-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
              </div>
            </div>
            {error && (
              <div role="alert" className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>
                  {error}{' '}
                  {/invalid or has expired/i.test(error) && (
                    <Link to="/forgot-password" className="font-semibold underline">Request a new link</Link>
                  )}
                </span>
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-highlight text-highlight-foreground rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting && <Loader2 size={18} className="animate-spin" />}
              {submitting ? 'Saving…' : 'Reset password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
