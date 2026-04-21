import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  Lock,
  DollarSign,
  Filter,
  Loader2,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';
import { TransactionType, TransactionStatus, Currency } from '@common';
import { SkeletonTable } from '@/shared/components/skeleton';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  status: TransactionStatus;
  description?: string;
  reference?: string;
  createdAt: string;
  updatedAt: string;
}

interface TransactionHistoryViewProps {
  onBack?: () => void;
}

/**
 * Transaction History View Component
 * Complete transaction history with filters and pagination
 */
const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<TransactionType | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const limit = 20;

  // Fetch transactions
  const { data: transactionsData, isLoading } = useQuery<{
    transactions: Transaction[];
    total: number;
    limit: number;
    offset: number;
  }>({
    queryKey: ['wallet-transactions', user?.id, selectedType, selectedStatus, page],
    queryFn: async () => {
      const response = await api.get(`/wallet/${user?.id}/transactions`, {
        params: {
          type: selectedType !== 'ALL' ? selectedType : undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          limit,
          offset: page * limit,
        },
      });
      return response.data;
    },
    enabled: !!user?.id && !localStorage.getItem('dev_mode_role'),
  });

  const formatCurrency = (amount: number, currency: Currency = Currency.NGN) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.DEPOSIT:
        return <ArrowDownCircle className="w-5 h-5 dark:text-green-400 text-green-600" />;
      case TransactionType.WITHDRAWAL:
        return <ArrowUpCircle className="w-5 h-5 text-red-400" />;
      case TransactionType.ESCROW_HOLD:
        return <Lock className="w-5 h-5 text-yellow-400" />;
      case TransactionType.ESCROW_RELEASE:
        return <ArrowUpCircle className="w-5 h-5 text-blue-400" />;
      case TransactionType.PAYMENT:
        return <DollarSign className="w-5 h-5 text-purple-400" />;
      case TransactionType.REFUND:
        return <ArrowDownCircle className="w-5 h-5 text-orange-400" />;
      default:
        return <DollarSign className="w-5 h-5 text-muted-foreground/70" />;
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return 'text-green-400';
      case TransactionStatus.PENDING:
        return 'text-yellow-400';
      case TransactionStatus.FAILED:
        return 'text-red-400';
      case TransactionStatus.CANCELLED:
        return 'text-muted-foreground/70';
      default:
        return 'text-muted-foreground/70';
    }
  };

  const totalPages = transactionsData
    ? Math.ceil(transactionsData.total / limit)
    : 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  aria-label="Go back"
                  title="Go back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-5xl font-bold brand-font text-highlight">
                Transaction History
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              {transactionsData?.total || 0} total transactions
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl p-6 border border-border space-y-4">
          <div className="flex items-center gap-2 text-highlight mb-4">
            <Filter className="w-5 h-5" />
            <h2 className="text-xl font-bold">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Transaction Type</label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value as TransactionType | 'ALL');
                  setPage(0);
                }}
                aria-label="Filter by transaction type"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-highlight"
              >
                <option value="ALL">All Types</option>
                {Object.values(TransactionType).map((type) => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as TransactionStatus | 'ALL');
                  setPage(0);
                }}
                aria-label="Filter by transaction status"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-highlight"
              >
                <option value="ALL">All Statuses</option>
                {Object.values(TransactionStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-card rounded-xl p-6 border border-border space-y-4">
          {isLoading ? (
            <SkeletonTable rows={5} />
          ) : transactionsData?.transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No transactions found</p>
              <p className="text-muted-foreground text-sm mt-2">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {transactionsData?.transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border/60 hover:border-border transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {getTransactionIcon(transaction.type)}
                      <div className="flex-1">
                        <p className="font-medium">
                          {transaction.description || transaction.type.replace('_', ' ')}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-muted-foreground">
                            {formatDate(transaction.createdAt)}
                          </p>
                          {transaction.reference && (
                            <span className="text-xs text-muted-foreground">
                              Ref: {transaction.reference.substring(0, 8)}...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p
                        className={`font-bold text-lg ${transaction.amount > 0 ? 'dark:text-green-400 text-green-600' : 'text-red-400'
                          }`}
                      >
                        {transaction.amount > 0 ? '+' : ''}
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </p>
                      <p className={`text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <p className="text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </p>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistoryView;
