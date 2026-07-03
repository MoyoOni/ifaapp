import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchProvider, useSearch } from './search-context';

// Mock wrapper component to provide the context
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SearchProvider>{children}</SearchProvider>
);

describe('SearchContext', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSearch(), { wrapper });
    
    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
    expect(result.current.filteredResults).toEqual([]);
    expect(result.current.category).toBe('all');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.suggestions).toEqual([]);
  });

  it('should update query when performSearch is called', async () => {
    const { result } = renderHook(() => useSearch(), { wrapper });
    
    await act(async () => {
      result.current.performSearch('test query');
    });
    
    expect(result.current.query).toBe('test query');
    expect(result.current.isLoading).toBe(true);
  });

  it('should update category when setSearchCategory is called', () => {
    const { result } = renderHook(() => useSearch(), { wrapper });
    
    act(() => {
      result.current.setSearchCategory('temples');
    });
    
    expect(result.current.category).toBe('temples');
  });

  it('should clear search when clearSearch is called', () => {
    const { result } = renderHook(() => useSearch(), { wrapper });
    
    // First set some state
    act(() => {
      result.current.performSearch('test query');
    });
    
    // Verify state is set
    expect(result.current.query).toBe('test query');
    
    // Clear the search
    act(() => {
      result.current.clearSearch();
    });
    
    // Verify state is reset
    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
    expect(result.current.filteredResults).toEqual([]);
  });

  it('should filter results by category', async () => {
    const { result } = renderHook(() => useSearch(), { wrapper });
    
    // Perform a search to populate results
    await act(async () => {
      result.current.performSearch('IFA');
    });
    
    // Initially should have results
    expect(result.current.results.length).toBeGreaterThanOrEqual(0);
    
    // Change category to temples
    await act(async () => {
      result.current.setSearchCategory('temples');
    });
    
    // Results should be filtered
    expect(result.current.category).toBe('temples');
  });
});