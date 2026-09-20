import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import AnnouncementBanner from './announcement-banner';

const apiGet = vi.fn();
vi.mock('@/lib/api', () => ({ default: { get: (...args: unknown[]) => apiGet(...args) } }));

const useAuthMock = vi.fn();
vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => useAuthMock(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('AnnouncementBanner', () => {
  beforeEach(() => {
    apiGet.mockReset();
    useAuthMock.mockReset();
  });

  it('does not call the auth-only announcements endpoint for anonymous visitors', async () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false });

    render(<AnnouncementBanner />);

    await new Promise((r) => setTimeout(r, 50));
    expect(apiGet).not.toHaveBeenCalled();
  });

  it('fetches and shows announcements for a logged-in user', async () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true });
    apiGet.mockResolvedValue({
      data: [{ id: 'a1', title: 'Maintenance', message: 'Tonight at 10pm', type: 'info' }],
    });

    render(<AnnouncementBanner />);

    await waitFor(() => expect(screen.getByText(/Tonight at 10pm/)).toBeInTheDocument());
    expect(apiGet).toHaveBeenCalledWith('/admin/announcements/active');
  });
});
