import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/theme-context';
import EventCard from './event-card';
import { eventsApi } from '../../../services/api';

// Mock the API module
jest.mock('../../../services/api', () => ({
  eventsApi: {
    registerForEvent: jest.fn(),
    unregisterFromEvent: jest.fn(),
  },
}));


describe('EventCard Component', () => {
  const mockEvent = {
    id: 'event1',
    title: 'Healing Workshop',
    description: 'A workshop on traditional healing practices',
    startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    endDate: new Date(Date.now() + 2 * 86400000).toISOString(), // In 2 days
    location: 'Lagos, Nigeria',
    organizer: {
      id: 'org1',
      firstName: 'Healer',
      lastName: 'Johnson',
      avatar: '',
    },
    maxAttendees: 50,
    attendeesCount: 25,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders event details correctly', () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <EventCard event={mockEvent} />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByText('Healing Workshop')).toBeInTheDocument();
    expect(screen.getByText('A workshop on traditional healing practices')).toBeInTheDocument();
    expect(screen.getByText('Lagos, Nigeria')).toBeInTheDocument();
    expect(screen.getByText('Healer Johnson')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <EventCard event={mockEvent} />
        </MemoryRouter>
      </ThemeProvider>
    );

    // Check that the date is formatted properly
    expect(screen.getByText(/tomorrow/i)).toBeInTheDocument();
  });

  it('renders attendance information', () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <EventCard event={mockEvent} />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByText('25/50')).toBeInTheDocument();
  });

  it('allows registering for an event', async () => {
    (eventsApi.registerForEvent as jest.MockedFunction<typeof eventsApi.registerForEvent>).mockResolvedValue({ success: true });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <EventCard event={mockEvent} />
        </MemoryRouter>
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText(/register/i));

    await waitFor(() => {
      expect(eventsApi.registerForEvent).toHaveBeenCalledWith('event1');
    });

    expect(screen.getByText(/registered successfully/i)).toBeInTheDocument();
  });

  it('allows unregistering from an event', async () => {
    (eventsApi.unregisterFromEvent as jest.MockedFunction<typeof eventsApi.unregisterFromEvent>).mockResolvedValue({ success: true });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <EventCard event={{ ...mockEvent, isRegistered: true }} />
        </MemoryRouter>
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText(/unregister/i));

    await waitFor(() => {
      expect(eventsApi.unregisterFromEvent).toHaveBeenCalledWith('event1');
    });

    expect(screen.getByText(/unregistered successfully/i)).toBeInTheDocument();
  });

  it('shows register button when not registered', () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <EventCard event={mockEvent} />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByText(/register/i)).toBeInTheDocument();
    expect(screen.queryByText(/unregister/i)).not.toBeInTheDocument();
  });

  it('shows unregister button when registered', () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <EventCard event={{ ...mockEvent, isRegistered: true }} />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByText(/unregister/i)).toBeInTheDocument();
    expect(screen.queryByText(/register/i)).not.toBeInTheDocument();
  });

  it('shows full capacity message when event is full', () => {
    const fullEvent = { ...mockEvent, attendeesCount: 50 };
    
    render(
      <ThemeProvider>
        <MemoryRouter>
          <EventCard event={fullEvent} />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByText(/event full/i)).toBeInTheDocument();
    expect(screen.getByText(/register/i)).toBeInTheDocument(); // Still shows register but disabled
  });

  it('displays organizer avatar', () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <EventCard event={mockEvent} />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByAltText('Healer Johnson')).toBeInTheDocument();
  });
});