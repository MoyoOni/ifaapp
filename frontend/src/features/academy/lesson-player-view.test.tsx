import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import LessonPlayerView from './lesson-player-view';

// V8-203: a FREE user whose enrollment predates the backend's Devoted gate
// (or who deep-links a locked lesson) previously hit an unhandled 403 on the
// lesson-fetch query -- the page shell rendered but the main content area
// stayed permanently blank with no explanation. This verifies the real
// UpgradePrompt now renders instead.

const mockUseSubscription = vi.fn();
vi.mock('@/features/subscription/use-subscription', () => ({
  useSubscription: () => mockUseSubscription(),
}));

vi.mock('@/shared/utils/dev-mode', () => ({
  isDevModeActive: () => false,
}));

vi.mock('@/shared/components/toast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

const mockApiGet = vi.fn();
vi.mock('@/lib/api', () => ({
  default: { get: (...args: any[]) => mockApiGet(...args), post: vi.fn() },
}));

const enrollment = { id: 'enr-1', courseId: 'course-1', studentId: 'user-1', status: 'ACTIVE', progress: 0 };
const devotedCourse = {
  id: 'course-1',
  title: 'Advanced Priestly Rites',
  instructorId: 'instructor-1',
  isDevoted: true,
  instructor: { name: 'Babalawo Kunle' },
  lessons: [{ id: 'lesson-1', courseId: 'course-1', title: 'Lesson One', order: 0, type: 'TEXT', resources: [], status: 'PUBLISHED' }],
};

function renderPlayer() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LessonPlayerView enrollmentId="enr-1" />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('LessonPlayerView Devoted gating (V8-203)', () => {
  beforeEach(() => {
    mockApiGet.mockReset();
  });

  it('shows an UpgradePrompt instead of a blank pane when the lesson fetch 403s for a FREE user', async () => {
    mockUseSubscription.mockReturnValue({ isDevoted: false });
    mockApiGet.mockImplementation((url: string) => {
      if (url === '/academy/enrollments/enr-1') return Promise.resolve({ data: enrollment });
      if (url === '/academy/courses/course-1') return Promise.resolve({ data: devotedCourse });
      if (url === '/academy/enrollments/enr-1/completions') return Promise.resolve({ data: [] });
      if (url === '/academy/lessons/lesson-1') {
        return Promise.reject({ response: { status: 403, data: { message: 'Devoted only' } } });
      }
      return Promise.resolve({ data: [] });
    });

    renderPlayer();

    await waitFor(() => {
      expect(screen.getByText(/Devoted-only course/)).toBeInTheDocument();
    });
    // The sidebar's preview-safe lesson list still renders (title/order are
    // safe to show even when locked) -- only the actual lesson content pane
    // (video/audio/text/Mark Complete) must not.
    expect(screen.queryByText('Mark as Complete')).not.toBeInTheDocument();
  });

  it('renders the real lesson content for a DEVOTED user', async () => {
    mockUseSubscription.mockReturnValue({ isDevoted: true });
    const lesson = { id: 'lesson-1', courseId: 'course-1', title: 'Lesson One', order: 0, type: 'TEXT', content: 'Real lesson body', resources: [], status: 'PUBLISHED' };
    mockApiGet.mockImplementation((url: string) => {
      if (url === '/academy/enrollments/enr-1') return Promise.resolve({ data: enrollment });
      if (url === '/academy/courses/course-1') return Promise.resolve({ data: devotedCourse });
      if (url === '/academy/enrollments/enr-1/completions') return Promise.resolve({ data: [] });
      if (url === '/academy/lessons/lesson-1') return Promise.resolve({ data: lesson });
      return Promise.resolve({ data: [] });
    });

    renderPlayer();

    await waitFor(() => {
      expect(screen.getByText('Real lesson body')).toBeInTheDocument();
    });
    expect(screen.queryByText(/Devoted-only course/)).not.toBeInTheDocument();
  });
});
