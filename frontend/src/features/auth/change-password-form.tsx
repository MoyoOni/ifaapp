import React, { useState } from 'react';
import { Lock, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';
import { parseApiError } from '@/shared/utils/api-error';

// Settings' "Change Password" used to navigate to /profile, which has no
// password fields, so nobody could change their password. The backend ends
// every other session on a change and returns a fresh token pair for this one.
const MIN_LENGTH = 8;

const ChangePasswordForm: React.FC = () => {
  const { success } = useToast();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => { setOpen(false); setCurrent(''); setNext(''); setConfirm(''); setError(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next.length < MIN_LENGTH) { setError(`Your new password needs at least ${MIN_LENGTH} characters.`); return; }
    if (next !== confirm) { setError("The two new passwords don't match."); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/auth/change-password', { currentPassword: current, newPassword: next });
      // The old tokens were issued before the change and are no longer valid.
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      success('Password changed. You have been signed out on your other devices.');
      reset();
    } catch (err) {
      setError(parseApiError(err).userMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-3 bg-muted/60 hover:bg-muted rounded-xl transition-colors"
      >
        <Lock size={18} className="text-muted-foreground" />
        <span className="font-medium text-foreground">Change Password</span>
      </button>
    );
  }

  const inputClass = 'w-full px-3 py-2 rounded-lg bg-background border border-border text-sm';
  return (
    <form onSubmit={handleSubmit} className="col-span-full px-4 py-3 bg-muted/60 rounded-xl space-y-3">
      <p className="text-sm font-medium text-foreground flex items-center gap-2"><Lock size={14} /> Change password</p>
      <input aria-label="Current password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Current password" className={inputClass} />
      <input aria-label="New password" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} placeholder={`New password (min ${MIN_LENGTH} characters)`} className={inputClass} />
      <input aria-label="Confirm new password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" className={inputClass} />
      {error && (
        <p role="alert" className="text-xs text-destructive flex items-center gap-1.5"><AlertCircle size={12} /> {error}</p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={submitting || !current} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {submitting ? 'Saving…' : 'Update Password'}
        </button>
        <button type="button" onClick={reset} className="px-4 py-2 bg-muted rounded-lg text-sm">Cancel</button>
      </div>
    </form>
  );
};

export default ChangePasswordForm;
