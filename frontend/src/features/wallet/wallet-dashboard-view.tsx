import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Lock,
  DollarSign,
  TrendingUp,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { getUserWallet } from '@/demo';
import { TransactionType, TransactionStatus, Currency, PaymentPurpose } from '@common';
import PaymentModal from '../payments/payment-modal';
import MultiCurrencyBalance from './multi-currency-balance';

interface WalletBalance {
  balance: number;
  currency: Currency;
  locked: boolean;
}

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  status: TransactionStatus;
  description?: string;
  reference?: string;
  createdAt: string;
}

interface RecentTransactionsResponse {
  transactions: Transaction[];
}

interface Escrow {
  id: string;
  type: string;
  amount: number;
  currency: Currency;
  status: string;
  relatedId?: string;
  autoReleaseAt?: string;
  expiryDate?: string;
  releaseTiers?: {
    tier1: number;
    tier2: number;
    releasedTier1: boolean;
    releasedTier2: boolean;
  };
  disputeId?: string;
  createdAt: string;
}

interface WalletDashboardViewProps {
  onViewTransactions?: () => void;
  onDeposit?: () => void;
  onWithdraw?: () => void;
}

/**
 * Wallet Dashboard View Component
 * Central hub for wallet management, balance, and quick actions
 */
const WalletDashboardView: React.FC<WalletDashboardViewProps> = ({
  onViewTransactions,
  onWithdraw: _onWithdraw,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [releasingEscrowId, setReleasingEscrowId] = useState<string | null>(null);



  // Fetch wallet balance
  const { data: walletBalance } = useQuery<WalletBalance>({
    queryKey: ['wallet-balance', user?.id],
    queryFn: async () => {
      try {
        const response = await api.get(`/wallet/${user?.id}/balance`);
        return response.data;
      } catch (error) {
        if (!isDemoMode) throw error;
        logger.warn('Failed to fetch wallet balance, using demo data');
        const demoWallet = user?.id ? getUserWallet(user.id) : null;
        return {
          balance: demoWallet?.balance ?? 0,
          currency: (demoWallet?.currency as Currency) ?? Currency.NGN,
          locked: false,
        };
      }
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // Fetch escrows with demo fallback
  const { data: escrows = [] } = useQuery<Escrow[]>({
    queryKey: ['escrows', user?.id],
    queryFn: async () => {
      try {
        const response = await api.get(`/wallet/${user?.id}/escrows`);
        return response.data || [];
      } catch (error) {
        if (!isDemoMode) throw error;
        logger.warn('Failed to fetch escrows, using demo data', error);
        // Return empty array for demo (no active escrows by default)
        return [];
      }
    },
    enabled: !!user?.id
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery<RecentTransactionsResponse>({
    queryKey: ['recent-tx', user?.id],
    queryFn: async () => {
      try {
        const response = await api.get(`/wallet/${user?.id}/transactions`, {
          params: { limit: 5, offset: 0 },
        });
        return response.data;
      } catch (error) {
        if (!isDemoMode) throw error;
        logger.warn('Failed to fetch recent transactions, using demo data');
        const demoWallet = user?.id ? getUserWallet(user.id) : null;
        const demoTransactions = (demoWallet?.transactions || []).map((tx: any) => ({
          id: tx.id,
          type: tx.type === 'CREDIT' ? TransactionType.DEPOSIT : TransactionType.PAYMENT,
          amount: tx.type === 'CREDIT' ? tx.amount : -Math.abs(tx.amount),
          currency: (demoWallet?.currency as Currency) ?? Currency.NGN,
          status: TransactionStatus.COMPLETED,
          description: tx.description,
          createdAt: tx.date,
        }));

        return { transactions: demoTransactions };
      }
    },
    initialData: { transactions: [] },
  });

  const availableBalance = walletBalance?.balance || 0;
  const escrowedAmount = 0;

  const formatCurrency = (val: number, curr = Currency.NGN) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: curr }).format(val);

  const formatDate = (d: string) => new Date(d).toLocaleDateString();

  const getTransactionIcon = (type: TransactionType) => {
    if (type === TransactionType.DEPOSIT) return <ArrowDownCircle className="w-5 h-5 text-green-500" />;
    if (type === TransactionType.WITHDRAWAL) return <ArrowUpCircle className="w-5 h-5 text-red-500" />;
    return <DollarSign className="w-5 h-5 text-stone-400" />;
  };

  const handleReleaseEscrow = (id: string, _tier: string, _name: string) => setReleasingEscrowId(id);

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setDepositAmount('');
    queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
  };

  return (
    <div className="space-y-8 p-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold brand-font text-stone-800">My Wallet</h1>
          <p className="text-stone-500">Manage your funds</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setDepositAmount('');
              setShowDepositModal(true);
            }}
            className="px-6 py-3 bg-highlight text-white rounded-xl font-bold hover:bg-yellow-500 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
          >
            <ArrowDownCircle className="w-5 h-5" />
            Add Funds
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="px-6 py-3 bg-white text-stone-600 border border-stone-200 rounded-xl font-bold hover:bg-stone-50 transition-all flex items-center gap-2"
          >
            <ArrowUpCircle className="w-5 h-5" />
            Withdraw
          </button>
        </div>
      </div >

      {/* Balance Cards */}
      < div className="grid grid-cols-1 md:grid-cols-3 gap-6" >
        {/* Total Balance */}
        < div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-xl shadow-stone-200/50 space-y-4 relative overflow-hidden" >
          <div className="absolute top-0 right-0 w-32 h-32 bg-highlight/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2 text-stone-500">
              <Wallet className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wider">Total Balance</span>
            </div>
            {walletBalance?.locked && (
              <Lock className="w-4 h-4 text-amber-500" />
            )}
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-extrabold text-stone-800 brand-font">
              {formatCurrency(walletBalance?.balance || 0, walletBalance?.currency)}
            </p>
            {walletBalance?.locked && (
              <p className="text-xs font-bold text-amber-500 mt-1">⚠️ Wallet is locked</p>
            )}
          </div>
        </div >

        {/* Available Balance */}
        < div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 shadow-sm space-y-4 text-green-900" >
          <div className="flex items-center gap-2 opacity-70">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wider">Available</span>
          </div>
          <div>
            <p className="text-4xl font-extrabold brand-font">
              {formatCurrency(availableBalance, walletBalance?.currency)}
            </p>
            {escrowedAmount > 0 && <p className="text-xs opacity-70 mt-1 font-medium">{formatCurrency(escrowedAmount, walletBalance?.currency)} held in escrow</p>}
          </div>
        </div >

        {/* Escrowed Amount */}
        {
          escrowedAmount > 0 ? (
            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 shadow-sm space-y-4 text-amber-900">
              <div className="flex items-center gap-2 opacity-70">
                <Lock className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-wider">In Escrow</span>
              </div>
              <div>
                <p className="text-4xl font-extrabold brand-font">
                  {formatCurrency(escrowedAmount, walletBalance?.currency)}
                </p>
                <p className="text-xs opacity-70 mt-1 font-medium">{escrows.length} active transaction{escrows.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          ) : (
            <div className="bg-stone-100 rounded-2xl p-6 border border-stone-200 border-dashed flex flex-col items-center justify-center text-stone-400 space-y-2">
              <CheckCircle size={32} className="opacity-50" />
              <span className="text-sm font-bold">No active escrows</span>
            </div>
          )
        }
      </div >

      {/* Multi-Currency Balance Display */}
      {
        walletBalance && user?.id && (
          <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
            <MultiCurrencyBalance
              userId={user.id}
              baseBalance={walletBalance.balance}
              baseCurrency={walletBalance.currency}
            />
          </div>
        )
      }

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold brand-font text-stone-800">Recent Activity</h2>
            {onViewTransactions && (
              <button
                onClick={onViewTransactions}
                className="text-highlight hover:text-yellow-600 text-sm font-bold uppercase tracking-wide"
              >
                View All
              </button>
            )}
          </div>

          {transactionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-highlight" />
            </div>
          ) : transactionsData?.transactions.length === 0 ? (
            <div className="text-center py-12 bg-stone-50 rounded-xl border border-stone-100 border-dashed">
              <p className="text-stone-400 font-medium">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactionsData?.transactions.map((transaction: Transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-100 hover:border-highlight/30 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-stone-100 group-hover:scale-110 transition-transform">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-bold text-stone-800">{transaction.description || transaction.type}</p>
                      <p className="text-xs text-stone-400 font-bold uppercase">
                        {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-lg ${transaction.amount > 0 ? 'text-emerald-600' : 'text-red-500'
                        }`}
                    >
                      {transaction.amount > 0 ? '+' : ''}
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </p>
                    <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider">
                      {transaction.status.toLowerCase()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Escrows */}
        {escrows.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm space-y-6">
            <h2 className="text-xl font-bold brand-font text-stone-800">Escrow Management</h2>
            <div className="space-y-4">
              {escrows.map((escrow) => {
                // Calculate released amount for multi-tier escrows
                let releasedAmount = 0;
                if (escrow.releaseTiers) {
                  const tier1Amount = escrow.amount * escrow.releaseTiers.tier1;
                  const tier2Amount = escrow.amount * escrow.releaseTiers.tier2;
                  releasedAmount =
                    (escrow.releaseTiers.releasedTier1 ? tier1Amount : 0) +
                    (escrow.releaseTiers.releasedTier2 ? tier2Amount : 0);
                }

                const isDisputed = escrow.status === 'DISPUTED';
                const isPartiallyReleased = escrow.status === 'PARTIALLY_RELEASED';

                return (
                  <div
                    key={escrow.id}
                    className={`p-5 rounded-2xl border ${isDisputed
                      ? 'border-red-200 bg-red-50'
                      : isPartiallyReleased
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-blue-100 bg-blue-50'
                      }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-stone-700 capitalize text-sm">{escrow.type.replace('_', ' ')}</p>
                          <p className="text-xs text-stone-400 font-medium">
                            Created {formatDate(escrow.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-stone-800">
                            {formatCurrency(escrow.amount, escrow.currency)}
                          </p>
                          <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">{escrow.status}</p>
                        </div>
                      </div>

                      {/* Multi-tier Release Status */}
                      {escrow.releaseTiers && (
                        <div className="bg-white/50 border border-black/5 rounded-xl p-4 space-y-3">

                          {/* Visual Progress Bar */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold text-stone-500">
                              <span>Completion</span>
                              <span>{((releasedAmount / escrow.amount) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-500"
                                style={{ width: `${(releasedAmount / escrow.amount) * 100}%` }}
                              />
                            </div>
                          </div>

                          {/* Release Control Buttons */}
                          {!isDisputed && escrow.status !== 'EXPIRED' && (
                            <div className="pt-3 border-t border-black/5 flex flex-wrap gap-2">
                              {/* Tier 1 */}
                              {!escrow.releaseTiers.releasedTier1 && (
                                <button
                                  type="button"
                                  onClick={() => handleReleaseEscrow(escrow.id, 'TIER_1', 'Tier 1')}
                                  disabled={releasingEscrowId === escrow.id}
                                  className="flex-1 px-3 py-2 bg-white border border-green-200 text-green-700 rounded-lg text-xs font-bold hover:bg-green-50 transition-colors shadow-sm"
                                >
                                  {releasingEscrowId === escrow.id ? 'Releasing...' : `Release Tier 1`}
                                </button>
                              )}
                              {/* Tier 2 */}
                              {!escrow.releaseTiers.releasedTier2 && (
                                <button
                                  type="button"
                                  onClick={() => handleReleaseEscrow(escrow.id, 'TIER_2', 'Tier 2')}
                                  disabled={releasingEscrowId === escrow.id}
                                  className="flex-1 px-3 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors shadow-sm"
                                >
                                  {releasingEscrowId === escrow.id ? 'Releasing...' : `Release Tier 2`}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Deposit Amount Input Modal */}
      {
        showDepositModal && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95">
              <h3 className="text-2xl font-bold text-stone-800 brand-font text-center">Add Funds</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const amount = parseFloat(depositAmount);
                if (isNaN(amount) || amount <= 0) return;
                setShowDepositModal(false);
                setShowPaymentModal(true);
              }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-stone-400 tracking-widest text-center block">Amount to Deposit</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xl">
                      {walletBalance?.currency === Currency.NGN ? '₦' : '$'}
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-4 bg-stone-50 border border-stone-200 rounded-xl text-3xl font-bold text-center text-stone-800 focus:outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight transition-all"
                      placeholder="0.00"
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDepositModal(false);
                      setDepositAmount('');
                    }}
                    className="px-6 py-4 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-4 bg-highlight text-white rounded-xl font-bold hover:bg-yellow-500 transition-colors shadow-lg"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Withdraw Modal */}
      {
        showWithdrawModal && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95">
              <h3 className="text-2xl font-bold text-stone-800 brand-font text-center">Withdraw Funds</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                alert('Withdrawal request submitted for processing. (Simulated)');
                setShowWithdrawModal(false);
              }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-stone-400 tracking-widest text-center block">Amount to Withdraw</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xl">
                      {walletBalance?.currency === Currency.NGN ? '₦' : '$'}
                    </div>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-4 bg-stone-50 border border-stone-200 rounded-xl text-3xl font-bold text-center text-stone-800 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-2 border-t border-stone-100">
                  <h4 className="font-bold text-sm text-center">Destination Account</h4>
                  <select className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium">
                    <option>GTBank - *9920</option>
                    <option>Access Bank - *2210</option>
                    <option>Add New Bank Account...</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="px-6 py-4 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg"
                  >
                    Withdraw
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Payment Modal */}
      {
        showPaymentModal && depositAmount && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              setDepositAmount('');
            }}
            amount={parseFloat(depositAmount)}
            currency={walletBalance?.currency || Currency.NGN}
            purpose={PaymentPurpose.WALLET_TOPUP}
            onSuccess={handlePaymentSuccess}
            onError={(error) => {
              logger.error('Payment error:', error);
              setShowPaymentModal(false);
            }}
          />
        )
      }
    </div >
  );
};

export default WalletDashboardView;
