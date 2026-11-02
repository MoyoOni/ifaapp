import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import PricingPage from './PricingPage';

const apiPost = vi.fn();
vi.mock('@/lib/api', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: { devotedCount: 0, totalUsers: 0 } }), post: (...a: unknown[]) => apiPost(...a) },
}));
vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'u-1', role: 'CLIENT' } }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('PricingPage Devoted checkout', () => {
  it('tells the member why checkout failed instead of failing silently', async () => {
    const message = 'Payments are not switched on yet. Please check back soon.';
    apiPost.mockRejectedValue({ response: { status: 503, data: { success: false, error: { message, userMessage: message } } } });
    render(<PricingPage />);
    fireEvent.click(screen.getByRole('button', { name: /Start Your Journey/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
  });
});
