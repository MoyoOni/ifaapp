import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import EventDetailView from './event-detail-view';

const apiGet = vi.fn();
const apiPost = vi.fn();
vi.mock('@/lib/api', () => ({
  default: { get: (...a: unknown[]) => apiGet(...a), post: (...a: unknown[]) => apiPost(...a) },
}));
vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'member-1', role: 'CLIENT' } }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const baseEvent = {
  id: 'evt-1',
  title: 'Ọdún Ifá Gathering',
  slug: 'odun-ifa-gathering',
  type: 'CEREMONY',
  startDate: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  timezone: 'Africa/Lagos',
  locationType: 'PHYSICAL',
  price: 0,
  currency: 'NGN',
  requiresRegistration: true,
  status: 'UPCOMING',
  published: true,
  createdAt: new Date().toISOString(),
  creator: { id: 'organizer-1', name: 'Organizer' },
  userRegistration: null,
  _count: { registrations: 0 },
};

const rejectWith = (status: number, message: string) =>
  Object.assign(new Error(`Request failed with status code ${status}`), { response: { status, data: { message } } });

describe('EventDetailView — registering', () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    sessionStorage.clear();
    apiGet.mockResolvedValue({ data: baseEvent });
  });

  // This used to catch every failure, fabricate a registration in
  // sessionStorage and toast "Successfully registered" -- the member believed
  // they had a place the organizer never saw.
  it('tells the member when registering fails instead of pretending it worked', async () => {
    apiPost.mockRejectedValue(rejectWith(400, 'Event is at full capacity'));
    render(<EventDetailView eventSlug="odun-ifa-gathering" />);

    fireEvent.click(await screen.findByRole('button', { name: /Register for Event/i }));

    expect(await screen.findByText('Event is at full capacity')).toBeInTheDocument();
    expect(screen.queryByText(/Successfully registered/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cancel Registration/i })).not.toBeInTheDocument();
    expect(sessionStorage.getItem('demo-event-registration:evt-1')).toBeNull();
  });

  it('confirms a registration the server accepted', async () => {
    apiPost.mockResolvedValue({ data: { id: 'reg-1' } });
    render(<EventDetailView eventSlug="odun-ifa-gathering" />);

    fireEvent.click(await screen.findByRole('button', { name: /Register for Event/i }));

    await waitFor(() => expect(apiPost).toHaveBeenCalledWith('/events/evt-1/register'));
    expect(await screen.findByText(/Successfully registered/i)).toBeInTheDocument();
  });

  it('shows the registration the server reports', async () => {
    apiGet.mockResolvedValue({
      data: { ...baseEvent, userRegistration: { id: 'reg-1', status: 'REGISTERED', registeredAt: new Date().toISOString() } },
    });
    render(<EventDetailView eventSlug="odun-ifa-gathering" />);

    expect(await screen.findByRole('button', { name: /Cancel Registration/i })).toBeInTheDocument();
  });
});
