import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@/test/test-utils';
import ProposeRitualPanel from './propose-ritual-panel';

const apiGet = vi.fn();
vi.mock('@/lib/api', () => ({ default: { get: (...a: unknown[]) => apiGet(...a), post: vi.fn() } }));

const useAuthMock = vi.fn();
vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => useAuthMock(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('ProposeRitualPanel', () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiGet.mockResolvedValue({ data: [] });
    useAuthMock.mockReset();
  });

  it('does not fetch the per-user proposals list for a logged-out visitor', async () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false });
    render(<ProposeRitualPanel />);
    await new Promise((r) => setTimeout(r, 50));
    expect(apiGet).not.toHaveBeenCalled();
  });

  it('fetches the user\'s own proposals when logged in', async () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true });
    render(<ProposeRitualPanel />);
    await waitFor(() => expect(apiGet).toHaveBeenCalledWith('/cultural/ritual-proposals/mine'));
  });
});
