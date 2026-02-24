import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { UserRole } from '@common';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { getDemoUserById, type DemoUser } from '@/demo';
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
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [threshold, setThreshold] = useState(500);

  // Fetch pending withdrawals
  const { data: withdrawals = [], isLoading } = useQuery<WithdrawalRequest[]>({
    queryKey: ['admin-withdrawals', threshold],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/withdrawals/pending', {
          params: { threshold },
        });
        return response.data;
      } catch (error) {
        if (!isDemoMode) throw error;

        logger.warn('Failed to fetch withdrawals, using demo data');
        const demoBaba1 = getDemoUserById('demo-baba-1') || ({ id: 'demo-baba-1', name: 'Babalawo', role: UserRole.BABALAWO } as DemoUser);
        const demoBaba2 = getDemoUserById('demo-baba-2') || ({ id: 'demo-baba-2', name: 'Babalawo', role: UserRole.BABALAWO } as DemoUser);
        const demoVendor1 = getDemoUserById('demo-vendor-1') || ({ id: 'demo-vendor-1', name: 'Vendor', role: UserRole.VENDOR } as DemoUser);

        const demoWithdrawals: WithdrawalRequest[] = [
          {
            id: 'wd-001',
            userId: demoBaba1.id,
            escrowId: 'escrow-001',
            amount: 1200,
            currency: 'USD',
            bankAccount: '1234567890',
            bankName: 'Zenith Bank',
            accountName: 'Baba Femi Sowande',
            status: 'PENDING',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            user: {
              id: demoBaba1.id,
              name: demoBaba1.name,
              email: demoBaba1.email || 'ifatunde@example.com',
            },
            escrow: {
              id: 'escrow-001',
              type: 'CONSULTATION',
              amount: 1200,
            },
          },
          {
            id: 'wd-002',
            userId: demoVendor1.id,
            escrowId: null,
            amount: 600,
            currency: 'USD',
            bankAccount: '9876543210',
            bankName: 'GTBank',
            accountName: 'Iya Omitonade',
            status: 'PENDING',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            user: {
              id: demoVendor1.id,
              name: demoVendor1.name,
              email: demoVendor1.email || 'yeye@example.com',
            },
          },
          {
            id: 'wd-003',
            userId: demoBaba2.id,
            escrowId: null,
            amount: 300,
            currency: 'USD',
            bankAccount: '5556667777',
            bankName: 'Access Bank',
            accountName: 'Iya Funmilayo',
            status: 'PENDING',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            user: {
              id: demoBaba2.id,
              name: demoBaba2.name,
              email: demoBaba2.email || 'funmi@example.com',
            },
          },
        ];

        return demoWithdrawals.filter((item) => item.amount >= threshold);
      }
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
        <Loader2 className="w-6 h-6 animate-spin text-highlight" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-highlight">Payout Approvals</h2>
          <p className="text-sm text-muted mt-1">
            Review withdrawal requests requiring manual approval
          </p>
        </div>

        {/* Threshold Filter */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted">Threshold:</label>
          <select
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value))}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-highlight"
          >
            <option value="100">$100+</option>
            <option value="250">$250+</option>
            <option value="500">$500+</option>
            <option value="1000">$1,000+</option>
          </select>
        </div>
      </div>

      {/* Withdrawals List */}
      {withdrawals.length === 0 ? (
        <div className="text-center p-8 bg-white/5 rounded-xl border border-white/10">
          <p className="text-muted">No pending withdrawals above ${threshold}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Withdrawals List */}
          <div className="space-y-4">
            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className={`bg-white/5 rounded-xl p-6 border border-white/10 hover:border-highlight/30 transition-colors cursor-pointer ${
                  selectedWithdrawal?.id === withdrawal.id ? 'border-highlight' : ''
                }`}
                onClick={() => setSelectedWithdrawal(withdrawal)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{withdrawal.user.name}</h3>
                    <p className="text-sm text-muted">{withdrawal.user.email}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-highlight">
                      {formatCurrency(withdrawal.amount, withdrawal.currency)}
                    </div>
                    <div className="text-xs text-muted mt-1">
                      {new Date(withdrawal.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                {withdrawal.bankAccount && (
                  <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10 text-sm">
                    <div className="space-y-1">
                      <div>
                        <span className="text-muted">Bank:</span>{' '}
                        <span className="font-medium">{withdrawal.bankName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted">Account:</span>{' '}
                        <span className="font-medium">{withdrawal.accountName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted">Account Number:</span>{' '}
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
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-6 sticky top-6">
              <div>
                <h3 className="text-xl font-bold mb-2">Review Withdrawal</h3>
                <p className="text-sm text-muted">
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
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-2 text-sm">
                      <div>
                        <span className="text-muted">Bank Name:</span>{' '}
                        <span className="font-medium">{selectedWithdrawal.bankName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted">Account Name:</span>{' '}
                        <span className="font-medium">{selectedWithdrawal.accountName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted">Account Number:</span>{' '}
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
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div>
                    <label className="block text-sm font-medium mb-2">Admin Notes</label>
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-highlight"
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
