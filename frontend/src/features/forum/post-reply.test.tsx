import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts/theme-context';
import PostReply from './post-reply';

// Mock the API module
jest.mock('../../services/api', () => ({
  forumApi: {
    createPost: jest.fn(),
  },
}));

const { forumApi } = require('../../services/api');

describe('PostReply Component', () => {
  const mockThreadId = 'thread1';
  const mockParentPostId = 'post1';

  beforeEach(() => {
    (forumApi.createPost as jest.MockedFunction<typeof forumApi.createPost>).mockResolvedValue({
      id: 'new-post',
      content: 'This is a reply',
      author: {
        id: 'user1',
        firstName: 'Test',
        lastName: 'User',
        avatar: '',
        isVerified: false,
      },
      createdAt: new Date().toISOString(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders reply form correctly', () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <PostReply threadId={mockThreadId} parentPostId={mockParentPostId} />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByPlaceholderText(/write your reply/i)).toBeInTheDocument();
    expect(screen.getByText(/post reply/i)).toBeInTheDocument();
  });

  it('validates content field', async () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <PostReply threadId={mockThreadId} parentPostId={mockParentPostId} />
        </MemoryRouter>
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText(/post reply/i));

    await waitFor(() => {
      expect(screen.getByText(/content is required/i)).toBeInTheDocument();
    });
  });

  it('submits reply with valid content', async () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <PostReply threadId={mockThreadId} parentPostId={mockParentPostId} />
        </MemoryRouter>
      </ThemeProvider>
    );

    fireEvent.change(screen.getByPlaceholderText(/write your reply/i), { target: { value: 'This is a reply' } });
    fireEvent.click(screen.getByText(/post reply/i));

    await waitFor(() => {
      expect(forumApi.createPost).toHaveBeenCalledWith({
        content: 'This is a reply',
        threadId: mockThreadId,
        parentId: mockParentPostId,
      });
    });

    expect(screen.getByText(/reply posted successfully/i)).toBeInTheDocument();
  });

  it('shows error on submission failure', async () => {
    (forumApi.createPost as jest.MockedFunction<typeof forumApi.createPost>).mockRejectedValue(
      new Error('Failed to post reply')
    );

    render(
      <ThemeProvider>
        <MemoryRouter>
          <PostReply threadId={mockThreadId} parentPostId={mockParentPostId} />
        </MemoryRouter>
      </ThemeProvider>
    );

    fireEvent.change(screen.getByPlaceholderText(/write your reply/i), { target: { value: 'This is a reply' } });
    fireEvent.click(screen.getByText(/post reply/i));

    await waitFor(() => {
      expect(screen.getByText(/failed to post reply/i)).toBeInTheDocument();
    });
  });

  it('clears input after successful submission', async () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <PostReply threadId={mockThreadId} parentPostId={mockParentPostId} />
        </MemoryRouter>
      </ThemeProvider>
    );

    const input = screen.getByPlaceholderText(/write your reply/i);
    fireEvent.change(input, { target: { value: 'This is a reply' } });
    fireEvent.click(screen.getByText(/post reply/i));

    await waitFor(() => {
      expect((input as HTMLInputElement).value).toBe('');
    });
  });
});