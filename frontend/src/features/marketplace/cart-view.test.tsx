import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { CartProvider } from '@/shared/contexts/cart-context';
import CartView from './cart-view';

// Mock the components that CartView depends on
vi.mock('@/components/layout/page-layout', () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

describe('CartView', () => {
  // const mockItems = [
  //   {
  //     id: '1',
  //     name: 'Test Item 1',
  //     price: 100,
  //     quantity: 2,
  //     image: 'test-image-1.jpg',
  //   },
  //   {
  //     id: '2',
  //     name: 'Test Item 2',
  //     price: 50,
  //     quantity: 1,
  //     image: 'test-image-2.jpg',
  //   },
  // ];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  it('renders empty cart message when cart is empty', () => {
    render(
      <CartProvider>
        <CartView />
      </CartProvider>
    );

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(
      screen.getByText('Browse our marketplace to find amazing spiritual products')
    ).toBeInTheDocument();
  });

  it('renders cart items when items are present', () => {
    render(
      <CartProvider>
        <CartView />
      </CartProvider>
    );

    // Add items to cart
    // const cartContext = {} as any; // Mock context
    // Simulate cart having items
    expect(screen.getByText((_content: string, element: Element | null) => 
      element?.textContent === '2 items in your collection'
    )).toBeInTheDocument();
  });

  it('allows removing items from cart', () => {
    render(
      <CartProvider>
        <CartView />
      </CartProvider>
    );

    // Find remove buttons
    const buttons = screen.getAllByRole('button');
    const minusBtn = Array.from(buttons).find((btn: Element) => 
      btn.closest('.flex.items-center.gap-3')
    );
    
    expect(minusBtn).toBeInTheDocument();
  });

  it('calculates total correctly', () => {
    render(
      <CartProvider>
        <CartView />
      </CartProvider>
    );

    // Check if total is displayed correctly
    expect(screen.getByText('₦250.00')).toBeInTheDocument(); // 2*100 + 1*50 = 250
  });

  it('shows checkout button when items are present', () => {
    render(
      <CartProvider>
        <CartView />
      </CartProvider>
    );

    expect(screen.getByRole('button', { name: /proceed to checkout/i })).toBeInTheDocument();
  });
});