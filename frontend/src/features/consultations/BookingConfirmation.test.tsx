import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BookingConfirmation } from './BookingConfirmation';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockApiGet = vi.fn();
vi.mock('@/lib/api', () => ({ default: { get: (...args: unknown[]) => mockApiGet(...args) } }));

vi.mock('@/demo', () => ({
  getDemoAppointmentById: vi.fn(),
  getDemoUserById: vi.fn(),
}));

const mockAppointment = {
  id: 'apt-1',
  confirmationCode: 'CONF-ABC123',
  babalawo: { name: 'Babalawo Test', avatar: '', specialty: 'Ifa Divination' },
  date: '2025-03-15',
  time: '10:00',
  duration: 60,
  topic: 'Life direction',
  preferredMethod: 'VIDEO',
  price: 1500,
};

function renderWithRouter(initialEntry = '/booking/apt-1/confirmation') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/booking/:appointmentId/confirmation" element={<BookingConfirmation />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('BookingConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders loading state initially', () => {
    mockApiGet.mockImplementation(() => new Promise(() => { }));
    renderWithRouter();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error when appointment not found', async () => {
    mockApiGet.mockRejectedValue(new Error('Not found'));
    const { getDemoAppointmentById } = await import('@/demo');
    vi.mocked(getDemoAppointmentById as any).mockReturnValue(null);
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText('Appointment not found.')).toBeInTheDocument();
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Appointment not found.');
  });

  it('shows confirmation when demo appointment is in sessionStorage', async () => {
    sessionStorage.setItem('demo-appointment:apt-1', JSON.stringify(mockAppointment));
    mockApiGet.mockRejectedValue(new Error('Network'));
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText(/Consultation Booked Successfully/)).toBeInTheDocument();
    });
    expect(screen.getByText('CONF-ABC123')).toBeInTheDocument();
    expect(screen.getByText('Babalawo Test')).toBeInTheDocument();
    expect(screen.getByText(/Life direction/)).toBeInTheDocument();
  });

  it('has Copy button for confirmation code when appointment loaded', async () => {
    sessionStorage.setItem('demo-appointment:apt-1', JSON.stringify(mockAppointment));
    mockApiGet.mockRejectedValue(new Error('Network'));
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Copy/i })).toBeInTheDocument();
    });
  });

  it('has accessible alert for success', async () => {
    sessionStorage.setItem('demo-appointment:apt-1', JSON.stringify(mockAppointment));
    mockApiGet.mockRejectedValue(new Error('Network'));
    renderWithRouter();
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(/Consultation Booked Successfully/i);
    });
  });
});
