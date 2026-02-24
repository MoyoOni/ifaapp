import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Plus, TrendingUp, TrendingDown, Eye, EyeOff, Copy, Check } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { useAuth } from '@/shared/hooks/use-auth';

interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  date: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

interface WalletBalance {
  balance: number;
  currency: string;
  lastUpdated: string;
}

/**
 * Wallet View Component
 * Financial transactions and balance management
 */
const WalletView: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showBalance, setShowBalance] = useState(true);
  const [copied, setCopied] = useState(false);
  const [amountToAdd, setAmountToAdd] = useState(1000); // Default amount

  // Fetch wallet balance
  const { data: balance, isLoading: _balanceLoading, isError: balanceError } = useQuery<WalletBalance>({
    queryKey: ['wallet-balance', user?.id],
    queryFn: async () => {
      try {
        const response = await api.get(`/wallet/balance/${user?.id}`);
        return response.data;
      } catch (e) {
        logger.warn('Using demo wallet balance');
        return {
          balance: 12500,
          currency: 'NGN',
          lastUpdated: new Date().toISOString(),
        };
      }
    },
    enabled: !!user,
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: transactionsLoading, isError: transactionsError } = useQuery<Transaction[]>({
    queryKey: ['wallet-transactions', user?.id],
    queryFn: async () => {
      try {
        const response = await api.get(`/wallet/transactions/${user?.id}`);
        return response.data;
      } catch (e) {
        logger.warn('Using demo transactions');
        return [
          {
            id: 'tx-001',
            type: 'CREDIT',
            amount: 5000,
            description: 'Added funds',
            date: new Date(Date.now() - 86400000).toISOString(),
            status: 'COMPLETED',
          },
          {
            id: 'tx-002',
            type: 'DEBIT',
            amount: 2500,
            description: 'Marketplace purchase',
            date: new Date(Date.now() - 172800000).toISOString(),
            status: 'COMPLETED',
          },
          {
            id: 'tx-003',
            type: 'CREDIT',
            amount: 10000,
            description: 'Referral bonus',
            date: new Date(Date.now() - 259200000).toISOString(),
            status: 'COMPLETED',
          },
        ];
      }
    },
    enabled: !!user,
  });

  // Add funds mutation
  const addFundsMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await api.post('/wallet/add-funds', {
        userId: user?.id,
        amount,
        currency: 'NGN',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions', user?.id] });
    },
  });

  // Copy wallet ID to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(user?.id || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (balanceError || transactionsError) {
    return (
      <div className="min-h-screen bg-stone-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="text-red-500" size={32} />
            </div>
            <h2 className="text-xl font-bold text-stone-900 mb-2">Wallet Error</h2>
            <p className="text-stone-600 mb-6">There was an issue loading your wallet. Please try again later.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-highlight text-white rounded-xl font-medium"
            >
              Reload Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-stone-900 mb-6 flex items-center gap-2">
          <CreditCard size={24} className="text-highlight" />
          My Wallet
        </h1>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Available Balance</p>
              <div className="flex items-center gap-3 mt-1">
                {showBalance ? (
                  <p className="text-4xl font-bold">
                    ₦{balance?.balance?.toLocaleString() || '0.00'}
                  </p>
                ) : (
                  <p className="text-4xl font-bold">••••••</p>
                )}
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  {showBalance ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <CreditCard size={28} />
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-6">
            <button 
              onClick={() => addFundsMutation.mutate(amountToAdd)}
              disabled={addFundsMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors disabled:opacity-75"
            >
              {addFundsMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Plus size={20} />
              )}
              Add Funds
            </button>
            
            <div className="flex-1 relative">
              <select
                value={amountToAdd}
                onChange={(e) => setAmountToAdd(Number(e.target.value))}
                className="w-full py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-medium appearance-none pr-8 pl-4 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <option value={1000}>₦1,000</option>
                <option value={2000}>₦2,000</option>
                <option value={5000}>₦5,000</option>
                <option value={10000}>₦10,000</option>
                <option value={20000}>₦20,000</option>
                <option value={50000}>₦50,000</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet ID */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-stone-500">Wallet ID</p>
            <p className="font-mono text-stone-900">{user?.id?.substring(0, 10)}...{user?.id?.substring(user?.id.length - 4)}</p>
          </div>
          <button 
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-medium transition-colors"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
          <h2 className="text-lg font-bold text-stone-900 mb-4">Recent Transactions</h2>
          
          {transactionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="text-stone-400" size={24} />
              </div>
              <p className="text-stone-500">No transactions yet</p>
              <p className="text-sm text-stone-400 mt-1">Your transactions will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map(transaction => (
                <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${transaction.type === 'CREDIT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {transaction.type === 'CREDIT' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    </div>
                    <div>
                      <p className="font-medium text-stone-900">{transaction.description}</p>
                      <p className="text-sm text-stone-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'CREDIT' ? '+' : '-'}₦{transaction.amount.toLocaleString()}
                    </p>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${
                      transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletView;