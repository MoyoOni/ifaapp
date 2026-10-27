import React, { useState } from 'react';
import { Mail, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { parseApiError } from '@/shared/utils/api-error';

// Settings' "Update Email" used to navigate to /profile, which can't change
// an email. The change only takes effect once the new address confirms via
// the link the backend emails to it.
interface ChangeEmailFormProps {
  /** Google-only accounts have no password to confirm the change with. */
  hasPassword: boolean;
}

const ChangeEmailForm: React.FC<ChangeEmailFormProps> = ({ hasPassword }) => {
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const close = () => { setOpen(false); setNewEmail(''); setPassword(''); setError(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post('/auth/change-email', { newEmail: newEmail.trim(), currentPassword: password });
      setSent(res.data?.message ?? `We sent a confirmation link to ${newEmail.trim()}.`);
      close();
    } catch (err) {
      setError(parseApiError(err).userMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => { setSent(null); setOpen(true); }}
          className="w-full flex items-center gap-2 px-4 py-3 bg-muted/60 hover:bg-muted rounded-xl transition-colors"
        >
          <Mail size={18} className="text-muted-foreground" />
          <span className="font-medium text-foreground">Update Email</span>
        </button>
        {sent && (
          <p role="status" className="text-xs text-success flex items-start gap-1.5 px-1">
            <CheckCircle size={12} className="mt-0.5 shrink-0" /> {sent}
          </p>
        )}
      </div>
    );
  }

  if (!hasPassword) {
    return (
      <div className="col-span-full px-4 py-3 bg-muted/60 rounded-xl space-y-2 text-sm">
        <p className="text-foreground">To change your email, first set a password for your account (below), so we can confirm it's you.</p>
        <button type="button" onClick={close} className="px-4 py-2 bg-muted rounded-lg text-sm">Close</button>
      </div>
    );
  }

  const inputClass = 'w-full px-3 py-2 rounded-lg bg-background border border-border text-sm';
  return (
    <form onSubmit={handleSubmit} className="col-span-full px-4 py-3 bg-muted/60 rounded-xl space-y-3">
      <p className="text-sm font-medium text-foreground flex items-center gap-2"><Mail size={14} /> Change email</p>
      <input aria-label="New email address" type="email" autoComplete="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="New email address" className={inputClass} />
      <input aria-label="Current password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Current password" className={inputClass} />
      <p className="text-xs text-muted-foreground">We'll send a link to the new address. Your email changes once you open it.</p>
      {error && (
        <p role="alert" className="text-xs text-destructive flex items-center gap-1.5"><AlertCircle size={12} /> {error}</p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={submitting || !newEmail.trim() || !password} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {submitting ? 'Sending…' : 'Send confirmation link'}
        </button>
        <button type="button" onClick={close} className="px-4 py-2 bg-muted rounded-lg text-sm">Cancel</button>
      </div>
    </form>
  );
};

export default ChangeEmailForm;
