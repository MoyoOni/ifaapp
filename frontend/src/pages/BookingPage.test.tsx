import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import { BookingPage } from './BookingPage';

vi.mock('@/lib/api', () => ({ default: { get: vi.fn() } }));
vi.mock('@/demo/index', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/demo/index')>();
  return { ...actual, getDemoUserById: vi.fn() };
});
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: vi.fn(() => vi.fn()),
  };
});

import api from '@/lib/api';
import { getDemoUserById } from '@/demo/index';
import { useParams } from 'react-router-dom';

function renderBookingPage(babalawoId: string | undefined = 'bab-1') {
  vi.mocked(useParams).mockReturnValue(babalawoId ? { babalawoId } : {});
  return render(<BookingPage />);
}

describe('BookingPage', () => {
  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({ babalawoId: 'bab-1' });
    vi.mocked(api.get).mockResolvedValue({
      data: {
        name: 'Babalawo Test',
        yorubaName: 'Babaláwo',
        bio: 'Test bio',
        location: 'Lagos',
        rating: 5,
        specialties: ['Ifa Divination'],
      },
    });
    vi.mocked(getDemoUserById).mockReturnValue(null);
  });

  it('renders booking page without crashing', () => {
    const { container } = renderBookingPage();
    expect(container).toBeTruthy();
  });

  it('shows loading then babalawo name after fetch', async () => {
    renderBookingPage();
    expect(screen.getByText(/Loading Babalawo details/)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Babalawo Test')).toBeInTheDocument();
    });
    expect(screen.getByText('Babaláwo')).toBeInTheDocument();
    expect(screen.getByText('Test bio')).toBeInTheDocument();
  });

  it('when no babalawoId shows error state', async () => {
    vi.mocked(useParams).mockReturnValue({});
    render(<BookingPage />);
    await waitFor(() => {
      expect(screen.getByText('No Babalawo ID provided.')).toBeInTheDocument();
    });
  });

  it('when API fails uses demo user when getDemoUserById returns', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Network'));
    vi.mocked(getDemoUserById).mockReturnValue({
      id: 'demo-1',
      name: 'Demo Babalawo',
      yorubaName: 'Demo',
      bio: 'Demo bio',
      location: 'Lagos',
      specialization: ['Ifa'],
    } as any);
    renderBookingPage();
    await waitFor(() => {
      expect(screen.getByText('Demo Babalawo')).toBeInTheDocument();
    });
  });

  it('when API fails and no demo user shows fallback name', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Network'));
    vi.mocked(getDemoUserById).mockReturnValue(null);
    renderBookingPage();
    await waitFor(() => {
      expect(screen.getByText('Babalawo Femi Sowande')).toBeInTheDocument();
    });
  });
});
