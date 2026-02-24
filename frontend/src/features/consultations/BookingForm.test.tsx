import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { BookingForm } from './BookingForm';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/lib/api', () => ({ default: { post: vi.fn() } }));

describe('BookingForm', () => {
  const defaultProps = { babalawoId: 'bab-1', babalawoName: 'Babalawo Test' };

  it('renders without crashing', () => {
    const { container } = render(<BookingForm {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('displays booking heading and babalawo name', () => {
    render(<BookingForm {...defaultProps} />);
    expect(screen.getByText('Book Consultation')).toBeInTheDocument();
    expect(screen.getByText(/Schedule your spiritual guidance session with Babalawo Test/)).toBeInTheDocument();
  });

  it('shows date, time, and topic inputs', () => {
    const { container } = render(<BookingForm {...defaultProps} />);
    expect(container.querySelector('input[type="date"]')).toBeInTheDocument();
    expect(container.querySelector('input[type="time"]')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/What would you like guidance/)).toBeInTheDocument();
  });

  it('shows duration options 30, 60, 90 min', () => {
    render(<BookingForm {...defaultProps} />);
    expect(screen.getByRole('button', { name: '30 min' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '60 min' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '90 min' })).toBeInTheDocument();
  });

  it('shows total price and confirm booking button', () => {
    render(<BookingForm {...defaultProps} />);
    expect(screen.getByText(/Total Amount/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm Booking/i })).toBeInTheDocument();
  });

  it('submit button is disabled when date, time, or topic are empty', () => {
    render(<BookingForm {...defaultProps} />);
    const submit = screen.getByRole('button', { name: /Confirm Booking/i });
    expect(submit).toBeDisabled();
  });

  it('displays preferred method options', () => {
    render(<BookingForm {...defaultProps} />);
    expect(screen.getByText('Video Call')).toBeInTheDocument();
    expect(screen.getByText('Phone Call')).toBeInTheDocument();
    expect(screen.getByText('In Person')).toBeInTheDocument();
  });
});
