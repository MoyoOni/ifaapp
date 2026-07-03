import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';

interface UnverifiedPayment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  reference: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

const PaymentVerificationView: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [hours, setHours] = useState(48);

  const { data: payments = [], isLoading, isError, refetch } = useQuery<UnverifiedPayment[]>({
    queryKey: ['admin-unverified-payments', hours],
    queryFn: async () => {
      const res = await api.get('/admin/payments/unverified', { params: { hours } });
      return res.data;
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const res = await api.post(`/admin/payments/verify/${transactionId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-unverified-payments'] });
      success('Payment verified successfully');
    },
    onError: (err: any) => {
      toastError(err?.response?.data?.message || 'Failed to verify payment');
    },
  });

  if (isError) {
    return (
      <div className="bg-card rounded-2xl p-8 border border-border text-center">
        <CreditCard className="mx-auto mb-4 text-muted-foreground" size={48} />
        <h2 className="text-lg font-bold text-foreground mb-2">Failed to Load Payments</h2>
        <p className="text-muted-foreground text-sm mb-4">Could not fetch unverified payments.</p>
        <button onClick={() => refetch()} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <CreditCard size={24} /> Payment Verification
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Payments that may have missed webhook confirmation. {payments.length > 0 && `${payments.length} pending.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Last</label>
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            aria-label="Time range filter"
            className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value={24}>24 hours</option>
            <option value={48}>48 hours</option>
            <option value={72}>72 hours</option>
            <option value={168}>7 days</option>
          </select>
          <button
            onClick={() => refetch()}
            className="p-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse h-16 bg-muted rounded-xl" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 border border-border text-center">
          <CheckCircle className="mx-auto mb-4 text-green-500 dark:text-green-400" size={48} />
          <h2 className="text-lg font-bold text-foreground mb-2">All Payments Verified</h2>
          <p className="text-muted-foreground text-sm">No unverified payments in the last {hours} hours.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((payment) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-xl p-4 border border-border flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">
                    ₦{payment.amount.toLocaleString()}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full border bg-yellow-500/20 text-yellow-400 border-yellow-500/30 font-medium">
                    {payment.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {payment.user.name} — Ref: {payment.reference}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(payment.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => verifyMutation.mutate(payment.id)}
                  disabled={verifyMutation.isPending}
                  className="px-3 py-1.5 text-sm bg-green-500/10 dark:text-green-400 text-green-600 rounded-lg hover:bg-green-500/20 transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <CheckCircle size={14} /> Verify
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentVerificationView;
