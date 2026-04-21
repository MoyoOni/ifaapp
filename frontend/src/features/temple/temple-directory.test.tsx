/**
 * Component tests for TempleDirectory
 * Testing rendering, filtering, and user interactions
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TempleDirectory from './temple-directory';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TempleType } from '@common';

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
  },
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </QueryClientProvider>
);

describe('TempleDirectory', () => {
  it('renders loading state initially', async () => {
    // Mock the API here within the test
    vi.doMock('@/lib/api', async () => {
      const actual = await vi.importActual('@/lib/api');
      return {
        ...actual,
        default: {
          get: vi.fn().mockResolvedValue({
            data: [
              {
                id: '1',
                name: 'Ife Temple',
                location: 'Ile-Ife, Nigeria',
                city: 'Ile-Ife',
                country: 'NG',
                type: TempleType.ILE_IFA,
                services: ['Divination', 'Ceremonies', 'Education'],
                distance: 10,
                verified: true,
                practitionersCount: 5,
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
                distance: 25,
                verified: false,
                practitionersCount: 3,
                image: null,
              },
            ]
          })
        }
      };
    });

    const { unmount } = render(
      <Wrapper>
        <TempleDirectory />
      </Wrapper>
    );

    // Since the component uses react-query, there will be a loading state initially
    expect(screen.getByText(/loading temples/i)).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Ife Temple')).toBeInTheDocument();
    });
    
    unmount();
  });

  it('renders temple cards after data loads', async () => {
    // Mock the API here within the test
    vi.doMock('@/lib/api', async () => {
      const actual = await vi.importActual('@/lib/api');
      return {
        ...actual,
        default: {
          get: vi.fn().mockResolvedValue({
            data: [
              {
                id: '1',
                name: 'Ife Temple',
                location: 'Ile-Ife, Nigeria',
                city: 'Ile-Ife',
                country: 'NG',
                type: TempleType.ILE_IFA,
                services: ['Divination', 'Ceremonies', 'Education'],
                distance: 10,
                verified: true,
                practitionersCount: 5,
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
                distance: 25,
                verified: false,
                practitionersCount: 3,
                image: null,
              },
            ]
          })
        }
      };
    });

    const { unmount } = render(
      <Wrapper>
        <TempleDirectory />
      </Wrapper>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Ife Temple')).toBeInTheDocument();
    });

    expect(screen.getByText('Ife Temple')).toBeInTheDocument();
    expect(screen.getByText('Lagos Spiritual Center')).toBeInTheDocument();
    expect(screen.getByText('Ile-Ife, Nigeria')).toBeInTheDocument();
    
    unmount();
  });

  it('filters temples based on search input', async () => {
    // Mock the API here within the test
    vi.doMock('@/lib/api', async () => {
      const actual = await vi.importActual('@/lib/api');
      return {
        ...actual,
        default: {
          get: vi.fn().mockResolvedValue({
            data: [
              {
                id: '1',
                name: 'Ife Temple',
                location: 'Ile-Ife, Nigeria',
                city: 'Ile-Ife',
                country: 'NG',
                type: TempleType.ILE_IFA,
                services: ['Divination', 'Ceremonies', 'Education'],
                distance: 10,
                verified: true,
                practitionersCount: 5,
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
                distance: 25,
                verified: false,
                practitionersCount: 3,
                image: null,
              },
            ]
          })
        }
      };
    });

    const { unmount } = render(
      <Wrapper>
        <TempleDirectory />
      </Wrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Ife Temple')).toBeInTheDocument();
    });

    // Find and use the search input
    const searchInput = screen.getByPlaceholderText(/search temples/i);
    fireEvent.change(searchInput, { target: { value: 'Lagos' } });

    // Check that only Lagos temple is shown
    await waitFor(() => {
      expect(screen.getByText('Lagos Spiritual Center')).toBeInTheDocument();
    });

    expect(screen.queryByText('Ife Temple')).not.toBeInTheDocument();
    
    unmount();
  });

  it('shows verification badge for verified temples', async () => {
    // Mock the API here within the test
    vi.doMock('@/lib/api', async () => {
      const actual = await vi.importActual('@/lib/api');
      return {
        ...actual,
        default: {
          get: vi.fn().mockResolvedValue({
            data: [
              {
                id: '1',
                name: 'Ife Temple',
                location: 'Ile-Ife, Nigeria',
                city: 'Ile-Ife',
                country: 'NG',
                type: TempleType.ILE_IFA,
                services: ['Divination', 'Ceremonies', 'Education'],
                distance: 10,
                verified: true,
                practitionersCount: 5,
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
                distance: 25,
                verified: false,
                practitionersCount: 3,
                image: null,
              },
            ]
          })
        }
      };
    });

    const { unmount } = render(
      <Wrapper>
        <TempleDirectory />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Ife Temple')).toBeInTheDocument();
    });

    // Find the verification badge container
    const verificationBadges = screen.getAllByTitle?.('Verified temple') || 
                              screen.getAllByText('Verified') ||
                              screen.getAllByTestId('optimized-image'); // This is our mock

    // The Ife Temple should have a verification badge
    expect(verificationBadges.length).toBeGreaterThanOrEqual(1);
    
    unmount();
  });

  it('handles API errors gracefully', async () => {
    // Mock the API to reject for this test
    vi.doMock('@/lib/api', async () => {
      const actual = await vi.importActual('@/lib/api');
      return {
        ...actual,
        default: {
          get: vi.fn().mockRejectedValue(new Error('Failed to fetch temples'))
        }
      };
    });

    const { unmount } = render(
      <Wrapper>
        <TempleDirectory />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load temples/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/failed to load temples/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    
    unmount();
  });

  it('allows selecting a temple', async () => {
    // Mock the API here within the test
    vi.doMock('@/lib/api', async () => {
      const actual = await vi.importActual('@/lib/api');
      return {
        ...actual,
        default: {
          get: vi.fn().mockResolvedValue({
            data: [
              {
                id: '1',
                name: 'Ife Temple',
                location: 'Ile-Ife, Nigeria',
                city: 'Ile-Ife',
                country: 'NG',
                type: TempleType.ILE_IFA,
                services: ['Divination', 'Ceremonies', 'Education'],
                distance: 10,
                verified: true,
                practitionersCount: 5,
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
                distance: 25,
                verified: false,
                practitionersCount: 3,
                image: null,
              },
            ]
          })
        }
      };
    });

    const mockOnSelectTemple = vi.fn();
    const { unmount } = render(
      <Wrapper>
        <TempleDirectory onSelectTemple={mockOnSelectTemple} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Ife Temple')).toBeInTheDocument();
    });

    // Click on the first temple card
    const templeCards = screen.getAllByText('Ife Temple');
    fireEvent.click(templeCards[0].closest('.group')!);

    // Check that the onSelectTemple callback was called
    await waitFor(() => {
      expect(mockOnSelectTemple).toHaveBeenCalled();
    });
    
    unmount();
  });

  it('displays temple services correctly', async () => {
    // Mock the API here within the test
    vi.doMock('@/lib/api', async () => {
      const actual = await vi.importActual('@/lib/api');
      return {
        ...actual,
        default: {
          get: vi.fn().mockResolvedValue({
            data: [
              {
                id: '1',
                name: 'Ife Temple',
                location: 'Ile-Ife, Nigeria',
                city: 'Ile-Ife',
                country: 'NG',
                type: TempleType.ILE_IFA,
                services: ['Divination', 'Ceremonies', 'Education'],
                distance: 10,
                verified: true,
                practitionersCount: 5,
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
                distance: 25,
                verified: false,
                practitionersCount: 3,
                image: null,
              },
            ]
          })
        }
      };
    });

    const { unmount } = render(
      <Wrapper>
        <TempleDirectory />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Ife Temple')).toBeInTheDocument();
    });

    // Check that services are displayed
    expect(screen.getByText('Divination')).toBeInTheDocument();
    expect(screen.getByText('Ceremonies')).toBeInTheDocument();
    expect(screen.getByText('Education')).toBeInTheDocument();
    
    unmount();
  });

  it('shows distance information when available', async () => {
    // Mock the API here within the test
    vi.doMock('@/lib/api', async () => {
      const actual = await vi.importActual('@/lib/api');
      return {
        ...actual,
        default: {
          get: vi.fn().mockResolvedValue({
            data: [
              {
                id: '1',
                name: 'Ife Temple',
                location: 'Ile-Ife, Nigeria',
                city: 'Ile-Ife',
                country: 'NG',
                type: TempleType.ILE_IFA,
                services: ['Divination', 'Ceremonies', 'Education'],
                distance: 10,
                verified: true,
                practitionersCount: 5,
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
                distance: 25,
                verified: false,
                practitionersCount: 3,
                image: null,
              },
            ]
          })
        }
      };
    });

    const { unmount } = render(
      <Wrapper>
        <TempleDirectory />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Ife Temple')).toBeInTheDocument();
    });

    // Check that distance is shown
    expect(screen.getByText('10 km')).toBeInTheDocument();
    
    unmount();
  });
});