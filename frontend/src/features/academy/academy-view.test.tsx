import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import AcademyView from './academy-view';

// V8-203: clicking a locked course card previously navigated straight to
// /pricing with no explanation. This verifies the lock badge renders on the
// card and clicking it opens an UpgradePrompt modal instead of navigating
// away immediately.

const mockUseSubscription = vi.fn();
vi.mock('@/features/subscription/use-subscription', () => ({
  useSubscription: () => mockUseSubscription(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockApiGet = vi.fn();
vi.mock('@/lib/api', () => ({
  default: { get: (...args: any[]) => mockApiGet(...args) },
}));

const courses = [
  {
    id: 'course-1',
    instructorId: 'instructor-1',
    title: 'Advanced Priestly Rites',
    slug: 'advanced-priestly-rites',
    description: 'Deep study',
    category: 'advanced_priestly',
    level: 'advanced',
    price: 0,
    currency: 'NGN',
    status: 'PUBLISHED',
    enrolledCount: 12,
    lessonCount: 5,
    certificateEnabled: true,
    isDevoted: true,
    instructor: { id: 'instructor-1', name: 'Babalawo Kunle', verified: true },
    _count: { lessons: 5, enrollments: 12 },
  },
];

function renderAcademy() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AcademyView />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('AcademyView Devoted gating (V8-203)', () => {
  beforeEach(() => {
    mockApiGet.mockReset();
    mockNavigate.mockReset();
    mockApiGet.mockResolvedValue({ data: courses });
  });

  it('shows a lock badge on a Devoted-only course card for a FREE user', async () => {
    mockUseSubscription.mockReturnValue({ isDevoted: false });

    renderAcademy();

    await waitFor(() => {
      expect(screen.getByText('Devoted')).toBeInTheDocument();
    });
  });

  it('opens an UpgradePrompt modal instead of navigating away when a locked course is clicked', async () => {
    mockUseSubscription.mockReturnValue({ isDevoted: false });

    renderAcademy();

    const card = await screen.findByText('Advanced Priestly Rites');
    fireEvent.click(card);

    await waitFor(() => {
      expect(screen.getByText(/Devoted-only course/)).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalledWith('/pricing');
  });

  it('navigates straight to the course for a DEVOTED user', async () => {
    mockUseSubscription.mockReturnValue({ isDevoted: true });

    renderAcademy();

    const card = await screen.findByText('Advanced Priestly Rites');
    fireEvent.click(card);

    expect(mockNavigate).toHaveBeenCalledWith('/academy/course/course-1');
  });
});
