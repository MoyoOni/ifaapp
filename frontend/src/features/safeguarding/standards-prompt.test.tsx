import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import { StandardsPrompt } from './standards-prompt';

const apiGet = vi.fn();
const apiPost = vi.fn();
vi.mock('@/lib/api', () => ({ default: { get: (...a: unknown[]) => apiGet(...a), post: (...a: unknown[]) => apiPost(...a) } }));
let role = 'BABALAWO';
vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'u-1', role }, isAuthenticated: true }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const standards = { version: 'v1', title: 'Ìlú Àṣẹ Practitioner and Vendor Standards', intro: 'Intro', commitments: ['I will respect a member’s right to say no.'], closing: 'Closing' };

// docs/safeguarding SAFE-12
describe('StandardsPrompt', () => {
  beforeEach(() => {
    apiPost.mockReset().mockResolvedValue({ data: {} });
    apiGet.mockReset().mockImplementation((url: string) =>
      Promise.resolve({ data: url.endsWith('/me') ? { version: 'v1', required: true, accepted: false } : standards })
    );
  });

  it('asks a practitioner to accept the current standards, and records the version they read', async () => {
    role = 'BABALAWO';
    render(<StandardsPrompt />);
    expect(await screen.findByText('Ìlú Àṣẹ Practitioner and Vendor Standards')).toBeInTheDocument();
    const accept = screen.getByRole('button', { name: 'I Accept' });
    expect(accept).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(accept);
    await waitFor(() => expect(apiPost).toHaveBeenCalledWith('/safeguarding/standards/accept', { version: 'v1' }));
  });

  it('does not ask members who offer no services', async () => {
    role = 'CLIENT';
    render(<StandardsPrompt />);
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText('Ìlú Àṣẹ Practitioner and Vendor Standards')).not.toBeInTheDocument();
    expect(apiGet).not.toHaveBeenCalled();
  });
});
