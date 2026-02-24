import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X, Loader2, CreditCard, Globe, Info } from 'lucide-react';
import api from '@/lib/api';
import { Currency, PaymentPurpose } from '@common';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency: Currency;
  purpose: PaymentPurpose;
  relatedId?: string;
  onSuccess?: (reference: string) => void;
  onError?: (error: string) => void;
}

/**
 * Payment Modal Component
 * Handles payment initialization and redirects to payment gateway
 */
const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  currency,
  purpose,
  relatedId,
  onSuccess,
  onError,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currency);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [conversionRate, setConversionRate] = useState<number | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<'PAYSTACK' | 'FLUTTERWAVE' | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Fetch currency conversion if currency differs from original
  const { data: conversionData } = useQuery({
    queryKey: ['currency-convert', amount, currency, selectedCurrency],
    queryFn: async () => {
      if (selectedCurrency === currency) {
        return null;
      }
      const response = await api.get('/payments/currency/convert', {
        params: {
          amount,
          from: currency,
          to: selectedCurrency,
          includeFees: 'false',
        },
      });
      return response.data;
    },
    enabled: isOpen && selectedCurrency !== currency,
  });

  // Determine payment provider based on currency
  useEffect(() => {
    if (selectedCurrency === Currency.NGN) {
      setSelectedProvider('PAYSTACK');
    } else {
      setSelectedProvider('FLUTTERWAVE');
    }
  }, [selectedCurrency]);

  // Update converted amount when conversion data changes
  useEffect(() => {
    if (conversionData) {
      setConvertedAmount(conversionData.convertedAmount);
      setConversionRate(conversionData.rate);
    } else if (selectedCurrency === currency) {
      setConvertedAmount(null);
      setConversionRate(null);
    }
  }, [conversionData, selectedCurrency, currency]);

  const initializePaymentMutation = useMutation({
    mutationFn: async () => {
      const finalAmount = convertedAmount || amount;
      const finalCurrency = selectedCurrency;

      const response = await api.post('/payments/initialize', {
        amount: finalAmount,
        currency: finalCurrency,
        purpose,
        relatedId,
        callbackUrl: `${window.location.origin}/payment/callback`,
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Redirect to payment gateway
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        const errorMessage = 'No payment URL received';
        setPaymentError(errorMessage);
        onError?.(errorMessage);
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Payment initialization failed';
      setPaymentError(errorMessage);
      onError?.(errorMessage);
      setIsProcessing(false);
    },
  });

  const handlePay = async () => {
    setIsProcessing(true);
    setPaymentError(null);
    try {
      await initializePaymentMutation.mutateAsync();
    } catch (error) {
      // Error handled in onError
    }
  };

  const handleDemoSuccess = () => {
    const reference = `DEMO-PAY-${Date.now()}`;
    onSuccess?.(reference);
    onClose();
  };

  if (!isOpen) return null;

  const formatCurrency = (amount: number, currency: Currency) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getPurposeLabel = (purpose: PaymentPurpose) => {
    switch (purpose) {
      case PaymentPurpose.WALLET_TOPUP:
        return 'Wallet Top-up';
      case PaymentPurpose.BOOKING:
        return 'Consultation Request';
      case PaymentPurpose.MARKETPLACE_ORDER:
        return 'Marketplace Order';
      case PaymentPurpose.COURSE_ENROLLMENT:
        return 'Course Enrollment';
      case PaymentPurpose.GUIDANCE_PLAN:
        return 'Guidance Plan Payment';
      default:
        return 'Payment';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-white/10 rounded-xl p-6 max-w-md w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-highlight flex items-center gap-2">
            <CreditCard className="w-6 h-6" />
            Complete Payment
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payment Details */}
        <div className="space-y-4">
          {paymentError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-2">
              <p className="text-sm text-red-300">{paymentError}</p>
              <button
                type="button"
                onClick={handleDemoSuccess}
                className="text-xs font-bold text-highlight hover:underline"
              >
                Complete in demo mode
              </button>
            </div>
          )}
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted">Purpose</span>
              <span className="font-medium">{getPurposeLabel(purpose)}</span>
            </div>

            {/* Currency Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-muted">
                Payment Currency
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value as Currency)}
                disabled={isProcessing}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-highlight disabled:opacity-50"
              >
                <option value={Currency.NGN}>₦ NGN (Nigerian Naira)</option>
                <option value={Currency.USD}>$ USD (US Dollar)</option>
                <option value={Currency.GBP}>£ GBP (British Pound)</option>
                <option value={Currency.CAD}>C$ CAD (Canadian Dollar)</option>
                <option value={Currency.EUR}>€ EUR (Euro)</option>
              </select>
            </div>

            {/* Amount Display */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              {selectedCurrency !== currency && convertedAmount && conversionRate ? (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Original Amount</span>
                    <span className="text-muted line-through">
                      {formatCurrency(amount, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Exchange Rate</span>
                    <span className="text-muted">
                      1 {currency} = {conversionRate.toFixed(4)} {selectedCurrency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-muted">Amount to Pay</span>
                    <span className="text-2xl font-bold text-highlight">
                      {formatCurrency(convertedAmount, selectedCurrency)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-muted">Amount</span>
                  <span className="text-2xl font-bold text-highlight">
                    {formatCurrency(amount, currency)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Gateway Info */}
          {selectedProvider && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-300">
                    Payment Gateway: {selectedProvider === 'PAYSTACK' ? 'Paystack' : 'Flutterwave'}
                  </p>
                  <p className="text-xs text-blue-300/70">
                    {selectedProvider === 'PAYSTACK'
                      ? 'You will be redirected to Paystack (Nigeria) to complete your payment securely.'
                      : 'You will be redirected to Flutterwave (Global) to complete your payment securely.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Refund Policy */}
          {(purpose === PaymentPurpose.BOOKING || purpose === PaymentPurpose.COURSE_ENROLLMENT) && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-yellow-300">Refund Policy</p>
                  <ul className="text-xs text-yellow-300/80 space-y-1 list-disc list-inside">
                    <li>
                      <strong>100% refund</strong> if service provider cancels
                    </li>
                    <li>
                      <strong>50% refund</strong> if you cancel after booking
                    </li>
                    <li>
                      <strong>100% refund</strong> for technical issues or service not completed
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-3 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handlePay}
            disabled={isProcessing}
            className="flex-1 px-4 py-3 bg-highlight text-white rounded-lg font-medium hover:bg-highlight/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Pay Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
