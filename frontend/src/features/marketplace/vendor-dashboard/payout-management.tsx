import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, ArrowDownToLine, Clock, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

interface WalletBalance {
  balance: number;
  pendingEscrow?: number;
  currency?: string;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
  notes?: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

const statusConfig: Record<string, { icon: React.ElementType; label: string; cls: string }> = {
  PENDING:   { icon: Clock,        label: 'Pending',   cls: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
  APPROVED:  { icon: CheckCircle2, label: 'Approved',  cls: 'text-blue-600  bg-blue-100 dark:bg-blue-900/30'  },
  COMPLETED: { icon: CheckCircle2, label: 'Paid Out',  cls: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  REJECTED:  { icon: XCircle,      label: 'Rejected',  cls: 'text-red-600   bg-red-100 dark:bg-red-900/30'   },
};

interface PayoutManagementProps {
  activeTab: string;
}

const PayoutManagement: React.FC<PayoutManagementProps> = ({ activeTab }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [amount, setAmount] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data: balance } = useQuery<WalletBalance>({
    queryKey: ['wallet-balance', user?.id],
    queryFn: async () => (await api.get(`/wallet/${user!.id}/balance`)).data,
    enabled: !!user?.id && activeTab === 'payouts',
  });

  const { data: withdrawals = [] } = useQuery<WithdrawalRequest[]>({
    queryKey: ['withdrawals', user?.id],
    queryFn: async () => {
      const res = await api.get(`/wallet/${user!.id}/withdrawals`);
      return res.data?.withdrawals ?? res.data ?? [];
    },
    enabled: !!user?.id && activeTab === 'payouts',
  });

  const { mutate: requestWithdrawal, isPending } = useMutation({
    mutationFn: async () => {
      await api.post(`/wallet/${user!.id}/withdraw`, {
        amount: parseFloat(amount),
        bankDetails: { accountName, accountNumber, bankName },
      });
    },
    onSuccess: () => {
      setSuccess(true);
      setAmount(''); setAccountName(''); setAccountNumber(''); setBankName('');
      qc.invalidateQueries({ queryKey: ['withdrawals', user?.id] });
      qc.invalidateQueries({ queryKey: ['wallet-balance', user?.id] });
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message ?? 'Failed to submit withdrawal request');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const amt = parseFloat(amount);
    if (!amt || amt < 1000) { setFormError('Minimum withdrawal is ₦1,000'); return; }
    if (balance && amt > balance.balance) { setFormError('Amount exceeds available balance'); return; }
    if (!accountName.trim() || !accountNumber.trim() || !bankName.trim()) {
      setFormError('All bank details are required'); return;
    }
    requestWithdrawal();
  };

  if (activeTab !== 'payouts') return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Payout Management</h2>
        <p className="text-muted-foreground">Request withdrawals and track your payment history</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet size={14} /> Available Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{fmt(balance?.balance ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Ready to withdraw</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock size={14} /> In Escrow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{fmt(balance?.pendingEscrow ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Released when orders complete</p>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal request form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownToLine size={16} /> Request Withdrawal
          </CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400">
              <CheckCircle2 size={18} />
              <p className="text-sm font-semibold">Withdrawal request submitted. We'll process it within 2–3 business days.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Amount (₦)</label>
                  <input
                    type="number"
                    min="1000"
                    step="100"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="e.g. GTBank"
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Account Number</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="0123456789"
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm font-mono tracking-widest"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Account Name</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    placeholder="As on bank records"
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                  />
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle size={14} /> {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : <ArrowDownToLine size={16} />}
                {isPending ? 'Submitting…' : 'Request Payout'}
              </button>
              <p className="text-xs text-muted-foreground">Minimum ₦1,000 · Processed within 2–3 business days</p>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal history */}
      {withdrawals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Withdrawal History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {withdrawals.map(w => {
                const cfg = statusConfig[w.status] ?? statusConfig.PENDING;
                const Icon = cfg.icon;
                return (
                  <div key={w.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cfg.cls}`}>
                        <Icon size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{fmt(w.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(w.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PayoutManagement;
