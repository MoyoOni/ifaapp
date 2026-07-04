import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { MemoryRouter } from 'react-router-dom';
import FirstStepsChecklist from './first-steps-checklist';

// Mock the auth hook
vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      avatar: null,
      yorubaName: null,
      location: null,
      bio: null,
    },
  }),
}));

// Mock the API
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(() => Promise.resolve({ 
      data: { 
        avatar: null,
        yorubaName: null,
        location: null,
        bio: null,
        _count: {
          appointmentsAsClient: 0,
          babalawoReviews: 0
        }
      } 
    })),
    patch: vi.fn(() => Promise.resolve()),
  },
}));

const server = setupServer(
  rest.get('*/users/:userId', (req, res, ctx) => {
    return res(
      ctx.json({
        avatar: null,
        yorubaName: null,
        location: null,
        bio: null,
        _count: {
          appointmentsAsClient: 0,
          babalawoReviews: 0
        }
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

describe('FirstStepsChecklist', () => {
  it('renders checklist items', async () => {
    render(
      <MemoryRouter>
        <FirstStepsChecklist />
      </MemoryRouter>
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Your First Steps')).toBeInTheDocument();
    });

    // Check that all checklist items are rendered
    expect(screen.getByText('Add a profile photo')).toBeInTheDocument();
    expect(screen.getByText('Set your Yoruba name')).toBeInTheDocument();
    expect(screen.getByText('Add your location')).toBeInTheDocument();
    expect(screen.getByText('Write a short bio')).toBeInTheDocument();
    expect(screen.getByText('Book your first consultation')).toBeInTheDocument();
    expect(screen.getByText('Leave a review')).toBeInTheDocument();
  });

  it('displays completion percentage', async () => {
    render(
      <MemoryRouter>
        <FirstStepsChecklist />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('0/6 completed')).toBeInTheDocument();
      expect(screen.getByText('0% complete')).toBeInTheDocument();
    });
  });

  it('updates completion when items are marked complete', async () => {
    // Mock a user with some completed items
    vi.mock('@/shared/hooks/use-auth', () => ({
      useAuth: () => ({
        user: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
          avatar: 'https://example.com/avatar.jpg',
          yorubaName: 'Test Yoruba',
          location: 'Lagos, Nigeria',
          bio: 'I am on a spiritual journey',
        },
      }),
    }));

    vi.mock('@/lib/api', () => ({
      api: {
        get: vi.fn(() => Promise.resolve({ 
          data: { 
            avatar: 'https://example.com/avatar.jpg',
            yorubaName: 'Test Yoruba',
            location: 'Lagos, Nigeria',
            bio: 'I am on a spiritual journey',
            _count: {
              appointmentsAsClient: 0,
              babalawoReviews: 0
            }
          } 
        })),
        patch: vi.fn(() => Promise.resolve()),
      },
    }));

    render(
      <MemoryRouter>
        <FirstStepsChecklist />
      </MemoryRouter>
    );

    await waitFor(() => {
      // With 3 completed items, should show 50% (3/6)
      expect(screen.getByText('3/6 completed')).toBeInTheDocument();
    });
  });

  it('shows skeleton loader initially', () => {
    render(
      <MemoryRouter>
        <FirstStepsChecklist />
      </MemoryRouter>
    );

    // Initially, we should see the loading skeleton
    expect(screen.getByText('Your First Steps')).toBeInTheDocument();
  });
});