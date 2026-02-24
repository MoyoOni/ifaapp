import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';

interface PaymentCallbackViewProps {
  onBack?: () => void;
}

/**
 * Payment Callback View Component
 * Handles payment gateway redirects and verifies payment status
 */
const PaymentCallbackView: React.FC<PaymentCallbackViewProps> = ({ onBack }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [reference, setReference] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>('PAYSTACK');

  // Get reference from URL params on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('reference') || urlParams.get('tx_ref');
    const prov = urlParams.get('provider') || (ref?.startsWith('ILEASE_') ? 'FLUTTERWAVE' : 'PAYSTACK');
    setReference(ref);
    setProvider(prov);
  }, []);

  // Verify payment
  const { data: verificationResult, isLoading, error } = useQuery({
    queryKey: ['payment-verification', reference],
    queryFn: async () => {
      if (!reference) {
        throw new Error('No payment reference found');
      }

      const response = await api.get(`/payments/verify/${reference}`, {
        params: { provider },
      });
      return response.data;
    },
    enabled: !!reference && !!user,
    retry: 3,
    retryDelay: 2000,
  });

  // Handle verification result with useEffect (TanStack Query v5 pattern)
  useEffect(() => {
    if (verificationResult) {
      if (verificationResult.success) {
        setVerificationStatus('success');
        queryClient.invalidateQueries({ queryKey: ['wallet-balance', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['wallet-transactions', user?.id] });
      } else {
        setVerificationStatus('failed');
      }
    }
    if (error) {
      setVerificationStatus('failed');
    }
  }, [verificationResult, error, queryClient, user?.id]);

  const handleContinue = () => {
    if (onBack) {
      onBack();
    } else {
      window.location.href = '/';
    }
  };

  if (isLoading || verificationStatus === 'verifying') {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-highlight mx-auto" />
          <p className="text-lg">Verifying your payment...</p>
          <p className="text-sm text-muted">Please wait</p>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-green-500/30 space-y-6 text-center">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-green-400">Payment Successful!</h1>
            <p className="text-muted">
              Your payment of {verificationResult?.amount} {verificationResult?.currency} has been processed.
            </p>
            {verificationResult?.reference && (
              <p className="text-xs text-muted mt-2">
                Reference: {verificationResult.reference}
              </p>
            )}
          </div>
          <button
            onClick={handleContinue}
            className="w-full px-6 py-3 bg-highlight text-white rounded-lg font-medium hover:bg-highlight/80 transition-colors flex items-center justify-center gap-2"
          >
            Continue to Wallet
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-red-500/30 space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
            <XCircle className="w-12 h-12 text-red-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-red-400">Payment Failed</h1>
          <p className="text-muted">
            We couldn't verify your payment. Please try again or contact support if the issue persists.
          </p>
        </div>
        <button
          onClick={handleContinue}
          className="w-full px-6 py-3 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
        >
          Back to Wallet
        </button>
      </div>
    </div>
  );
};

export default PaymentCallbackView;
