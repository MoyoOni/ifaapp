import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import MyOrdersView from './my-orders-view';
import VendorOrderDetailPanel from './vendor-order-detail-panel';

const apiGet = vi.fn();
const apiPatch = vi.fn();
vi.mock('@/lib/api', () => ({
  default: { get: (...a: unknown[]) => apiGet(...a), post: vi.fn(), patch: (...a: unknown[]) => apiPatch(...a) },
}));
let role = 'CLIENT';
vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'u-1', role } }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const shippedOrder = {
  id: 'order-1abcdef', status: 'SHIPPED', totalAmount: 10000, createdAt: '2026-10-30T10:00:00Z',
  vendor: { businessName: 'Ọjà Ṣọlá' }, items: [{ product: { name: 'Ìbò' }, quantity: 1, price: 10000 }],
  shippingAddress: 'Lagos', trackingNumber: 'NIPOST123',
};

// Escrow policy (October 31, 2026): only the customer confirms delivery,
// which pays the vendor the rest of the escrow.
describe('confirming delivery', () => {
  beforeEach(() => {
    apiGet.mockImplementation((url: string) =>
      Promise.resolve({ data: url === '/marketplace/returns/my' ? [] : url === '/marketplace/orders' ? [shippedOrder] : shippedOrder })
    );
    apiPatch.mockReset().mockResolvedValue({ data: {} });
  });

  it('lets the customer confirm a shipped order was received', async () => {
    role = 'CLIENT';
    render(<MyOrdersView />);
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm Received' }));
    await waitFor(() => expect(apiPatch).toHaveBeenCalledWith('/marketplace/orders/order-1abcdef', { status: 'DELIVERED' }));
  });

  it('does not offer the vendor a "Mark as Delivered" button', async () => {
    role = 'VENDOR';
    render(<VendorOrderDetailPanel orderId="order-1abcdef" onClose={() => {}} />);
    expect(await screen.findByText(/Waiting for the customer to confirm delivery/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Mark as Delivered/ })).not.toBeInTheDocument();
  });

  it('still lets an admin mark it delivered', async () => {
    role = 'ADMIN';
    render(<VendorOrderDetailPanel orderId="order-1abcdef" onClose={() => {}} />);
    expect(await screen.findByRole('button', { name: /Mark as Delivered/ })).toBeInTheDocument();
  });
});
