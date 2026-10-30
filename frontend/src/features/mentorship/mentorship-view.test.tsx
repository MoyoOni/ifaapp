import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import MentorshipView from './mentorship-view';

const apiGet = vi.fn();
const apiPost = vi.fn();
vi.mock('@/lib/api', () => ({
  default: { get: (...a: unknown[]) => apiGet(...a), post: (...a: unknown[]) => apiPost(...a), patch: vi.fn() },
}));
let devoted = true;
vi.mock('@/features/subscription/use-subscription', () => ({ useSubscription: () => ({ isDevoted: devoted }) }));
vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'client-1', role: 'CLIENT' } }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/features/payments/payment-modal', () => ({
  default: ({ relatedId, purpose }: { relatedId: string; purpose: string }) => <div>Paying {purpose} {relatedId}</div>,
}));

const offering = {
  id: 'off-1', name: 'Two guidance readings', description: 'Two sessions', durationMinutes: 30, priceAmount: 20000, sessionCount: 2,
  babalawo: { id: 'baba-1', name: 'Awo Fálànà' },
};
const booking = (over: Record<string, unknown>) => ({
  id: 'bk-1', status: 'PAID', amount: 20000, sessionsTotal: 2, sessionsHeld: 1, sessionsConfirmed: 0,
  meetingLink: 'https://wa.me/2348012345678', meetingDetails: 'Saturday 10am',
  offering: { id: 'off-1', name: 'Two guidance readings', durationMinutes: 30 },
  client: { id: 'client-1', name: 'Kẹ́mi' }, babalawo: { id: 'baba-1', name: 'Awo Fálànà' }, ...over,
});

// SHOP_BACKLOG.md MSP-023
describe('MentorshipView', () => {
  beforeEach(() => {
    devoted = true;
    apiGet.mockImplementation((url: string) =>
      Promise.resolve({ data: url === '/mentorship/offerings' ? [offering] : [booking({})] })
    );
    apiPost.mockReset().mockResolvedValue({ data: { id: 'bk-new', amount: 20000 } });
  });

  it('books an offering and opens payment for that booking', async () => {
    render(<MentorshipView />);
    fireEvent.click(await screen.findByRole('button', { name: 'Book and Pay' }));
    await waitFor(() => expect(apiPost).toHaveBeenCalledWith('/mentorship/bookings', { offeringId: 'off-1' }));
    expect(await screen.findByText('Paying MENTORSHIP_SESSION bk-new')).toBeInTheDocument();
  });

  it('points a free member to Devoted instead of letting them book', async () => {
    devoted = false;
    render(<MentorshipView />);
    expect(await screen.findByRole('link', { name: 'See Devoted' })).toHaveAttribute('href', '/pricing');
    expect(await screen.findByRole('button', { name: 'Book and Pay' })).toBeDisabled();
  });

  it('shows the client where to meet and lets them confirm a held session', async () => {
    render(<MentorshipView />);
    fireEvent.click(screen.getByRole('tab', { name: 'My Bookings' }));
    expect(await screen.findByRole('link', { name: 'https://wa.me/2348012345678' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Session Took Place' }));
    await waitFor(() => expect(apiPost).toHaveBeenCalledWith('/mentorship/bookings/bk-1/sessions/confirm'));
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument(); // a session was held
  });
});
