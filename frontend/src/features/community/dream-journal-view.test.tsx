import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DreamJournalView from './dream-journal-view';

// FOR-021 anti-manipulation safeguard (platform owner decision, July 29, 2026):
// requesting a Babalawo interpretation must be gated behind an explicit
// disclaimer acknowledgement, since the requester may be in a vulnerable state.
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('@/shared/components/toast', () => ({
  useToast: () => ({ success: mockToastSuccess, error: mockToastError }),
}));

vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'client-1', role: 'CLIENT' } }),
}));

vi.mock('@/shared/utils/dev-mode', () => ({
  isDevModeActive: () => false,
}));

const mockApiPost = vi.fn().mockResolvedValue({ data: {} });
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: (...args: any[]) => mockApiPost(...args),
  },
}));

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <DreamJournalView />
    </QueryClientProvider>
  );
}

describe('DreamJournalView -- interpretation-request disclaimer gate', () => {
  it('does not show the disclaimer until "request interpretation" is checked', () => {
    renderView();
    fireEvent.click(screen.getByText('Record a Dream'));
    expect(screen.queryByText(/I understand and wish to request an interpretation/)).toBeNull();
  });

  it('disables Save Dream once interpretation is requested but the disclaimer is not acknowledged', () => {
    renderView();
    fireEvent.click(screen.getByText('Record a Dream'));
    fireEvent.change(screen.getByPlaceholderText('Describe your dream...'), {
      target: { value: 'a real dream' },
    });
    fireEvent.click(screen.getByLabelText("Request a Babalawo's interpretation"));

    expect(screen.getByText(/I understand and wish to request an interpretation/)).toBeTruthy();
    expect(screen.getByText('Save Dream')).toBeDisabled();
  });

  it('enables Save Dream once the disclaimer checkbox is also checked', () => {
    renderView();
    fireEvent.click(screen.getByText('Record a Dream'));
    fireEvent.change(screen.getByPlaceholderText('Describe your dream...'), {
      target: { value: 'a real dream' },
    });
    fireEvent.click(screen.getByLabelText("Request a Babalawo's interpretation"));
    fireEvent.click(screen.getByLabelText(/I understand and wish to request an interpretation/));

    expect(screen.getByText('Save Dream')).not.toBeDisabled();
  });

  it('never gates the Save Dream button when no interpretation is requested', () => {
    renderView();
    fireEvent.click(screen.getByText('Record a Dream'));
    fireEvent.change(screen.getByPlaceholderText('Describe your dream...'), {
      target: { value: 'a real dream' },
    });
    expect(screen.getByText('Save Dream')).not.toBeDisabled();
  });
});
