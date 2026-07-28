import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useToast } from '@/shared/components/toast';

interface WithdrawalRequest {
  id: string;
  userId: string;
  escrowId: string | null;
  amount: number;
  currency: string;
  bankAccount?: string;
  bankName?: string;
  accountName?: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  escrow?: {
    id: string;
    type: string;
    amount: number;
  };
}

/**
 * Payout Approvals View
 * Admin interface for reviewing and approving withdrawal requests > $500
 */
const PayoutApprovalsView: React.FC = () => {
  const queryClient = useQueryClient();
  const { error: toastError } = useToast();
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [threshold, setThreshold] = useState(500);
  const loggedPiiRef = useRef<Set<string>>(new Set());

  // Log PII reveal when detail panel opens with sensitive data
  useEffect(() => {
    if (!selectedWithdrawal) return;
    const key = selectedWithdrawal.id;
    if (loggedPiiRef.current.has(key)) return;
    loggedPiiRef.current.add(key);

    const fields: Array<{ fieldLabel: string }> = [];
    if (selectedWithdrawal.bankAccount) fields.push({ fieldLabel: 'bankAccount' });
    if (selectedWithdrawal.accountName) fields.push({ fieldLabel: 'accountName' });
    if (selectedWithdrawal.user?.email) fields.push({ fieldLabel: 'email' });

    for (const field of fields) {
      api.post('/admin/log-pii-reveal', {
        entityType: 'WithdrawalRequest',
        entityId: selectedWithdrawal.id,
        fieldLabel: field.fieldLabel,
        reason: 'Payout approval review',
      }).catch(() => { /* non-blocking */ });
    }
  }, [selectedWithdrawal]);

  // Fetch pending withdrawals
  const { data: withdrawals = [], isLoading } = useQuery<WithdrawalRequest[]>({
    queryKey: ['admin-withdrawals', threshold],
    queryFn: async () => {
      const response = await api.get('/admin/withdrawals/pending', {
        params: { threshold },
      });
      return response.data;
    },
  });

  const processMutation = useMutation({
    mutationFn: async ({ withdrawalId, approve }: { withdrawalId: string; approve: boolean }) => {
      const response = await api.post(`/admin/withdrawals/${withdrawalId}/process`, {
        approve,
        notes: approvalNotes,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setSelectedWithdrawal(null);
      setApprovalNotes('');
    },
    // HUMAN_BACKLOG.md: approving now actually attempts a real Paystack
    // transfer, which can genuinely fail (bad account details, insufficient
    // platform balance) -- this used to have no error handling at all, so a
    // failed approval would look identical to a successful one in the UI.
    onError: (err: any) => {
      toastError(
        err?.response?.data?.message ?? 'Failed to process this withdrawal. Please try again.'
      );
    },
  });

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleProcess = (withdrawal: WithdrawalRequest, approve: boolean) => {
    setSelectedWithdrawal(withdrawal);
    processMutation.mutate({ withdrawalId: withdrawal.id, approve });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="md" variant="highlight" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-highlight">Payout Approvals</h2>
          <p className="text-sm text-stone-500 mt-1">
            Review withdrawal requests requiring manual approval
          </p>
        </div>

        {/* Threshold Filter */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-stone-500">Threshold:</label>
          <select
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value))}
            aria-label="Withdrawal threshold filter"
            className="px-4 py-2 bg-card border border-border rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:border-highlight"
          >
            <option value="100">₦100+</option>
            <option value="250">₦250+</option>
            <option value="500">₦500+</option>
            <option value="1000">₦1,000+</option>
          </select>
        </div>
      </div>

      {/* Withdrawals List */}
      {withdrawals.length === 0 ? (
        <div className="text-center p-8 bg-card rounded-xl border border-border">
          <p className="text-stone-500">No pending withdrawals above ₦{threshold.toLocaleString()}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Withdrawals List */}
          <div className="space-y-4">
            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className={`bg-card rounded-xl p-6 border border-border hover:border-highlight/30 transition-colors cursor-pointer ${
                  selectedWithdrawal?.id === withdrawal.id ? 'border-highlight' : ''
                }`}
                onClick={() => setSelectedWithdrawal(withdrawal)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{withdrawal.user.name}</h3>
                    <p className="text-sm text-stone-500">{withdrawal.user.email}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-highlight">
                      {formatCurrency(withdrawal.amount, withdrawal.currency)}
                    </div>
                    <div className="text-xs text-stone-500 mt-1">
                      {new Date(withdrawal.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                {withdrawal.bankAccount && (
                  <div className="mb-4 p-3 bg-muted/40 rounded-lg border border-border text-sm">
                    <div className="space-y-1">
                      <div>
                        <span className="text-stone-500">Bank:</span>{' '}
                        <span className="font-medium">{withdrawal.bankName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-stone-500">Account:</span>{' '}
                        <span className="font-medium">{withdrawal.accountName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-stone-500">Account Number:</span>{' '}
                        <span className="font-medium font-mono">
                          {withdrawal.bankAccount.slice(-4).padStart(withdrawal.bankAccount.length, '*')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Escrow Reference */}
                {withdrawal.escrow && (
                  <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30 text-sm">
                    <div>
                      <span className="text-blue-300">From Escrow:</span>{' '}
                      <span className="font-medium">{withdrawal.escrow.type}</span>
                    </div>
                    <div className="text-blue-300/80 mt-1">
                      Escrow Amount: {formatCurrency(withdrawal.escrow.amount, withdrawal.currency)}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProcess(withdrawal, false);
                    }}
                    disabled={processMutation.isPending}
                    className="flex-1 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processMutation.isPending && selectedWithdrawal?.id === withdrawal.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Reject
                      </>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProcess(withdrawal, true);
                    }}
                    disabled={processMutation.isPending}
                    className="flex-1 px-4 py-2 bg-highlight text-white rounded-lg font-medium hover:bg-highlight/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processMutation.isPending && selectedWithdrawal?.id === withdrawal.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Approval Panel */}
          {selectedWithdrawal && (
            <div className="bg-card rounded-xl p-6 border border-border space-y-6 sticky top-6">
              {/* PII Disclosure Notice */}
              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-yellow-300">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>Viewing sensitive data — this access is logged.</span>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2">Review Withdrawal</h3>
                <p className="text-sm text-stone-500">
                  {formatCurrency(selectedWithdrawal.amount, selectedWithdrawal.currency)}
                </p>
              </div>

              {/* Withdrawal Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">User</label>
                  <p className="text-sm">
                    {selectedWithdrawal.user.name} ({selectedWithdrawal.user.email})
                  </p>
                </div>

                {selectedWithdrawal.bankAccount && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Bank Details</label>
                    <div className="bg-muted/40 rounded-lg p-4 border border-border space-y-2 text-sm">
                      <div>
                        <span className="text-stone-500">Bank Name:</span>{' '}
                        <span className="font-medium">{selectedWithdrawal.bankName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-stone-500">Account Name:</span>{' '}
                        <span className="font-medium">{selectedWithdrawal.accountName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-stone-500">Account Number:</span>{' '}
                        <span className="font-medium font-mono">{selectedWithdrawal.bankAccount}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedWithdrawal.escrow && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Escrow Reference</label>
                    <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30 text-sm">
                      <div>
                        <span className="text-blue-300">Type:</span>{' '}
                        <span className="font-medium">{selectedWithdrawal.escrow.type}</span>
                      </div>
                      <div className="text-blue-300/80 mt-1">
                        Amount: {formatCurrency(selectedWithdrawal.escrow.amount, selectedWithdrawal.currency)}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Request Date</label>
                  <p className="text-sm">{new Date(selectedWithdrawal.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Approval Actions */}
              {selectedWithdrawal.status === 'PENDING' && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div>
                    <label className="block text-sm font-medium mb-2">Admin Notes</label>
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 bg-card border border-border rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:border-highlight"
                      placeholder="Add notes about your decision..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleProcess(selectedWithdrawal, false)}
                      disabled={processMutation.isPending}
                      className="flex-1 px-4 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {processMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Reject
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleProcess(selectedWithdrawal, true)}
                      disabled={processMutation.isPending}
                      className="flex-1 px-4 py-3 bg-highlight text-white rounded-lg font-medium hover:bg-highlight/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {processMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PayoutApprovalsView;

