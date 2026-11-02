import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import StorytellingView from './storytelling-view';

const apiGet = vi.fn();
const apiPost = vi.fn();
vi.mock('@/lib/api', () => ({
  default: { get: (...a: unknown[]) => apiGet(...a), post: (...a: unknown[]) => apiPost(...a), patch: vi.fn() },
}));
let role = 'CLIENT';
vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'u-1', role }, isAuthenticated: true }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const session = (over: Record<string, unknown>) => ({
  id: 's1', title: 'Ìtàn alẹ́', description: 'Stories of Ọ̀rúnmìlà', scheduledAt: '2026-11-20T18:00:00Z', platform: 'ZOOM',
  externalUrl: 'https://zoom.us/j/1', status: 'SCHEDULED', oralHistoryId: null, _count: { rsvps: 3 }, ...over,
});

// COMMUNITY_BACKLOG.md FOR-019
describe('StorytellingView', () => {
  beforeEach(() => {
    apiPost.mockReset().mockResolvedValue({ data: {} });
  });

  it('lets a member RSVP to an upcoming storytelling evening', async () => {
    role = 'CLIENT';
    apiGet.mockImplementation((url: string) => Promise.resolve({ data: url.includes('my-rsvps') ? [] : [session({})] }));
    render(<StorytellingView />);
    expect(await screen.findByText('3 people coming')).toBeInTheDocument();
    expect(screen.queryByRole('form', { name: 'Schedule a storytelling evening' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: "I'll Be There" }));
    await waitFor(() => expect(apiPost).toHaveBeenCalledWith('/forum/live-sessions/s1/rsvp'));
  });

  it('lets an admin save the story from a past evening into the archive', async () => {
    role = 'ADMIN';
    apiGet.mockImplementation((url: string) => Promise.resolve({ data: url.includes('my-rsvps') ? [] : [session({ status: 'ENDED' })] }));
    render(<StorytellingView />);
    expect(screen.getByRole('form', { name: 'Schedule a storytelling evening' })).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: 'Save the story to the archive' }));
    fireEvent.change(screen.getByLabelText('The story *'), { target: { value: 'Long ago, as the elder told it that evening ...' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save as Draft' }));
    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith('/forum/live-sessions/s1/story', {
        title: 'Ìtàn alẹ́', content: 'Long ago, as the elder told it that evening ...', storyteller: undefined,
      })
    );
  });
});
