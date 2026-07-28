import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import CircleDetailView from './circle-detail-view';
import { CircleDetail } from './types/circle.types';

// V8-204: joinCircleMutation's mutationFn used to swallow every API error
// unconditionally (a leftover demo-mode fallback -- see
// circle-membership.utils.ts's `demo-circle-membership:` key), so a real
// FREE user correctly rejected (403) from a Devoted-only circle would see
// "Joined circle" instead of the real rejection. This verifies the real
// error now reaches the toast when not in demo mode.

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('@/shared/components/toast', () => ({
  useToast: () => ({ success: mockToastSuccess, error: mockToastError }),
}));

vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'client-1', role: 'CLIENT' } }),
}));

const mockUseSubscription = vi.fn();
vi.mock('@/features/subscription/use-subscription', () => ({
  useSubscription: () => mockUseSubscription(),
}));

vi.mock('@/shared/utils/dev-mode', () => ({
  isDevModeActive: () => false,
}));

const mockApiGet = vi.fn();
const mockApiPost = vi.fn();
vi.mock('@/lib/api', () => ({
  default: {
    get: (...args: any[]) => mockApiGet(...args),
    post: (...args: any[]) => mockApiPost(...args),
  },
}));

const baseCircle: CircleDetail = {
  id: 'circle-1',
  name: 'Devoted Circle',
  slug: 'devoted-circle',
  privacy: 'PUBLIC',
  topics: [],
  memberCount: 5,
  active: true,
  createdAt: new Date().toISOString(),
  creator: { id: 'creator-1', name: 'Creator' },
  members: [],
  _count: { members: 5 },
};

function renderCircleDetail() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CircleDetailView circleSlug="devoted-circle" />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('CircleDetailView join mutation (V8-204)', () => {
  beforeEach(() => {
    mockApiGet.mockReset();
    mockApiPost.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
    mockUseSubscription.mockReturnValue({ isDevoted: false });

    mockApiGet.mockImplementation((url: string) => {
      if (url === `/circles/devoted-circle`) {
        return Promise.resolve({ data: baseCircle });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('surfaces the real 403 rejection instead of faking a successful join', async () => {
    mockApiPost.mockRejectedValue({
      response: { status: 403, data: { message: 'This circle is for Devoted members only' } },
    });

    renderCircleDetail();

    const joinButton = await screen.findByText('Join Circle');
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('This circle is for Devoted members only');
    });
    expect(mockToastSuccess).not.toHaveBeenCalledWith('Joined circle');
  });

  it('shows real success when the join actually succeeds', async () => {
    mockApiPost.mockResolvedValue({ data: {} });

    renderCircleDetail();

    const joinButton = await screen.findByText('Join Circle');
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Joined circle');
    });
    expect(mockToastError).not.toHaveBeenCalled();
  });
});
