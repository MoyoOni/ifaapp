import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CircleManagementView from './circle-management-view';

// V8-204: circle.isDevoted existed in the schema and the join-gate already
// enforced it, but nothing anywhere let an admin actually turn it on for a
// circle. This verifies the new admin toggle calls the real endpoint.

vi.mock('@/components/common/ModalProvider', () => ({
  useModal: () => ({ showModal: vi.fn() }),
}));

vi.mock('@/hooks/use-prompt', () => ({
  usePrompt: () => ({ PromptDialog: () => null, prompt: vi.fn() }),
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('@/shared/components/toast', () => ({
  useToast: () => ({ success: mockToastSuccess, error: mockToastError }),
}));

const mockApiGet = vi.fn();
const mockApiPatch = vi.fn();
vi.mock('@/lib/api', () => ({
  default: {
    get: (...args: any[]) => mockApiGet(...args),
    patch: (...args: any[]) => mockApiPatch(...args),
  },
}));

const circles = [
  { id: 'circle-1', name: 'Elders Council', slug: 'elders-council', status: 'ACTIVE', memberCount: 20, createdAt: new Date().toISOString(), isDevoted: false, creator: { id: 'u1', name: 'Founder' } },
  { id: 'circle-2', name: 'Devoted Inner Circle', slug: 'devoted-inner-circle', status: 'ACTIVE', memberCount: 8, createdAt: new Date().toISOString(), isDevoted: true, creator: { id: 'u2', name: 'Founder Two' } },
];

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CircleManagementView />
    </QueryClientProvider>
  );
}

describe('CircleManagementView Devoted toggle (V8-204)', () => {
  beforeEach(() => {
    mockApiGet.mockReset();
    mockApiPatch.mockReset();
    mockApiGet.mockImplementation((url: string) => {
      if (url === '/admin/circle-suggestions') return Promise.resolve({ data: [] });
      if (url === '/circles') return Promise.resolve({ data: circles });
      return Promise.resolve({ data: [] });
    });
  });

  it('shows a Devoted badge for a circle already marked Devoted', async () => {
    renderView();

    fireEvent.click(await screen.findByText(/All Circles/));

    await waitFor(() => {
      expect(screen.getByText('Devoted Inner Circle')).toBeInTheDocument();
    });
    expect(screen.getByText('Devoted')).toBeInTheDocument();
  });

  it('calls PATCH /admin/circles/:id/devoted when toggling a non-Devoted circle on', async () => {
    mockApiPatch.mockResolvedValue({ data: { id: 'circle-1', isDevoted: true } });

    renderView();
    fireEvent.click(await screen.findByText(/All Circles/));

    const makeDevotedButton = await screen.findAllByText('Make Devoted-only');
    fireEvent.click(makeDevotedButton[0]);

    await waitFor(() => {
      expect(mockApiPatch).toHaveBeenCalledWith('/admin/circles/circle-1/devoted', { isDevoted: true });
    });
  });

  it('calls the same endpoint with false when removing the gate from an already-Devoted circle', async () => {
    mockApiPatch.mockResolvedValue({ data: { id: 'circle-2', isDevoted: false } });

    renderView();
    fireEvent.click(await screen.findByText(/All Circles/));

    const removeButton = await screen.findByText('Remove Devoted gate');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(mockApiPatch).toHaveBeenCalledWith('/admin/circles/circle-2/devoted', { isDevoted: false });
    });
  });
});
