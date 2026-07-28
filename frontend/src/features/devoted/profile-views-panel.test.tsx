import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProfileViewsPanel from './profile-views-panel';

const mockUseSubscription = vi.fn();
vi.mock('@/features/subscription/use-subscription', () => ({
  useSubscription: () => mockUseSubscription(),
}));

vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

const mockApiGet = vi.fn();
vi.mock('@/lib/api', () => ({
  default: { get: (...args: any[]) => mockApiGet(...args) },
}));

function renderPanel() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<ProfileViewsPanel />} />
          <Route path="/profile/:userId" element={<div>Visitor Profile Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ProfileViewsPanel (V8-302)', () => {
  beforeEach(() => {
    mockApiGet.mockReset();
  });

  it('shows a blurred teaser + UpgradePrompt for a FREE user, and never calls the endpoint', async () => {
    mockUseSubscription.mockReturnValue({ isDevoted: false });

    renderPanel();

    expect(screen.getByText('Adewale O.')).toBeInTheDocument();
    expect(screen.getByText(/See who visited your profile/)).toBeInTheDocument();
    expect(mockApiGet).not.toHaveBeenCalled();
  });

  it('shows the real visitor list for a DEVOTED user', async () => {
    mockUseSubscription.mockReturnValue({ isDevoted: true });
    mockApiGet.mockResolvedValue({
      data: [
        {
          id: 'view-1',
          viewedAt: new Date().toISOString(),
          viewer: { id: 'viewer-1', name: 'Real Visitor', role: 'BABALAWO' },
        },
      ],
    });

    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('Real Visitor')).toBeInTheDocument();
    });
    expect(mockApiGet).toHaveBeenCalledWith('/users/user-1/profile-viewers');
    expect(screen.queryByText(/See who visited your profile/)).not.toBeInTheDocument();
  });

  it('navigates to the visitor\'s profile when clicked', async () => {
    mockUseSubscription.mockReturnValue({ isDevoted: true });
    mockApiGet.mockResolvedValue({
      data: [
        {
          id: 'view-1',
          viewedAt: new Date().toISOString(),
          viewer: { id: 'viewer-1', name: 'Real Visitor', role: 'BABALAWO' },
        },
      ],
    });

    renderPanel();

    const row = await screen.findByText('Real Visitor');
    fireEvent.click(row);

    await waitFor(() => {
      expect(screen.getByText('Visitor Profile Page')).toBeInTheDocument();
    });
  });

  it('shows an empty state when a DEVOTED user has no visitors', async () => {
    mockUseSubscription.mockReturnValue({ isDevoted: true });
    mockApiGet.mockResolvedValue({ data: [] });

    renderPanel();

    await waitFor(() => {
      expect(screen.getByText(/No visitors yet/)).toBeInTheDocument();
    });
  });
});
