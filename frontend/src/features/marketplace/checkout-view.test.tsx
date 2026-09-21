import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import api from '@/lib/api';
import CheckoutView from './checkout-view';

const mockCartItem = {
  productId: 'p1',
  name: 'Item',
  price: 100,
  quantity: 1,
  currency: 'NGN',
  vendorId: 'v1',
  vendorName: 'Vendor',
};

const mockCartState = {
  items: [mockCartItem],
  totalAmount: 100,
  clearCart: vi.fn(),
  currency: 'NGN' as const,
};

vi.mock('@/shared/contexts/cart-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/contexts/cart-context')>();
  return { ...actual, useCart: () => mockCartState };
});

vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'Test User' } }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/api', () => ({ default: { post: vi.fn().mockResolvedValue({ data: { id: 'order-1' } }) } }));

vi.mock('@/features/payments/payment-modal', () => ({ default: () => null }));

describe('CheckoutView', () => {
  const onBack = vi.fn();
  const onSuccess = vi.fn();

  beforeEach(() => {
    onBack.mockClear();
    onSuccess.mockClear();
  });

  it('renders without crashing', () => {
    const { container } = render(<CheckoutView onBack={onBack} onSuccess={onSuccess} />);
    expect(container).toBeTruthy();
  });

  it('with empty cart calls onBack and returns null', () => {
    const prevItems = mockCartState.items;
    mockCartState.items = [];
    const { container } = render(<CheckoutView onBack={onBack} onSuccess={onSuccess} />);
    expect(onBack).toHaveBeenCalled();
    expect(container.firstChild).toBeNull();
    mockCartState.items = prevItems;
  });

  it('with items renders Checkout header and shipping step', () => {
    render(<CheckoutView onBack={onBack} onSuccess={onSuccess} />);
    expect(screen.getByText('Checkout')).toBeInTheDocument();
    expect(screen.getByText('Shipping Address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Adewale Adebayo')).toBeInTheDocument();
  });

  it('can fill shipping and continue to payment step', () => {
    render(<CheckoutView onBack={onBack} onSuccess={onSuccess} />);
    fireEvent.change(screen.getByPlaceholderText('123 Ifa Street'), { target: { value: '123 Street' } });
    fireEvent.change(screen.getByPlaceholderText('Lagos'), { target: { value: 'Lagos' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue to Payment/i }));
    expect(screen.getByText('Payment Method')).toBeInTheDocument();
    expect(screen.getByText('Card Payment')).toBeInTheDocument();
  });

  it('can select bank transfer and see Pay button', () => {
    render(<CheckoutView onBack={onBack} onSuccess={onSuccess} />);
    fireEvent.change(screen.getByPlaceholderText('123 Ifa Street'), { target: { value: '123 Street' } });
    fireEvent.change(screen.getByPlaceholderText('Lagos'), { target: { value: 'Lagos' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue to Payment/i }));
    fireEvent.click(screen.getByText('Bank Transfer'));
    // VENDOR_BACKLOG.md VND-011: the Pay button now shows the real total
    // (₦100 subtotal + no shipping zones configured for this vendor in the
    // test + 7.5% VAT, matching backend's createOrder calculation) rather
    // than the bare subtotal it displayed before VAT was ever reflected here.
    expect(screen.getByRole('button', { name: /Pay ₦108/ })).toBeInTheDocument();
  });

  it('back button on checkout calls onBack', () => {
    render(<CheckoutView onBack={onBack} onSuccess={onSuccess} />);
    const backBtn = screen.getByRole('button', { name: /Go back/i });  // Changed to look for the correct label
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalled();
  });

  describe('when the order request fails in production (not dev mode)', () => {
    const goToPay = () => {
      render(<CheckoutView onBack={onBack} onSuccess={onSuccess} />);
      fireEvent.change(screen.getByPlaceholderText('123 Ifa Street'), { target: { value: '123 Street' } });
      fireEvent.change(screen.getByPlaceholderText('Lagos'), { target: { value: 'Lagos' } });
      fireEvent.click(screen.getByRole('button', { name: /Continue to Payment/i }));
      fireEvent.click(screen.getByRole('button', { name: /Pay ₦/ }));
    };

    beforeEach(() => {
      mockCartState.clearCart.mockClear();
      (api.post as ReturnType<typeof vi.fn>).mockReset();
    });

    it.each([
      // shaped like the real backend envelope: { success: false, error: { message, userMessage } }
      ['a 429 rate limit', { response: { status: 429, data: { success: false, error: { message: 'ThrottlerException', userMessage: 'Too many requests. Please slow down and try again.' } } } }, /Too many requests/],
      ['a 500', { response: { status: 500, data: {} } }, /server error occurred/i],
      ['a dropped connection', Object.assign(new Error('Network Error'), { request: {} }), /Unable to connect/],
    ])('shows the error and does NOT report success or clear the cart (%s)', async (_label, failure, message) => {
      (api.post as ReturnType<typeof vi.fn>).mockRejectedValue(failure);

      goToPay();

      // this used to fabricate a "DEMO-..." success: the customer was told the
      // order went through and the cart was emptied, but no order existed
      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(onSuccess).not.toHaveBeenCalled();
      expect(mockCartState.clearCart).not.toHaveBeenCalled();
    });

    it('still proceeds to payment when the order is really created', async () => {
      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: 'order-1' } });

      goToPay();

      await waitFor(() => expect(api.post).toHaveBeenCalledWith('/marketplace/orders', expect.objectContaining({ vendorId: 'v1' })));
      expect(screen.queryByText(/Payment Issue/)).not.toBeInTheDocument();
      expect(onSuccess).not.toHaveBeenCalled(); // success only comes after the payment modal completes
    });
  });
});
