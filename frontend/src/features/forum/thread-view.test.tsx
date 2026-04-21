import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts/theme-context';
import ThreadView from './thread-view';

// Mock the API module
jest.mock('../../services/api', () => ({
  forumApi: {
    getThread: jest.fn(),
    createPost: jest.fn(),
    updatePost: jest.fn(),
    deletePost: jest.fn(),
  },
}));

const { forumApi } = require('../../services/api');

describe('ThreadView Component', () => {
  const mockThread = {
    id: 'thread1',
    title: 'Test Thread',
    content: 'This is a test thread',
    author: {
      id: 'author1',
      firstName: 'Test',
      lastName: 'Author',
      avatar: '',
      isVerified: true,
    },
    category: { id: 'cat1', name: 'General' },
    createdAt: new Date().toISOString(),
    posts: [
      {
        id: 'post1',
        content: 'This is a test post',
        author: {
          id: 'user1',
          firstName: 'Test',
          lastName: 'User',
          avatar: '',
          isVerified: false,
        },
        createdAt: new Date().toISOString(),
      },
    ],
  };

  beforeEach(() => {
    (forumApi.getThread as jest.MockedFunction<typeof forumApi.getThread>).mockResolvedValue(mockThread);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders thread details correctly', async () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <ThreadView />
        </MemoryRouter>
      </ThemeProvider>
    );

    // Wait for the thread to load
    await waitFor(() => {
      expect(screen.getByText('Test Thread')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Thread')).toBeInTheDocument();
    expect(screen.getByText('This is a test thread')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });

  it('loads and displays posts', async () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <ThreadView />
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('This is a test post')).toBeInTheDocument();
    });

    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <ThreadView />
        </MemoryRouter>
      </ThemeProvider>
    );

    // Check if loading indicator is present before data loads
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    (forumApi.getThread as jest.MockedFunction<typeof forumApi.getThread>).mockRejectedValue(new Error('Failed to load thread'));

    render(
      <ThemeProvider>
        <MemoryRouter>
          <ThreadView />
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});