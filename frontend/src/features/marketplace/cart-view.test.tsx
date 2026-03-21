import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import CartView from './cart-view';

vi.mock('@/shared/contexts/cart-context', () => ({
  CartProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useCart: vi.fn(),
}));

vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'user-1' } })),
}));

import { useCart } from '@/shared/contexts/cart-context';

const emptyCart = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
  currency: 'NGN',
  addItem: vi.fn(),
  removeItem: vi.fn(),
  updateQuantity: vi.fn(),
  clearCart: vi.fn(),
};

const cartWithItems = {
  items: [
    { productId: '1', name: 'Test Item 1', price: 100, quantity: 2, image: '' },
    { productId: '2', name: 'Test Item 2', price: 50, quantity: 1, image: '' },
  ],
  totalItems: 3,
  totalAmount: 250,
  currency: 'NGN',
  addItem: vi.fn(),
  removeItem: vi.fn(),
  updateQuantity: vi.fn(),
  clearCart: vi.fn(),
};

describe('CartView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty cart message when cart is empty', () => {
    vi.mocked(useCart).mockReturnValue(emptyCart);
    render(<CartView />);
    expect(screen.getByText('Your Basket is Empty')).toBeInTheDocument();
    expect(screen.getByText(/Discover sacred artifacts/)).toBeInTheDocument();
  });

  it('renders cart items when items are present', () => {
    vi.mocked(useCart).mockReturnValue(cartWithItems);
    render(<CartView />);
    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    expect(screen.getByText('Test Item 2')).toBeInTheDocument();
  });

  it('allows removing items from cart', () => {
    vi.mocked(useCart).mockReturnValue(cartWithItems);
    render(<CartView />);
    const removeButtons = screen.getAllByTitle('Remove item');
    expect(removeButtons.length).toBeGreaterThan(0);
  });

  it('calculates total correctly', () => {
    vi.mocked(useCart).mockReturnValue(cartWithItems);
    render(<CartView />);
    const totals = screen.getAllByText(/250/);
    expect(totals.length).toBeGreaterThan(0);
  });

  it('shows checkout button when items are present', () => {
    vi.mocked(useCart).mockReturnValue(cartWithItems);
    render(<CartView />);
    expect(screen.getByRole('button', { name: /checkout/i })).toBeInTheDocument();
  });
});
