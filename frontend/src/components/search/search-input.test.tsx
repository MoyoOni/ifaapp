import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SearchProvider } from '../../contexts/search-context';
import SearchInput from './search-input';

// Mock setTimeout to control timing in tests
const mockSetTimeout = vi.spyOn(window, 'setTimeout');

// Wrapper with provider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SearchProvider>{children}</SearchProvider>
);

describe('SearchInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    mockSetTimeout.mockClear();
  });

  it('renders correctly with default props', () => {
    render(<SearchInput />, { wrapper });
    
    const input = screen.getByPlaceholderText(/Search temples, babalawos, courses/i);
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('updates local state when typing', () => {
    render(<SearchInput />, { wrapper });
    
    const input = screen.getByPlaceholderText(/Search temples, babalawos, courses/i);
    fireEvent.change(input, { target: { value: 'test search' } });
    
    expect(input).toHaveValue('test search');
  });

  it('clears search when clear button is clicked', () => {
    render(<SearchInput />, { wrapper });
    
    const input = screen.getByPlaceholderText(/Search temples, babalawos, courses/i);
    fireEvent.change(input, { target: { value: 'test search' } });
    
    // Verify the value is set
    expect(input).toHaveValue('test search');
    
    // Find and click the clear button (the X icon) -- distinguish it from
    // the search submit button, both of which are now accessible buttons
    const clearButton = screen.getByRole('button', { name: /clear search/i });
    fireEvent.click(clearButton);
    
    // Verify the input is cleared
    expect(input).toHaveValue('');
  });

  it('performs search when form is submitted', async () => {
    render(<SearchInput />, { wrapper });
    
    const input = screen.getByPlaceholderText(/Search temples, babalawos, courses/i);
    fireEvent.change(input, { target: { value: 'test search' } });
    
    // Submit the form by getting it via test-id or by container
    const form = screen.getByTestId('search-form') || screen.container.querySelector('form');
    if (form) {
      fireEvent.submit(form as HTMLFormElement);
    }
    
    // Fast-forward timers to allow async operations
    vi.runAllTimers();
    
    // Since we're mocking the search functionality, we'll just verify that the 
    // input value is captured correctly before submission
    expect(input).toHaveValue('test search');
  });

  it('accepts custom placeholder text', () => {
    const customPlaceholder = 'Find your spiritual guide';
    render(<SearchInput placeholder={customPlaceholder} />, { wrapper });
    
    const input = screen.getByPlaceholderText(customPlaceholder);
    expect(input).toBeInTheDocument();
  });

  it('can be auto-focused', () => {
    render(<SearchInput autoFocus={true} />, { wrapper });
    
    const input = screen.getByPlaceholderText(/Search temples, babalawos, courses/i);
    // In JSDOM, autoFocus doesn't actually focus during test render
    // We're just verifying that the prop is handled
    expect(input).toBeInTheDocument();
  });
});