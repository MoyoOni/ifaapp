import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { CourseDetailView } from './course-detail-view';

// V8-203: the doc previously claimed the frontend lock/UpgradePrompt already
// existed for locked courses -- it did not. This verifies the course detail
// page now shows a lock badge and an UpgradePrompt instead of an Enroll
// button for a FREE user viewing a Devoted-only course.

const mockUseSubscription = vi.fn();
vi.mock('@/features/subscription/use-subscription', () => ({
  useSubscription: () => mockUseSubscription(),
}));

vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/shared/components/toast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

const mockApiGet = vi.fn();
vi.mock('@/lib/api', () => ({
  default: { get: (...args: any[]) => mockApiGet(...args), post: vi.fn() },
}));

const devotedCourse = {
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
  lessons: [],
  _count: { lessons: 5, enrollments: 12 },
};

function renderCourseDetail() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CourseDetailView courseId="course-1" />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('CourseDetailView Devoted gating (V8-203)', () => {
  beforeEach(() => {
    mockApiGet.mockReset();
    mockApiGet.mockImplementation((url: string) => {
      if (url === '/academy/courses/course-1') return Promise.resolve({ data: devotedCourse });
      if (url.startsWith('/academy/enrollments')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
  });

  it('shows a lock badge and UpgradePrompt instead of Enroll for a FREE user on a Devoted course', async () => {
    mockUseSubscription.mockReturnValue({ isDevoted: false });

    renderCourseDetail();

    await waitFor(() => {
      expect(screen.getByText('Devoted-only')).toBeInTheDocument();
    });
    expect(screen.getByText(/Become Devoted/)).toBeInTheDocument();
    expect(screen.queryByText('Enroll Now')).not.toBeInTheDocument();
  });

  it('shows the normal Enroll button for a DEVOTED user on the same course', async () => {
    mockUseSubscription.mockReturnValue({ isDevoted: true });

    renderCourseDetail();

    await waitFor(() => {
      expect(screen.getByText('Enroll Now')).toBeInTheDocument();
    });
    expect(screen.queryByText('Devoted-only')).not.toBeInTheDocument();
  });
});
