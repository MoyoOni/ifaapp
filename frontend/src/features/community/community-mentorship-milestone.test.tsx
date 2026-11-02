import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import CommunityMentorshipView from './community-mentorship-view';

const apiGet = vi.fn();
const apiPost = vi.fn();
vi.mock('@/lib/api', () => ({ default: { get: (...a: unknown[]) => apiGet(...a), post: (...a: unknown[]) => apiPost(...a) } }));
vi.mock('@/shared/components/toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));

const mentor = { id: 'm1', name: 'Ìyá Àdùnní', specialization: ['Orientation'], activeMenteeCount: 0 };

// FOR-023: a milestone notification lands here with ?milestone=
describe('CommunityMentorshipView milestone suggestions', () => {
  beforeEach(() => {
    apiPost.mockReset().mockResolvedValue({ data: {} });
    apiGet.mockImplementation((url: string) =>
      Promise.resolve({
        data: url.startsWith('/community-mentorship/suggestions')
          ? { milestone: 'cultural-scholar', reason: 'finishing the cultural orientation', hasMentor: false, mentors: [mentor] }
          : url === '/community-mentorship/mine'
            ? { asMentee: null, asMentor: [] }
            : [],
      })
    );
  });

  it('shows mentors further along for the milestone just reached, and lets the member request one', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/community/mentorship?milestone=cultural-scholar']}>
          <CommunityMentorshipView />
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(await screen.findByText(/Congratulations on finishing the cultural orientation/)).toBeInTheDocument();
    expect(apiGet).toHaveBeenCalledWith('/community-mentorship/suggestions?milestone=cultural-scholar');
    fireEvent.click(screen.getByRole('button', { name: 'Request Mentorship' }));
    await waitFor(() => expect(apiPost).toHaveBeenCalledWith('/community-mentorship/request', { mentorUserId: 'm1' }));
  });
});
