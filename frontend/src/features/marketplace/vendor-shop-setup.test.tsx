import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import VendorDashboardView from './vendor-dashboard-view';

const apiGet = vi.fn();
const apiPost = vi.fn();
vi.mock('@/lib/api', () => ({
  default: { get: (...a: unknown[]) => apiGet(...a), post: (...a: unknown[]) => apiPost(...a), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'vendor-user-1', role: 'VENDOR' } }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/shared/hooks/use-new-order-notifications', () => ({ useNewOrderNotifications: () => {} }));

const notFound = { response: { status: 404, data: { success: false, error: { userMessage: 'The requested item was not found.' } } } };

// A VENDOR account with no shop profile used to see an empty, working-looking
// dashboard ("No products listed yet") with no way to create the shop.
describe('Vendor dashboard without a shop', () => {
  let hasShop: boolean;

  beforeEach(() => {
    hasShop = false;
    apiGet.mockReset();
    apiPost.mockReset();
    apiGet.mockImplementation(async (url: string) => {
      if (url === '/marketplace/vendors/me') {
        if (!hasShop) throw notFound;
        return { data: { id: 'vendor-1', businessName: 'Ẹkùn Ifá Sacred Supplies', status: 'PENDING' } };
      }
      return { data: [] };
    });
  });

  it('offers to set up the shop instead of an empty dashboard', async () => {
    render(<VendorDashboardView />);

    expect(await screen.findByRole('heading', { name: 'Set up your shop' })).toBeInTheDocument();
    expect(screen.queryByText('Vendor Dashboard')).not.toBeInTheDocument();
  });

  it('creates the shop and then shows the dashboard', async () => {
    apiPost.mockImplementation(async () => {
      hasShop = true;
      return { data: { id: 'vendor-1' } };
    });
    render(<VendorDashboardView />);

    fireEvent.change(await screen.findByLabelText(/Business \/ Shop Name/i), { target: { value: 'Ẹkùn Ifá Sacred Supplies' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Create my shop/i }));

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith('/marketplace/vendors', {
        businessName: 'Ẹkùn Ifá Sacred Supplies',
        description: undefined,
        noCounterfeitSpiritualItems: true,
      })
    );
    expect(await screen.findByText('Vendor Dashboard')).toBeInTheDocument();
  });

  it('shows why when the shop cannot be created', async () => {
    apiPost.mockRejectedValue({ response: { status: 400, data: { success: false, error: { userMessage: 'Business name is required' } } } });
    render(<VendorDashboardView />);

    fireEvent.change(await screen.findByLabelText(/Business \/ Shop Name/i), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: /Create my shop/i }));

    expect(await screen.findByText('Business name is required')).toBeInTheDocument();
  });
});
