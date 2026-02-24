import React, { useState } from 'react';
import { Wallet, TrendingUp, CreditCard, ArrowDown, ArrowUp, Download, Eye, X, Check } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';

interface Transaction {
  id: string;
  type: 'debit' | 'credit';
  amount: number;
  description: string;
  category: 'consultation' | 'product' | 'refund' | 'deposit';
  status: 'completed' | 'pending' | 'failed';
  date: Date;
  balanceAfter: number;
}

const ClientWalletView: React.FC = () => {
  const { user: _user } = useAuth();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'consultation' | 'product' | 'refund' | 'deposit'>('all');
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [amountToAdd, setAmountToAdd] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');

  // Mock transaction data
  const transactions: Transaction[] = [
    {
      id: 'txn-1',
      type: 'debit',
      amount: 15000,
      description: 'Consultation with Babalawo Adeyemi',
      category: 'consultation',
      status: 'completed',
      date: new Date(Date.now() - 86400000),
      balanceAfter: 35000
    },
    {
      id: 'txn-2',
      type: 'credit',
      amount: 25000,
      description: 'Product purchase refund',
      category: 'refund',
      status: 'completed',
      date: new Date(Date.now() - 172800000),
      balanceAfter: 50000
    },
    {
      id: 'txn-3',
      type: 'debit',
      amount: 12000,
      description: 'Ifa Divination Chain purchase',
      category: 'product',
      status: 'completed',
      date: new Date(Date.now() - 259200000),
      balanceAfter: 25000
    },
    {
      id: 'txn-4',
      type: 'credit',
      amount: 50000,
      description: 'Initial wallet deposit',
      category: 'deposit',
      status: 'completed',
      date: new Date(Date.now() - 604800000),
      balanceAfter: 62000
    },
    {
      id: 'txn-5',
      type: 'debit',
      amount: 8000,
      description: 'Pending consultation payment',
      category: 'consultation',
      status: 'pending',
      date: new Date(),
      balanceAfter: 35000
    }
  ];

  const filteredTransactions = transactions.filter(txn => {
    const matchesCategory = categoryFilter === 'all' || txn.category === categoryFilter;
    return matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'consultation': return 'bg-purple-100 text-purple-800';
      case 'product': return 'bg-blue-100 text-blue-800';
      case 'refund': return 'bg-green-100 text-green-800';
      case 'deposit': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  // Calculate totals
  const totalBalance = transactions.length > 0 ? transactions[0].balanceAfter : 0;
  const totalSpent = transactions
    .filter(t => t.type === 'debit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalReceived = transactions
    .filter(t => t.type === 'credit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleAddFunds = () => {
    if (!amountToAdd || isNaN(parseFloat(amountToAdd)) || parseFloat(amountToAdd) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    // Here would be the actual implementation to add funds
    // For now, just close the modal and show a success message
    alert(`Successfully added ₦${parseFloat(amountToAdd).toLocaleString()} to your wallet via ${paymentMethod}`);
    setShowAddFundsModal(false);
    setAmountToAdd('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900">
            My Wallet
          </h1>
          <p className="text-stone-600 text-lg">
            Manage your funds and track all transactions.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            className="px-4 py-2 bg-stone-100 text-stone-700 font-bold rounded-xl hover:bg-stone-200 transition-colors flex items-center gap-2"
            onClick={() => setShowAddFundsModal(true)}
          >
            <CreditCard size={18} /> Add Funds
          </button>
          <button className="px-4 py-2 bg-highlight text-white font-bold rounded-xl hover:bg-yellow-600 transition-colors flex items-center gap-2">
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Current Balance</p>
              <h3 className="text-3xl font-bold text-stone-900 mt-1">{formatCurrency(totalBalance)}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-xl text-green-700">
              <Wallet size={28} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Total Spent</p>
              <h3 className="text-2xl font-bold text-stone-900 mt-1">{formatCurrency(totalSpent)}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl text-blue-700">
              <ArrowUp size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Total Received</p>
              <h3 className="text-2xl font-bold text-stone-900 mt-1">{formatCurrency(totalReceived)}</h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl text-purple-700">
              <ArrowDown size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            {(['week', 'month', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-highlight text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="px-3 py-1 border border-stone-200 rounded-lg focus:ring-2 focus:ring-highlight focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="consultation">Consultations</option>
              <option value="product">Products</option>
              <option value="refund">Refunds</option>
              <option value="deposit">Deposits</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions History */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <h2 className="text-xl font-bold text-stone-900">Transaction History</h2>
          <p className="text-stone-600 mt-1">{filteredTransactions.length} transactions</p>
        </div>
        
        <div className="divide-y divide-stone-100">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-stone-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      transaction.type === 'debit' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {transaction.type === 'debit' ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900">{transaction.description}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getCategoryColor(transaction.category)}`}>
                          {transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(transaction.status)}`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                        <span className="text-stone-500 text-sm">
                          {transaction.date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      transaction.type === 'debit' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {transaction.type === 'debit' ? '-' : '+'}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-stone-500 text-sm">Balance: {formatCurrency(transaction.balanceAfter)}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Wallet size={48} className="mx-auto text-stone-300 mb-4" />
              <h3 className="text-lg font-bold text-stone-900 mb-2">No transactions found</h3>
              <p className="text-stone-600">
                {categoryFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Your transaction history will appear here'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Spending Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-100 rounded-xl text-indigo-700">
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">Spending Analysis</h3>
              <ul className="space-y-2 text-sm text-stone-600">
                <li className="flex justify-between">
                  <span>Top Category:</span>
                  <span className="font-medium text-stone-900">Consultations</span>
                </li>
                <li className="flex justify-between">
                  <span>Avg. Transaction:</span>
                  <span className="font-medium text-stone-900">{formatCurrency(totalSpent / transactions.filter(t => t.type === 'debit').length || 0)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Largest Expense:</span>
                  <span className="font-medium text-stone-900">{formatCurrency(15000)}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-xl text-amber-700">
              <Eye size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">Security Tips</h3>
              <ul className="space-y-2 text-sm text-stone-600">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Enable two-factor authentication
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Regularly review transaction history
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Set up spending alerts
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Funds Modal */}
      {showAddFundsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-stone-900">Add Funds to Wallet</h3>
              <button 
                onClick={() => setShowAddFundsModal(false)}
                className="text-stone-500 hover:text-stone-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Amount (NGN)</label>
                <input
                  type="number"
                  value={amountToAdd}
                  onChange={(e) => setAmountToAdd(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 border rounded-xl flex flex-col items-center justify-center ${
                      paymentMethod === 'card'
                        ? 'border-highlight bg-highlight/10'
                        : 'border-stone-300'
                    }`}
                  >
                    <CreditCard size={24} className="mb-1" />
                    <span className="text-sm">Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank')}
                    className={`p-3 border rounded-xl flex flex-col items-center justify-center ${
                      paymentMethod === 'bank'
                        ? 'border-highlight bg-highlight/10'
                        : 'border-stone-300'
                    }`}
                  >
                    <div className="w-6 h-6 mb-1 bg-stone-300 rounded-full flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                    <span className="text-sm">Bank</span>
                  </button>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setShowAddFundsModal(false)}
                  className="flex-1 py-3 border border-stone-300 text-stone-700 rounded-xl font-bold hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFunds}
                  className="flex-1 py-3 bg-highlight text-white rounded-xl font-bold hover:bg-yellow-600 transition-colors"
                >
                  Add Funds
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientWalletView;