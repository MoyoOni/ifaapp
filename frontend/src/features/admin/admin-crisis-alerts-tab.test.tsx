import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminCrisisAlertsTab from './admin-crisis-alerts-tab';

const apiGet = vi.fn();
const apiPatch = vi.fn();
vi.mock('@/lib/api', () => ({ default: { get: (...a: unknown[]) => apiGet(...a), patch: (...a: unknown[]) => apiPatch(...a) } }));
vi.mock('@/shared/components/toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));
vi.mock('@/shared/hooks/use-auth', () => ({ useAuth: () => ({ user: { id: 'me' } }) }));

const post = (followUp: unknown) => ({
  id: 'p1', content: "I can't go on", createdAt: '2026-10-29T10:00:00Z', source: 'forum',
  author: { id: 'a', name: 'Kẹ́mi', email: 'k@example.com', role: 'CLIENT' },
  thread: { id: 't1', title: 'Heavy season', categoryId: 'c' },
  followUp,
});

const renderTab = () =>
  render(<QueryClientProvider client={new QueryClient()}><AdminCrisisAlertsTab /></QueryClientProvider>);

// Z1-803: a flag used to only notify admins -- no claim, no record of what was done.
describe('AdminCrisisAlertsTab', () => {
  beforeEach(() => { apiGet.mockReset(); apiPatch.mockReset().mockResolvedValue({ data: {} }); });

  it('shows who is following a flag up, and offers no second claim', async () => {
    apiGet.mockResolvedValue({ data: { posts: [post({ status: 'CLAIMED', claimedBy: { id: 'other', name: 'Bọ́lá' } })], total: 1 } });
    renderTab();
    expect(await screen.findByText(/Bọ́lá is following this up/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: "I'll Follow Up" })).not.toBeInTheDocument();
  });

  it('lets an admin claim an unclaimed flag', async () => {
    apiGet.mockResolvedValue({ data: { posts: [post(null)], total: 1 } });
    renderTab();
    fireEvent.click(await screen.findByRole('button', { name: "I'll Follow Up" }));
    await waitFor(() => expect(apiPatch).toHaveBeenCalledWith('/forum/admin/crisis-signals/p1/claim?source=forum'));
  });

  it('needs an outcome before closing, and sends it with the note', async () => {
    apiGet.mockResolvedValue({ data: { posts: [post({ status: 'CLAIMED', claimedBy: { id: 'me', name: 'Me' } })], total: 1 } });
    renderTab();
    expect(await screen.findByText(/You are following this up/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Record Outcome' }));
    const close = screen.getByRole('button', { name: 'Close Flag' });
    expect(close).toBeDisabled();
    fireEvent.click(screen.getByLabelText('Referred to support services'));
    fireEvent.change(screen.getByLabelText(/Note for other admins/), { target: { value: 'Shared hotline details' } });
    fireEvent.click(close);
    await waitFor(() =>
      expect(apiPatch).toHaveBeenCalledWith('/forum/admin/crisis-signals/p1/resolve?source=forum', { outcome: 'REFERRED', note: 'Shared hotline details' })
    );
  });
});
