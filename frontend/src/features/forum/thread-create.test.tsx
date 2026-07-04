import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts/theme-context';
import ThreadCreate from './thread-create';
import { forumApi } from '../../services/api';

// Mock the API module
jest.mock('../../services/api', () => ({
  forumApi: {
    createThread: jest.fn(),
    getCategories: jest.fn(),
  },
}));


describe('ThreadCreate Component', () => {
  beforeEach(() => {
    (forumApi.getCategories as jest.MockedFunction<typeof forumApi.getCategories>).mockResolvedValue([
      { id: 'cat1', name: 'General', description: 'General discussions' },
      { id: 'cat2', name: 'Spirituality', description: 'Spiritual discussions' },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields correctly', () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <ThreadCreate />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
    expect(screen.getByText(/create thread/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <ThreadCreate />
        </MemoryRouter>
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText(/create thread/i));

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/content is required/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    (forumApi.createThread as jest.MockedFunction<typeof forumApi.createThread>).mockResolvedValue({
      id: 'new-thread',
      title: 'New Thread',
      content: 'Thread content',
      authorId: 'user1',
    });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <ThreadCreate />
        </MemoryRouter>
      </ThemeProvider>
    );

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New Thread' } });
    fireEvent.change(screen.getByLabelText(/content/i), { target: { value: 'Thread content' } });
    fireEvent.change(screen.getByTestId('category-select'), { target: { value: 'cat1' } });

    fireEvent.click(screen.getByText(/create thread/i));

    await waitFor(() => {
      expect(forumApi.createThread).toHaveBeenCalledWith({
        title: 'New Thread',
        content: 'Thread content',
        categoryId: 'cat1',
        visibility: 'PUBLIC',
      });
    });

    expect(screen.getByText(/thread created successfully/i)).toBeInTheDocument();
  });

  it('shows error message on submission failure', async () => {
    (forumApi.createThread as jest.MockedFunction<typeof forumApi.createThread>).mockRejectedValue(
      new Error('Failed to create thread')
    );

    render(
      <ThemeProvider>
        <MemoryRouter>
          <ThreadCreate />
        </MemoryRouter>
      </ThemeProvider>
    );

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New Thread' } });
    fireEvent.change(screen.getByLabelText(/content/i), { target: { value: 'Thread content' } });
    fireEvent.change(screen.getByTestId('category-select'), { target: { value: 'cat1' } });

    fireEvent.click(screen.getByText(/create thread/i));

    await waitFor(() => {
      expect(screen.getByText(/failed to create thread/i)).toBeInTheDocument();
    });
  });

  it('loads categories on mount', async () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <ThreadCreate />
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('category-select')).toBeInTheDocument();
    });

    const select = screen.getByTestId('category-select');
    expect(select.children.length).toBe(3); // 2 options + 1 placeholder
  });
});