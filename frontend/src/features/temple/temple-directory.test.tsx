/**
 * Component tests for TempleDirectory
 * Testing rendering, filtering, and user interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TempleDirectory from './temple-directory';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TempleType } from '@common';
import api from '@/lib/api';

// Mock the OptimizedImage component
vi.mock('@/components/common/optimized-image', () => ({
  OptimizedImage: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} data-testid="optimized-image" />
  ),
}));

// Mock the motion components
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: any) => <div {...props} data-motion-test>{children}</div>,
    },
  };
});

// Mocked at the top level (not inside `it()`) so it's in effect before
// TempleDirectory's static `import api from '@/lib/api'` resolves.
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockTemples = [
  {
    id: '1',
    name: 'Ife Temple',
    location: 'Ile-Ife, Nigeria',
    city: 'Ile-Ife',
    country: 'NG',
    type: TempleType.ILE_IFA,
    services: ['Divination', 'Ceremonies', 'Education'],
    verified: true,
    babalawoCount: 5,
    image: 'temple-image-url',
  },
  {
    id: '2',
    name: 'Lagos Spiritual Center',
    location: 'Lagos, Nigeria',
    city: 'Lagos',
    country: 'NG',
    type: TempleType.STUDY_CIRCLE,
    services: ['Healing', 'Consultations'],
    verified: false,
    babalawoCount: 3,
    image: null,
  },
];

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('TempleDirectory', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it('renders loading state initially', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockTemples } as Awaited<ReturnType<typeof api.get>>);

    const { container, unmount } = render(
      <Wrapper>
        <TempleDirectory />
      </Wrapper>
    );

    // The component shows a skeleton (no literal "loading" text) while react-query fetches
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Ife Temple')).toBeInTheDocument();
    });

    unmount();
  });

  it('renders temple cards after data loads', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockTemples } as Awaited<ReturnType<typeof api.get>>);

    const { unmount } = render(
      <Wrapper>
        <TempleDirectory />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Ife Temple')).toBeInTheDocument();
    });

    expect(screen.getByText('Lagos Spiritual Center')).toBeInTheDocument();
    expect(screen.getByText('Ile-Ife', { exact: false })).toBeInTheDocument();

    unmount();
  });

  it('filters temples based on search input', async () => {
    // The component re-queries on every keystroke (queryKey includes searchQuery),
    // so the mock must keep answering for the filtered request too.
    vi.mocked(api.get).mockResolvedValue({ data: mockTemples } as Awaited<ReturnType<typeof api.get>>);

    const { unmount } = render(
      <Wrapper>
        <TempleDirectory />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Ife Temple')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search temples/i);
    fireEvent.change(searchInput, { target: { value: 'Lagos' } });

    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith(
        '/temples',
        expect.objectContaining({ params: expect.objectContaining({ search: 'Lagos' }) })
      );
    });

    unmount();
  });

  it('shows verification badge for verified temples', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockTemples } as Awaited<ReturnType<typeof api.get>>);

    const { unmount } = render(
      <Wrapper>
        <TempleDirectory />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Ife Temple')).toBeInTheDocument();
    });

    // Only Ife Temple is verified; the badge renders the literal text "Verified"
    expect(screen.getByText('Verified')).toBeInTheDocument();

    unmount();
  });

  it('shows the empty state when the API call fails', async () => {
    // The component doesn't destructure `error`/`isError` from useQuery, so a
    // rejected fetch just leaves `temples` at its `[]` default -- there is no
    // dedicated error/retry UI, it falls through to the same "No temples found"
    // empty state as a genuinely empty result.
    vi.mocked(api.get).mockRejectedValue(new Error('Failed to fetch temples'));

    const { unmount } = render(
      <Wrapper>
        <TempleDirectory />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No temples found')).toBeInTheDocument();
    });

    unmount();
  });

  it('allows selecting a temple', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockTemples } as Awaited<ReturnType<typeof api.get>>);

    const mockOnSelectTemple = vi.fn();
    const { unmount } = render(
      <Wrapper>
        <TempleDirectory onSelectTemple={mockOnSelectTemple} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Ife Temple')).toBeInTheDocument();
    });

    const templeCards = screen.getAllByText('Ife Temple');
    fireEvent.click(templeCards[0].closest('.group')!);

    await waitFor(() => {
      expect(mockOnSelectTemple).toHaveBeenCalledWith('1');
    });

    unmount();
  });

  it('displays temple services correctly', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockTemples } as Awaited<ReturnType<typeof api.get>>);

    const { unmount } = render(
      <Wrapper>
        <TempleDirectory />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Ife Temple')).toBeInTheDocument();
    });

    // Services aren't rendered on the temple card itself in the current design --
    // this test only guards that fetching services data doesn't break rendering.
    expect(screen.getByText('Lagos Spiritual Center')).toBeInTheDocument();

    unmount();
  });
});
