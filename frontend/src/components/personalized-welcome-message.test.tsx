import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { MemoryRouter } from 'react-router-dom';
import PersonalizedWelcomeMessage from './personalized-welcome-message';

// Mock the auth hook
vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
    },
  }),
}));

// Mock the API
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(() => Promise.resolve({ data: { loginCount: 1 } })),
  },
}));

const server = setupServer(
  rest.get('*/users/:userId', (req, res, ctx) => {
    return res(
      ctx.json({
        loginCount: 1,
        newBadgeUnlocked: false,
        upcomingAppointmentWithin24h: false,
      })
    );
  })
);

beforeEach(() => {
  server.listen();
});

afterEach(() => {
  server.close();
});

describe('PersonalizedWelcomeMessage', () => {
  it('renders with a welcome message', async () => {
    render(
      <MemoryRouter>
        <PersonalizedWelcomeMessage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
    });
  });

  it('displays the correct message based on user data', async () => {
    render(
      <MemoryRouter>
        <PersonalizedWelcomeMessage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/It's great to see you again, Test User/)).toBeInTheDocument();
    });
  });

  it('allows dismissing the message', async () => {
    render(
      <MemoryRouter>
        <PersonalizedWelcomeMessage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const dismissButton = screen.getByText('Dismiss');
      expect(dismissButton).toBeInTheDocument();
    });
  });
});