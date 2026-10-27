import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownToLine, Clock, CheckCircle2, XCircle, Loader2, AlertCircle,
  CreditCard, Star, Trash2, Plus,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

// Saved bank accounts, the withdrawal request form and withdrawal history --
// extracted from the vendor dashboard's PayoutManagement so the general
// /wallet page uses the same real flow. /wallet's Withdraw button used to open
// a modal listing hardcoded fake bank accounts that submitted nothing and
// toasted "(Simulated)", even though any role can withdraw.

interface WalletBalance {
  balance: number;
  pendingEscrow?: number;
  currency?: string;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  // HUMAN_BACKLOG.md: matches the real WithdrawalStatus enum values now
  // (this used to list a 'COMPLETED' value that was never actually returned
  // by the backend — the real terminal success state is 'PROCESSED').
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  createdAt: string;
  adminNotes?: string;
}

interface Bank {
  name: string;
  code: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
}

const MAX_BANK_ACCOUNTS = 3;
const NEW_ACCOUNT_OPTION = '__new__';

export const formatNgn = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

const statusConfig: Record<string, { icon: React.ElementType; label: string; cls: string }> = {
  PENDING:   { icon: Clock,        label: 'Pending',   cls: 'text-warning bg-warning/10' },
  APPROVED:  { icon: CheckCircle2, label: 'Approved',  cls: 'text-info bg-info/10' },
  PROCESSED: { icon: CheckCircle2, label: 'Paid Out',  cls: 'text-success bg-success/10' },
  REJECTED:  { icon: XCircle,      label: 'Rejected',  cls: 'text-destructive bg-destructive/10' },
};

// VENDOR_BACKLOG.md VND-002: withdrawal lifecycle tracker. Deliberately only
// two real forward stages -- the backend's WithdrawalStatus enum has no
// separate "in flight at Paystack" vs "confirmed" state, PROCESSED covers
// both (AdminFinanceService.processWithdrawal sets it optimistically on
// approval, and the transfer.success webhook is just an idempotent
// confirmation of the same status). Inventing a 5-stage UI on top of a
// 3-state backend would just be decorative and could mislead vendors about
// what's actually known.
const trackerStages = ['Submitted', 'Reviewed by Admin', 'Paid Out'] as const;

const stageIndexForStatus = (status: WithdrawalRequest['status']) => {
  if (status === 'PENDING') return 0;
  if (status === 'REJECTED') return 1; // reached review, but stopped there
  return 2; // APPROVED or PROCESSED
};

const WithdrawalTracker: React.FC<{ w: WithdrawalRequest }> = ({ w }) => {
  const currentStage = stageIndexForStatus(w.status);
  const rejected = w.status === 'REJECTED';

  return (
    <div className="flex items-center gap-1.5 mt-2">
      {trackerStages.map((stage, i) => {
        const reached = i <= currentStage;
        const isRejectedStop = rejected && i === 1;
        return (
          <React.Fragment key={stage}>
            {i > 0 && (
              <div className={`h-0.5 flex-1 rounded ${reached ? (isRejectedStop ? 'bg-destructive' : 'bg-success') : 'bg-border'}`} />
            )}
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                isRejectedStop
                  ? 'bg-destructive/10 text-destructive'
                  : reached
                  ? 'bg-success/10 text-success'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {isRejectedStop ? 'Rejected' : stage}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

interface WithdrawalPanelProps {
  /** Skip all fetching while the panel isn't shown (e.g. another dashboard tab). */
  enabled?: boolean;
  /** Called after a withdrawal request is accepted by the server. */
  onSubmitted?: () => void;
}

const WithdrawalPanel: React.FC<WithdrawalPanelProps> = ({ enabled = true, onSubmitted }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [amount, setAmount] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [saveNewAccount, setSaveNewAccount] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [addBankCode, setAddBankCode] = useState('');
  const [addAccountNumber, setAddAccountNumber] = useState('');
  const [addAccountName, setAddAccountName] = useState('');
  const [addAccountError, setAddAccountError] = useState<string | null>(null);

  const { data: balance } = useQuery<WalletBalance>({
    queryKey: ['wallet-balance', user?.id],
    queryFn: async () => (await api.get(`/wallet/${user!.id}/balance`)).data,
    enabled: !!user?.id && enabled,
  });

  // HUMAN_BACKLOG.md: a Paystack transfer needs the bank's numeric code, not
  // a free-typed bank name -- this is the real list, not an invented one.
  const { data: banks = [] } = useQuery<Bank[]>({
    queryKey: ['payout-banks'],
    queryFn: async () => (await api.get('/payments/banks')).data,
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
  });

  // VENDOR_BACKLOG.md VND-002: "Minimum payout threshold clearly displayed"
  const { data: payoutSettings } = useQuery<{ minPayoutThresholdNgn: number }>({
    queryKey: ['payout-settings'],
    queryFn: async () => (await api.get('/wallet/payout-settings')).data,
    enabled,
    staleTime: 60 * 60 * 1000,
  });
  const minPayout = payoutSettings?.minPayoutThresholdNgn ?? 5000;

  const { data: bankAccounts = [], isSuccess: bankAccountsLoaded } = useQuery<BankAccount[]>({
    queryKey: ['bank-accounts', user?.id],
    queryFn: async () => (await api.get(`/wallet/${user!.id}/bank-accounts`)).data,
    enabled: !!user?.id && enabled,
  });

  const { data: withdrawals = [] } = useQuery<WithdrawalRequest[]>({
    queryKey: ['withdrawals', user?.id],
    queryFn: async () => {
      const res = await api.get(`/wallet/${user!.id}/withdrawals`);
      return res.data?.withdrawals ?? res.data ?? [];
    },
    enabled: !!user?.id && enabled,
  });

  // Default the withdrawal form to the saved default account once loaded.
  // Waiting for the query matters: on the first render bankAccounts is the
  // empty fallback, and deciding then picked "Enter new bank details" before
  // the saved accounts arrived -- the default was never actually preselected.
  React.useEffect(() => {
    if (selectedAccountId || !bankAccountsLoaded) return;
    const defaultAccount = bankAccounts.find((a) => a.isDefault);
    if (defaultAccount) setSelectedAccountId(defaultAccount.id);
    else if (bankAccounts.length === 0) setSelectedAccountId(NEW_ACCOUNT_OPTION);
  }, [bankAccounts, bankAccountsLoaded, selectedAccountId]);

  const { mutate: requestWithdrawal, isPending } = useMutation({
    mutationFn: async () => {
      if (selectedAccountId && selectedAccountId !== NEW_ACCOUNT_OPTION) {
        await api.post(`/wallet/${user!.id}/withdraw`, {
          amount: parseFloat(amount),
          bankAccountId: selectedAccountId,
        });
        return;
      }
      const bank = banks.find((b) => b.code === bankCode);
      // HUMAN_BACKLOG.md: previously nested as `bankDetails: {...}`, which the
      // backend's ValidationPipe (whitelist: true) silently stripped entirely
      // -- every withdrawal ever filed through this form had no bank details
      // captured at all. Flat shape matches CreateWithdrawalRequestDto.
      await api.post(`/wallet/${user!.id}/withdraw`, {
        amount: parseFloat(amount),
        accountName,
        bankAccount: accountNumber,
        bankName: bank?.name ?? '',
        bankCode,
      });
      if (saveNewAccount && bank) {
        await api.post(`/wallet/${user!.id}/bank-accounts`, {
          bankName: bank.name,
          bankCode,
          accountNumber,
          accountName,
        }).catch(() => undefined); // best-effort; the withdrawal itself already succeeded
      }
    },
    onSuccess: () => {
      setSuccess(true);
      setAmount(''); setAccountName(''); setAccountNumber(''); setBankCode('');
      qc.invalidateQueries({ queryKey: ['withdrawals', user?.id] });
      qc.invalidateQueries({ queryKey: ['wallet-balance', user?.id] });
      qc.invalidateQueries({ queryKey: ['bank-accounts', user?.id] });
      onSubmitted?.();
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message ?? 'Failed to submit withdrawal request');
    },
  });

  const { mutate: addBankAccount, isPending: isAddingAccount } = useMutation({
    mutationFn: async () => {
      const bank = banks.find((b) => b.code === addBankCode);
      await api.post(`/wallet/${user!.id}/bank-accounts`, {
        bankName: bank?.name ?? '',
        bankCode: addBankCode,
        accountNumber: addAccountNumber,
        accountName: addAccountName,
      });
    },
    onSuccess: () => {
      setShowAddAccount(false);
      setAddBankCode(''); setAddAccountNumber(''); setAddAccountName(''); setAddAccountError(null);
      qc.invalidateQueries({ queryKey: ['bank-accounts', user?.id] });
    },
    onError: (err: any) => {
      setAddAccountError(err?.response?.data?.message ?? 'Failed to save bank account');
    },
  });

  const { mutate: setDefaultAccount } = useMutation({
    mutationFn: async (bankAccountId: string) =>
      api.patch(`/wallet/${user!.id}/bank-accounts/${bankAccountId}/default`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank-accounts', user?.id] }),
  });

  const { mutate: deleteAccount } = useMutation({
    mutationFn: async (bankAccountId: string) =>
      api.delete(`/wallet/${user!.id}/bank-accounts/${bankAccountId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank-accounts', user?.id] });
      if (selectedAccountId && !bankAccounts.some((a) => a.id === selectedAccountId)) {
        setSelectedAccountId('');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const amt = parseFloat(amount);
    if (!amt || amt < minPayout) { setFormError(`Minimum withdrawal is ${formatNgn(minPayout)}`); return; }
    if (balance && amt > balance.balance) { setFormError('Amount exceeds available balance'); return; }
    const usingSavedAccount = !!selectedAccountId && selectedAccountId !== NEW_ACCOUNT_OPTION;
    if (!usingSavedAccount && (!accountName.trim() || !accountNumber.trim() || !bankCode)) {
      setFormError('All bank details are required'); return;
    }
    requestWithdrawal();
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setAddAccountError(null);
    if (bankAccounts.length >= MAX_BANK_ACCOUNTS) {
      setAddAccountError(`You can save up to ${MAX_BANK_ACCOUNTS} bank accounts. Remove one before adding another.`);
      return;
    }
    if (!addAccountName.trim() || !addAccountNumber.trim() || !addBankCode) {
      setAddAccountError('All fields are required'); return;
    }
    addBankAccount();
  };

  return (
    <div className="space-y-6">
      {/* Saved bank accounts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard size={16} /> Saved Bank Accounts
          </CardTitle>
          {bankAccounts.length < MAX_BANK_ACCOUNTS && !showAddAccount && (
            <button
              onClick={() => setShowAddAccount(true)}
              className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              <Plus size={12} /> Add Account
            </button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {bankAccounts.length === 0 && !showAddAccount && (
            <p className="text-sm text-muted-foreground">
              No saved accounts yet. Add one below, or enter your bank details directly on the withdrawal form.
            </p>
          )}
          {bankAccounts.map((acc) => (
            <div key={acc.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <p className="text-sm font-bold text-foreground flex items-center gap-2">
                  {acc.bankName}
                  {acc.isDefault && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                      <Star size={10} fill="currentColor" /> Default
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {acc.accountNumber.replace(/^(\d{3})\d+(\d{3})$/, '$1••••$2')} · {acc.accountName}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {!acc.isDefault && (
                  <button
                    onClick={() => setDefaultAccount(acc.id)}
                    className="text-xs font-semibold text-muted-foreground hover:text-primary"
                  >
                    Make default
                  </button>
                )}
                <button
                  onClick={() => deleteAccount(acc.id)}
                  className="text-destructive hover:text-destructive/80"
                  aria-label={`Remove ${acc.bankName} account`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {showAddAccount && (
            <form onSubmit={handleAddAccount} className="space-y-3 pt-2 border-t border-border/50">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={addBankCode}
                  onChange={(e) => setAddBankCode(e.target.value)}
                  aria-label="Bank"
                  className="bg-muted/40 border border-border rounded-xl px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                >
                  <option value="">Select bank…</option>
                  {banks.map((bank) => (
                    <option key={bank.code} value={bank.code}>{bank.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  maxLength={10}
                  value={addAccountNumber}
                  onChange={(e) => setAddAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Account number"
                  className="bg-muted/40 border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 text-sm font-mono"
                />
                <input
                  type="text"
                  value={addAccountName}
                  onChange={(e) => setAddAccountName(e.target.value)}
                  placeholder="Account name"
                  className="bg-muted/40 border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>
              {addAccountError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle size={14} /> {addAccountError}
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isAddingAccount}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50"
                >
                  {isAddingAccount ? 'Saving…' : 'Save Account'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddAccount(false); setAddAccountError(null); }}
                  className="text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal request form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownToLine size={16} /> Request Withdrawal
          </CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/30 rounded-xl text-success">
              <CheckCircle2 size={18} />
              <p className="text-sm font-semibold">Withdrawal request submitted. We'll process it within 2–3 business days.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="withdrawal-amount" className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Amount (₦)</label>
                <input
                  id="withdrawal-amount"
                  type="number"
                  min={minPayout}
                  step="100"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder={`e.g. ${minPayout * 10}`}
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                />
                {balance && (
                  <p className="text-xs text-muted-foreground">Available: {formatNgn(balance.balance)}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="withdrawal-destination" className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Pay Out To</label>
                <select
                  id="withdrawal-destination"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                >
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bankName} · {acc.accountNumber.replace(/^(\d{3})\d+(\d{3})$/, '$1••••$2')}{acc.isDefault ? ' (Default)' : ''}
                    </option>
                  ))}
                  <option value={NEW_ACCOUNT_OPTION}>Enter new bank details…</option>
                </select>
              </div>

              {selectedAccountId === NEW_ACCOUNT_OPTION && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="withdrawal-bank" className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Bank</label>
                    <select
                      id="withdrawal-bank"
                      value={bankCode}
                      onChange={e => setBankCode(e.target.value)}
                      className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                    >
                      <option value="">Select your bank…</option>
                      {banks.map((bank) => (
                        <option key={bank.code} value={bank.code}>{bank.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="withdrawal-account-number" className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Account Number</label>
                    <input
                      id="withdrawal-account-number"
                      type="text"
                      maxLength={10}
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="0123456789"
                      className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm font-mono tracking-widest"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label htmlFor="withdrawal-account-name" className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Account Name</label>
                    <input
                      id="withdrawal-account-name"
                      type="text"
                      value={accountName}
                      onChange={e => setAccountName(e.target.value)}
                      placeholder="As on bank records"
                      className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                    />
                  </div>
                  {bankAccounts.length < MAX_BANK_ACCOUNTS && (
                    <label className="flex items-center gap-2 text-xs text-muted-foreground sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={saveNewAccount}
                        onChange={(e) => setSaveNewAccount(e.target.checked)}
                        className="rounded border-border"
                      />
                      Save this account for future withdrawals
                    </label>
                  )}
                </div>
              )}

              {formError && (
                <div role="alert" className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle size={14} /> {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : <ArrowDownToLine size={16} />}
                {isPending ? 'Submitting…' : 'Request Payout'}
              </button>
              <p className="text-xs text-muted-foreground">Minimum {formatNgn(minPayout)} · Processed within 2–3 business days</p>
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
            <div className="space-y-4">
              {withdrawals.map(w => {
                const cfg = statusConfig[w.status] ?? statusConfig.PENDING;
                const Icon = cfg.icon;
                return (
                  <div key={w.id} className="py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cfg.cls}`}>
                          <Icon size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{formatNgn(w.amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(w.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                    </div>
                    <WithdrawalTracker w={w} />
                    {w.status === 'REJECTED' && w.adminNotes && (
                      <p className="text-xs text-destructive mt-1.5">{w.adminNotes}</p>
                    )}
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

export default WithdrawalPanel;
