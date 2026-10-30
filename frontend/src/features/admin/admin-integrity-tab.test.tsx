import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminIntegrityTab } from './admin-integrity-tab';

const apiGet = vi.fn();
const apiPost = vi.fn();
vi.mock('@/lib/api', () => ({
  default: { get: (...a: unknown[]) => apiGet(...a), post: (...a: unknown[]) => apiPost(...a), patch: vi.fn(), delete: vi.fn() },
}));

const flaggedPost = {
  source: 'circle', id: 'c1', content: 'Selling àkóṣe, message me', createdAt: '2026-10-30T10:00:00Z',
  flagMatch: 'Keyword "selling akose": Akose comes through a prescription',
  author: { id: 'a', name: 'Adé' }, where: { id: 'circ', title: 'Grief & Healing' },
};

const renderTab = () =>
  render(<QueryClientProvider client={new QueryClient()}><AdminIntegrityTab /></QueryClientProvider>);

// FOR-001: posts that match a flag rule stay live and wait here for an admin.
describe('AdminIntegrityTab — Matched a Rule', () => {
  beforeEach(() => {
    apiGet.mockReset().mockImplementation((url: string) =>
      Promise.resolve({ data: url === '/admin/integrity/flagged' ? { items: [flaggedPost], total: 1 } : { items: [], total: 0, page: 1, pages: 0 } })
    );
    apiPost.mockReset().mockResolvedValue({ data: {} });
  });

  it('shows the count on its tab, and the rule each post matched', async () => {
    renderTab();
    const tab = await screen.findByRole('button', { name: /Matched a Rule\s*1/ });
    fireEvent.click(tab);
    expect(await screen.findByText(/Matched: Keyword "selling akose"/)).toBeInTheDocument();
    expect(screen.getByText('in: Grief & Healing')).toBeInTheDocument();
  });

  it('hides a post, or clears a false match', async () => {
    renderTab();
    fireEvent.click(await screen.findByRole('button', { name: /Matched a Rule/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Hide Post' }));
    await waitFor(() => expect(apiPost).toHaveBeenCalledWith('/admin/integrity/flagged/circle/c1/hide'));
    fireEvent.click(screen.getByRole('button', { name: 'Looks Fine' }));
    await waitFor(() => expect(apiPost).toHaveBeenCalledWith('/admin/integrity/flagged/circle/c1/clear'));
  });
});
