import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/theme-context';
import CircleView from './circle-view';

// Mock the API module
jest.mock('../../../services/api', () => ({
  circlesApi: {
    getCircleById: jest.fn(),
    joinCircle: jest.fn(),
    leaveCircle: jest.fn(),
    getCircleMembers: jest.fn(),
  },
}));

const { circlesApi } = require('../../../services/api');

describe('CircleView Component', () => {
  const mockCircle = {
    id: 'circle1',
    name: 'Healing Circle',
    description: 'A circle for healing practices',
    owner: {
      id: 'user1',
      firstName: 'Circle',
      lastName: 'Owner',
    },
    members: [
      {
        id: 'member1',
        firstName: 'Member',
        lastName: 'One',
        role: 'ADMIN',
      },
      {
        id: 'member2',
        firstName: 'Member',
        lastName: 'Two',
        role: 'MEMBER',
      },
    ],
    isPublic: true,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    (circlesApi.getCircleById as jest.MockedFunction<typeof circlesApi.getCircleById>).mockResolvedValue(mockCircle);
    (circlesApi.getCircleMembers as jest.MockedFunction<typeof circlesApi.getCircleMembers>).mockResolvedValue(mockCircle.members);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders circle details correctly', async () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/circles/circle1']}>
          <Routes>
            <Route path="/circles/:id" element={<CircleView />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Healing Circle')).toBeInTheDocument();
    });

    expect(screen.getByText('Healing Circle')).toBeInTheDocument();
    expect(screen.getByText('A circle for healing practices')).toBeInTheDocument();
    expect(screen.getByText('Circle Owner')).toBeInTheDocument();
  });

  it('displays circle members', async () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/circles/circle1']}>
          <Routes>
            <Route path="/circles/:id" element={<CircleView />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Member One')).toBeInTheDocument();
    });

    expect(screen.getByText('Member One')).toBeInTheDocument();
    expect(screen.getByText('Member Two')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('MEMBER')).toBeInTheDocument();
  });

  it('allows joining a public circle', async () => {
    (circlesApi.joinCircle as jest.MockedFunction<typeof circlesApi.joinCircle>).mockResolvedValue({ success: true });

    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/circles/circle1']}>
          <Routes>
            <Route path="/circles/:id" element={<CircleView />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Healing Circle')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/join circle/i));

    await waitFor(() => {
      expect(circlesApi.joinCircle).toHaveBeenCalledWith('circle1');
    });

    expect(screen.getByText(/joined circle successfully/i)).toBeInTheDocument();
  });

  it('allows leaving a circle', async () => {
    (circlesApi.leaveCircle as jest.MockedFunction<typeof circlesApi.leaveCircle>).mockResolvedValue({ success: true });

    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/circles/circle1']}>
          <Routes>
            <Route path="/circles/:id" element={<CircleView />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Healing Circle')).toBeInTheDocument();
    });

    // Simulate already being a member
    fireEvent.click(screen.getByText(/leave circle/i));

    await waitFor(() => {
      expect(circlesApi.leaveCircle).toHaveBeenCalledWith('circle1');
    });

    expect(screen.getByText(/left circle successfully/i)).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/circles/circle1']}>
          <Routes>
            <Route path="/circles/:id" element={<CircleView />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    (circlesApi.getCircleById as jest.MockedFunction<typeof circlesApi.getCircleById>).mockRejectedValue(
      new Error('Failed to load circle')
    );

    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/circles/circle1']}>
          <Routes>
            <Route path="/circles/:id" element={<CircleView />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading circle/i)).toBeInTheDocument();
    });
  });
});