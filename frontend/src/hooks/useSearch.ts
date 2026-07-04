import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import SearchService, { SearchFilters } from '@/services/searchService';

/**
 * Hook for search functionality
 */
export const useSearch = (initialQuery: string = '') => {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Load search history on mount
  useEffect(() => {
    SearchService.loadHistory();
  }, []);

  // Fetch search results
  const { data, isLoading, error } = useQuery({
    queryKey: ['search', debouncedQuery, filters],
    queryFn: () =>
      debouncedQuery
        ? SearchService.search(debouncedQuery, filters)
        : Promise.resolve({
            query: '',
            results: [],
            totalCount: 0,
            executionTime: 0,
            filters,
          }),
    enabled: debouncedQuery.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch suggestions
  const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: () => (query ? SearchService.getSuggestions(query) : Promise.resolve([])),
    enabled: query.length > 2,
    staleTime: 30 * 60 * 1000,
  });

  // Fetch trending
  const { data: trending } = useQuery({
    queryKey: ['search-trending'],
    queryFn: () => SearchService.getTrending(),
    staleTime: 60 * 60 * 1000,
  });

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const getHistory = useCallback(() => {
    return SearchService.getHistory();
  }, []);

  const clearHistory = useCallback(() => {
    SearchService.clearHistory();
  }, []);

  return {
    query,
    setQuery,
    filters,
    updateFilters,
    clearFilters,
    results: data?.results || [],
    totalCount: data?.totalCount || 0,
    isLoading,
    error,
    suggestions: suggestions || [],
    suggestionsLoading,
    trending: trending || [],
    history: getHistory(),
    clearHistory,
    executionTime: data?.executionTime || 0,
  };
};

export default useSearch;
