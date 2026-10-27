import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import WithdrawalPanel from './withdrawal-panel';
import WalletDashboardView from './wallet-dashboard-view';

const apiGet = vi.fn();
const apiPost = vi.fn();
vi.mock('@/lib/api', () => ({
  default: {
    get: (...a: unknown[]) => apiGet(...a),
    post: (...a: unknown[]) => apiPost(...a),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'u1', role: 'CLIENT' } }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const savedAccount = {
  id: 'acc-1',
  bankName: 'Zenith Bank',
  bankCode: '057',
  accountNumber: '0123456789',
  accountName: 'Adéwálé Ọlátúnjí',
  isDefault: true,
};

const routes: Record<string, unknown> = {
  '/wallet/u1/balance': { balance: 50000, currency: 'NGN' },
  '/payments/banks': [{ name: 'Zenith Bank', code: '057' }],
  '/wallet/payout-settings': { minPayoutThresholdNgn: 5000 },
  '/wallet/u1/bank-accounts': [savedAccount],
  '/wallet/u1/withdrawals': [],
  '/wallet/u1/transactions': { transactions: [] },
};

describe('WithdrawalPanel', () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    apiGet.mockImplementation(async (url: string) => ({ data: routes[url] ?? [] }));
  });

  it('files a real withdrawal request against the saved default account', async () => {
    apiPost.mockResolvedValue({ data: { id: 'w-1' } });
    render(<WithdrawalPanel />);

    await screen.findByText('Zenith Bank', { selector: 'p' });
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '10000' } });
    fireEvent.click(screen.getByRole('button', { name: /Request Payout/i }));

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith('/wallet/u1/withdraw', { amount: 10000, bankAccountId: 'acc-1' })
    );
    expect(await screen.findByText(/Withdrawal request submitted/i)).toBeInTheDocument();
  });

  it('shows the server error instead of a confirmation when the request fails', async () => {
    apiPost.mockRejectedValue({ response: { status: 400, data: { message: 'Wallet is locked. Please contact support.' } } });
    render(<WithdrawalPanel />);

    await screen.findByText('Zenith Bank', { selector: 'p' });
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '10000' } });
    fireEvent.click(screen.getByRole('button', { name: /Request Payout/i }));

    expect(await screen.findByText('Wallet is locked. Please contact support.')).toBeInTheDocument();
    expect(screen.queryByText(/Withdrawal request submitted/i)).not.toBeInTheDocument();
  });

  it('refuses more than the available balance without calling the server', async () => {
    render(<WithdrawalPanel />);

    await screen.findByText('Zenith Bank', { selector: 'p' });
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '90000' } });
    fireEvent.click(screen.getByRole('button', { name: /Request Payout/i }));

    expect(await screen.findByText('Amount exceeds available balance')).toBeInTheDocument();
    expect(apiPost).not.toHaveBeenCalled();
  });
});

describe('WalletDashboardView — Withdraw', () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    apiGet.mockImplementation(async (url: string) => ({ data: routes[url] ?? [] }));
  });

  // The modal used to list hardcoded fake accounts ("GTBank - *9920") and
  // toast "(Simulated)" without calling anything.
  it("opens the real withdrawal flow with the member's own saved accounts", async () => {
    render(<WalletDashboardView />);

    fireEvent.click(await screen.findByRole('button', { name: /^Withdraw$/i }));

    expect(await screen.findByRole('dialog', { name: /Withdraw Funds/i })).toBeInTheDocument();
    expect(await screen.findByText('Zenith Bank', { selector: 'p' })).toBeInTheDocument();
    expect(screen.queryByText(/GTBank - \*9920/)).not.toBeInTheDocument();
    expect(apiGet).toHaveBeenCalledWith('/wallet/u1/bank-accounts');
  });
});
