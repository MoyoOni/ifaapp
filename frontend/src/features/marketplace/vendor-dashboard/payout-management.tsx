import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import WithdrawalPanel, { formatNgn } from '@/features/wallet/withdrawal-panel';

interface WalletBalance {
  balance: number;
  pendingEscrow?: number;
  currency?: string;
}

interface PayoutManagementProps {
  activeTab: string;
}

// Saved accounts, the withdrawal form and history live in the shared
// WithdrawalPanel (also used by /wallet); this adds the vendor-specific
// header and balance cards around it.
const PayoutManagement: React.FC<PayoutManagementProps> = ({ activeTab }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: balance } = useQuery<WalletBalance>({
    queryKey: ['wallet-balance', user?.id],
    queryFn: async () => (await api.get(`/wallet/${user!.id}/balance`)).data,
    enabled: !!user?.id && activeTab === 'payouts',
  });

  if (activeTab !== 'payouts') return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Payout Management</h2>
          <p className="text-muted-foreground">Request withdrawals and track your payment history</p>
        </div>
        {/* VENDOR_BACKLOG.md VND-001 */}
        <button type="button" onClick={() => navigate('/vendor/earnings')} className="text-sm font-bold text-highlight hover:underline">
          View Earnings Report →
        </button>
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
            <p className="text-3xl font-bold text-foreground">{formatNgn(balance?.balance ?? 0)}</p>
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
            <p className="text-3xl font-bold text-foreground">{formatNgn(balance?.pendingEscrow ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Released when orders complete</p>
          </CardContent>
        </Card>
      </div>

      <WithdrawalPanel />
    </div>
  );
};

export default PayoutManagement;
