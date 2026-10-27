import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import EventAttendeesPanel from './event-attendees-panel';

const apiGet = vi.fn();
const apiPatch = vi.fn();
vi.mock('@/lib/api', () => ({
  default: { get: (...a: unknown[]) => apiGet(...a), patch: (...a: unknown[]) => apiPatch(...a) },
}));
vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'organizer-1', role: 'BABALAWO' } }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const attendee = (userId: string, name: string, status = 'REGISTERED') => ({
  id: `reg-${userId}`,
  userId,
  status,
  registeredAt: new Date().toISOString(),
  attendedAt: status === 'ATTENDED' ? new Date().toISOString() : null,
  user: { id: userId, name },
});

const past = new Date(Date.now() - 3_600_000).toISOString();
const future = new Date(Date.now() + 86_400_000).toISOString();

describe('EventAttendeesPanel (V8-305)', () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPatch.mockReset();
    apiGet.mockResolvedValue({
      data: {
        totalAttendees: 3,
        attendees: [
          attendee('member-1', 'Adéwálé'),
          attendee('member-2', 'Fúnmiláyọ̀', 'ATTENDED'),
          attendee('organizer-1', 'Organizer'),
        ],
      },
    });
  });

  it('records attendance for a member once the event has started', async () => {
    apiPatch.mockResolvedValue({ data: {} });
    render(<EventAttendeesPanel eventId="evt-1" startDate={past} currentUserId="organizer-1" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Mark Adéwálé as attended' }));

    await waitFor(() =>
      expect(apiPatch).toHaveBeenCalledWith('/events/evt-1/attendees/member-1/attendance', { attended: true })
    );
    expect(screen.getByText('1 of 3 marked attended')).toBeInTheDocument();
  });

  it('lets the organizer undo a mark', async () => {
    apiPatch.mockResolvedValue({ data: {} });
    render(<EventAttendeesPanel eventId="evt-1" startDate={past} currentUserId="organizer-1" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Unmark Fúnmiláyọ̀ as attended' }));

    await waitFor(() =>
      expect(apiPatch).toHaveBeenCalledWith('/events/evt-1/attendees/member-2/attendance', { attended: false })
    );
  });

  it('offers no button for the organizer themselves', async () => {
    render(<EventAttendeesPanel eventId="evt-1" startDate={past} currentUserId="organizer-1" />);
    await screen.findByText('Organizer');
    expect(screen.queryByRole('button', { name: /Organizer as attended/ })).not.toBeInTheDocument();
  });

  it('waits until the event has started', async () => {
    render(<EventAttendeesPanel eventId="evt-1" startDate={future} currentUserId="organizer-1" />);
    expect(await screen.findByText(/once the event has started/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /as attended/ })).not.toBeInTheDocument();
  });

  it('shows the server error when recording fails', async () => {
    apiPatch.mockRejectedValue({ response: { status: 403, data: { success: false, error: { userMessage: 'Only the event organizer can record attendance' } } } });
    render(<EventAttendeesPanel eventId="evt-1" startDate={past} currentUserId="organizer-1" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Mark Adéwálé as attended' }));

    expect(await screen.findByText('Only the event organizer can record attendance')).toBeInTheDocument();
  });
});
