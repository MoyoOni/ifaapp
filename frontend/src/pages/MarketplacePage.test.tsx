import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../test/test-utils';
import MarketplacePage from './MarketplacePage';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => ({
    ...(await vi.importActual<typeof import('react-router-dom')>('react-router-dom')),
    useNavigate: () => navigate,
}));

// stand-in for the real grid: exposes the page's onSelectProduct callback
vi.mock('@/features/marketplace/marketplace-view', () => ({
    default: ({ onSelectProduct }: { onSelectProduct: (id: string) => void }) => (
        <div>
            <button onClick={() => onSelectProduct('prod-123')}>open product</button>
            <button onClick={() => onSelectProduct('cart')}>open cart</button>
            <button onClick={() => onSelectProduct('my-orders')}>open orders</button>
        </div>
    ),
}));

describe('MarketplacePage', () => {
    beforeEach(() => navigate.mockReset());

    it('renders marketplace page without crashing', () => {
        const { container } = render(<MarketplacePage />);
        expect(container.firstChild).toBeTruthy();
    });

    it('opens a product at the route App.tsx actually defines (/marketplace/:productId)', () => {
        render(<MarketplacePage />);
        fireEvent.click(screen.getByText('open product'));
        // this used to navigate to /product/:id -- no such route exists, so every
        // product card led to the 404 page
        expect(navigate).toHaveBeenCalledWith('/marketplace/prod-123');
        expect(navigate).not.toHaveBeenCalledWith(expect.stringMatching(/^\/product\//));
    });

    it('still routes the cart and orders shortcuts', () => {
        render(<MarketplacePage />);
        fireEvent.click(screen.getByText('open cart'));
        fireEvent.click(screen.getByText('open orders'));
        expect(navigate).toHaveBeenNthCalledWith(1, '/cart');
        expect(navigate).toHaveBeenNthCalledWith(2, '/my-orders');
    });
});
