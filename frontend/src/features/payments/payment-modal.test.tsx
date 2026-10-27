import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import PaymentModal from './payment-modal';

const apiPost = vi.fn();
const apiGet = vi.fn();
vi.mock('@/lib/api', () => ({ default: { post: (...a: unknown[]) => apiPost(...a), get: (...a: unknown[]) => apiGet(...a) } }));
vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'u1', role: 'CLIENT' } }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const renderModal = (onError = vi.fn()) =>
  render(
    <PaymentModal isOpen onClose={vi.fn()} amount={5375} currency={'NGN' as any} purpose={'MARKETPLACE_ORDER' as any} relatedId="order-1" onError={onError} />
  );

describe('PaymentModal — when the gateway call fails', () => {
  beforeEach(() => {
    apiPost.mockReset();
    apiGet.mockReset();
    apiGet.mockResolvedValue({ data: null });
  });

  it("shows the customer a friendly message from the backend's real error envelope, not axios's raw text", async () => {
    // exactly what the backend returned in local testing with no valid Paystack key
    apiPost.mockRejectedValue(
      Object.assign(new Error('Request failed with status code 500'), {
        response: { status: 500, data: { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to initialize payment', userMessage: 'Something went wrong. Please try again.' } } },
      })
    );
    const onError = vi.fn();
    renderModal(onError);

    fireEvent.click(await screen.findByRole('button', { name: /Pay Now/i }));

    await waitFor(() => expect(onError).toHaveBeenCalled());
    const shown = onError.mock.calls[0][0] as string;
    expect(shown).toBe('Something went wrong. Please try again.');
    expect(shown).not.toMatch(/status code/i); // this used to reach the customer verbatim
  });
});

describe('PaymentModal — the "Complete in demo mode" escape hatch', () => {
  const failGateway = () =>
    apiPost.mockRejectedValue(
      Object.assign(new Error('Request failed with status code 500'), {
        response: { status: 500, data: { success: false, error: { userMessage: 'Something went wrong. Please try again.' } } },
      })
    );

  beforeEach(() => {
    apiPost.mockReset();
    apiGet.mockReset();
    apiGet.mockResolvedValue({ data: null });
    localStorage.removeItem('dev_mode_role');
  });

  // It used to render for real customers too: clicking it after a failed
  // payment cleared the cart and showed a successful checkout for an unpaid order.
  it('is not offered to real customers after a failed payment', async () => {
    failGateway();
    renderModal();
    fireEvent.click(await screen.findByRole('button', { name: /Pay Now/i }));

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Complete in demo mode/i })).not.toBeInTheDocument();
  });

  it('is still offered in dev/QA demo mode', async () => {
    localStorage.setItem('dev_mode_role', 'client');
    failGateway();
    renderModal();
    fireEvent.click(await screen.findByRole('button', { name: /Pay Now/i }));

    expect(await screen.findByRole('button', { name: /Complete in demo mode/i })).toBeInTheDocument();
  });
});
