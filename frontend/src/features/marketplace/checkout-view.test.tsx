import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
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
    expect(screen.getByRole('button', { name: /Pay ₦100/ })).toBeInTheDocument();
  });

  it('back button on checkout calls onBack', () => {
    render(<CheckoutView onBack={onBack} onSuccess={onSuccess} />);
    const backBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalled();
  });
});
