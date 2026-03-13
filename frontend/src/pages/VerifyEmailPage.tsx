import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

type Status = 'loading' | 'success' | 'error' | 'missing-token';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('missing-token');
      return;
    }

    api
      .get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res: { data?: { message?: string } }) => {
        setMessage(res.data?.message || 'Email verified successfully.');
        setStatus('success');
      })
      .catch((err: { response?: { data?: { message?: string } } }) => {
        setMessage(
          err?.response?.data?.message || 'This verification link is invalid or has already been used.'
        );
        setStatus('error');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-[2.5rem] p-10 border border-stone-100 shadow-2xl max-w-md w-full text-center space-y-6">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-input via-highlight to-input rounded-t-[2.5rem]" />

        <h1 className="text-2xl font-bold brand-font text-stone-800">Email Verification</h1>

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <Loader2 size={40} className="animate-spin text-highlight" />
            <p className="text-stone-500">Verifying your email address…</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <CheckCircle size={48} className="text-green-500" />
            <p className="text-stone-700 font-medium">{message}</p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-4 bg-highlight text-white rounded-2xl font-bold shadow-lg shadow-highlight/20 hover:bg-yellow-500 transition-all"
            >
              Continue to Sign In
            </button>
          </div>
        )}

        {(status === 'error' || status === 'missing-token') && (
          <div className="flex flex-col items-center gap-4 py-4">
            <XCircle size={48} className="text-red-400" />
            <p className="text-stone-600">
              {status === 'missing-token'
                ? 'No verification token found. Please use the link from your email.'
                : message}
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-4 bg-stone-100 text-stone-700 rounded-2xl font-bold hover:bg-stone-200 transition-all"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
