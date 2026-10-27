import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { parseApiError } from '@/shared/utils/api-error';

type Status = 'loading' | 'success' | 'error' | 'missing-token';

// Target of the link emailed to the NEW address when a member changes their
// email in Settings (/confirm-email-change?token=...).
const ConfirmEmailChangePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'missing-token');
  const [message, setMessage] = useState('');
  // The link is single-use, so confirm exactly once -- React StrictMode runs
  // effects twice in development, and the second call would report the
  // (already successful) link as used.
  const confirmed = useRef(false);

  useEffect(() => {
    if (!token || confirmed.current) return;
    confirmed.current = true;
    api
      .post('/auth/confirm-email-change', { token })
      .then((res) => {
        setMessage(`Your email address is now ${res.data?.email ?? 'updated'}. Use it the next time you sign in.`);
        setStatus('success');
      })
      .catch((err) => {
        setMessage(parseApiError(err).userMessage);
        setStatus('error');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-6">
      <div className="bg-card rounded-[2.5rem] p-10 border border-border/50 shadow-2xl max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-bold brand-font text-foreground">Confirm New Email</h1>

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <Loader2 size={40} className="animate-spin text-highlight" />
            <p className="text-muted-foreground">Confirming your new email address…</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <CheckCircle size={48} className="text-success" />
            <p className="text-foreground font-medium">{message}</p>
            <Link to="/login" className="w-full py-4 bg-highlight text-highlight-foreground rounded-2xl font-bold">Continue</Link>
          </div>
        )}

        {(status === 'error' || status === 'missing-token') && (
          <div className="flex flex-col items-center gap-4 py-4">
            <XCircle size={48} className="text-destructive" />
            <p className="text-muted-foreground">
              {status === 'missing-token' ? 'This link is missing its confirmation code. Please use the link from your email.' : message}
            </p>
            <Link to="/settings" className="w-full py-4 bg-muted/60 text-foreground rounded-2xl font-bold">Back to Settings</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmEmailChangePage;
