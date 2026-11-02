import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import { MySharedStories } from './my-shared-stories';
import { StoryLicenceConsent } from './story-licence-consent';

const apiGet = vi.fn();
const apiPost = vi.fn();
vi.mock('@/lib/api', () => ({ default: { get: (...a: unknown[]) => apiGet(...a), post: (...a: unknown[]) => apiPost(...a) } }));

// COMMUNITY_BACKLOG.md FOR-024
describe('story licence', () => {
  beforeEach(() => {
    apiPost.mockReset().mockResolvedValue({ data: {} });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('shows the licence wording from the server beside the consent box', async () => {
    apiGet.mockResolvedValue({ data: { version: '2026-11-02', text: 'You keep the rights to your story.' } });
    const onChange = vi.fn();
    render(<StoryLicenceConsent checked={false} onChange={onChange} />);
    expect(await screen.findByText(/You keep the rights to your story\./)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('lets a member withdraw a story they shared', async () => {
    apiGet.mockResolvedValue({ data: [{ id: 'o1', title: 'Ìtàn Ọ̀ṣun', publishedAt: '2026-11-01T00:00:00Z', createdAt: '2026-10-30T00:00:00Z' }] });
    render(<MySharedStories />);
    expect(await screen.findByText(/Published/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw' }));
    await waitFor(() => expect(apiPost).toHaveBeenCalledWith('/cultural/oral-histories/o1/withdraw'));
  });
});
