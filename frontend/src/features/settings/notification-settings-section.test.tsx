import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import { NotificationSettingsSection } from './notification-settings-section';

const apiGet = vi.fn();
const apiPatch = vi.fn();
const apiPost = vi.fn();
vi.mock('@/lib/api', () => ({
  default: { get: (...a: unknown[]) => apiGet(...a), patch: (...a: unknown[]) => apiPatch(...a), post: (...a: unknown[]) => apiPost(...a) },
}));

// Settings' notification toggles used to be saved nowhere (November 2, 2026).
describe('NotificationSettingsSection', () => {
  beforeEach(() => {
    apiGet.mockResolvedValue({ data: { emailOrder: true, pushOrder: true, pushForum: false, emailPlan: true, emailMarketing: false } });
    apiPatch.mockReset().mockResolvedValue({ data: {} });
    apiPost.mockReset().mockResolvedValue({ data: {} });
  });

  it('shows the saved preferences and saves a change to the real preferences API', async () => {
    render(<NotificationSettingsSection forumDigestOptIn={false} userId="u-1" />);
    const marketing = await screen.findByRole('checkbox', { name: /News and announcements/ });
    await waitFor(() => expect(screen.getByRole('checkbox', { name: /Order updates by email/ })).toBeChecked());
    expect(marketing).not.toBeChecked();
    fireEvent.click(marketing);
    await waitFor(() => expect(apiPatch).toHaveBeenCalledWith('/notifications/preferences', { emailMarketing: true }));
  });

  it('saves the weekly forum digest to the account opt-in', async () => {
    render(<NotificationSettingsSection forumDigestOptIn={false} userId="u-1" />);
    fireEvent.click(await screen.findByRole('checkbox', { name: /Weekly forum digest/ }));
    await waitFor(() => expect(apiPost).toHaveBeenCalledWith('/gdpr/consent-preferences', { forumDigest: true }));
  });

  it('no longer offers SMS, which the platform never sends', async () => {
    render(<NotificationSettingsSection forumDigestOptIn={false} userId="u-1" />);
    await screen.findByRole('checkbox', { name: /News and announcements/ });
    expect(screen.queryByText(/SMS/)).not.toBeInTheDocument();
  });
});
