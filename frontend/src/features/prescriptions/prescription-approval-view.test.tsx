import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import GuidancePlanApprovalView from './prescription-approval-view';

const apiGet = vi.fn();
const apiPost = vi.fn();
vi.mock('@/lib/api', () => ({
  default: { get: (...a: unknown[]) => apiGet(...a), post: (...a: unknown[]) => apiPost(...a), patch: vi.fn() },
}));
vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'client-1', role: 'CLIENT' } }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const pendingPlan = {
  id: 'plan-1',
  type: 'EBO',
  items: [{ name: 'Obì abàtà', quantity: 4, cost: 2000 }],
  totalCost: 8000,
  platformServiceFee: 400,
  currency: 'NGN',
  status: 'PENDING',
  appointment: { id: 'appt-1', date: new Date().toISOString(), time: '10:00' },
  babalawo: { id: 'baba-1', name: 'Babaláwo Ifáwùmí' },
  createdAt: new Date().toISOString(),
};

describe('GuidancePlanApprovalView — approving', () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    apiGet.mockResolvedValue({ data: pendingPlan });
  });

  // Approving moves money into escrow. Every failure used to be swallowed and
  // the plan shown as APPROVED anyway, with onApproved fired.
  it('surfaces a failed approval instead of showing the plan as approved', async () => {
    apiPost.mockRejectedValue(
      Object.assign(new Error('Request failed with status code 400'), {
        response: { status: 400, data: { success: false, error: { userMessage: 'Insufficient wallet balance' } } },
      })
    );
    const onApproved = vi.fn();
    render(<GuidancePlanApprovalView guidancePlanId="plan-1" onApproved={onApproved} />);

    fireEvent.click(await screen.findByRole('button', { name: /Approve & Pay/i }));

    expect(await screen.findByText('Insufficient wallet balance')).toBeInTheDocument();
    expect(onApproved).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Approve & Pay/i })).toBeInTheDocument(); // still pending
  });

  it('reports a real approval', async () => {
    apiPost.mockResolvedValue({ data: { ...pendingPlan, status: 'APPROVED' } });
    const onApproved = vi.fn();
    render(<GuidancePlanApprovalView guidancePlanId="plan-1" onApproved={onApproved} />);

    fireEvent.click(await screen.findByRole('button', { name: /Approve & Pay/i }));

    await waitFor(() => expect(onApproved).toHaveBeenCalled());
  });
});
