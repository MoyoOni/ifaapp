import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@/test/test-utils';
import NotificationCenter from './notification-center';

const apiGet = vi.fn();
vi.mock('@/lib/api', () => ({
  default: { get: (...a: unknown[]) => apiGet(...a), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'u1', role: 'CLIENT' } }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// The tab badges' endpoint used to 404, so they never showed; once it worked,
// `{count && count > 0 && ...}` rendered a literal "0" for empty tabs.
describe('NotificationCenter tab badges', () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiGet.mockImplementation(async (url: string) => {
      if (url === '/notifications/unread-count') return { data: { count: 3 } };
      if (url === '/notifications/count-by-type') return { data: { unread: 3, messages: 0, appointments: 0, orders: 2, community: 1 } };
      return { data: [] };
    });
  });

  it('shows real counts and nothing for empty tabs', async () => {
    render(<NotificationCenter />);

    const orders = await screen.findByRole('button', { name: /Orders/ });
    expect(await within(orders).findByText('2')).toBeInTheDocument();
    expect(within(screen.getByRole('button', { name: /Community/ })).getByText('1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Messages/ }).textContent).toBe('Messages');
    expect(screen.getByRole('button', { name: /Appointments/ }).textContent).toBe('Appointments');
  });
});
