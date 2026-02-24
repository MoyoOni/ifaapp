import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Filter, Loader2, User, Building2, Package, GraduationCap } from 'lucide-react';
import api from '@/lib/api';

interface SearchResult {
  type: string;
  id: string;
  name?: string;
  yorubaName?: string;
  title?: string;
  [key: string]: any;
}

interface AdvancedSearchProps {
  onResultSelect?: (result: SearchResult) => void;
}

/**
 * Advanced Search Component
 * Multi-facet search with autocomplete and Yoruba diacritics support
 */
const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ onResultSelect }) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    types: ['babalawos', 'temples', 'products', 'courses'] as string[],
    location: '',
    category: '',
    verified: true,
  });

  // Debounced search
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Get suggestions
  const { data: suggestions = [] } = useQuery({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      const response = await api.get('/search/suggestions', {
        params: { q: debouncedQuery, limit: 5 },
      });
      return response.data;
    },
    enabled: debouncedQuery.length >= 2,
  });

  // Perform search
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery, filters],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return { results: [], suggestions: [] };
      const response = await api.get('/search', {
        params: {
          q: debouncedQuery,
          types: filters.types.join(','),
          location: filters.location || undefined,
          category: filters.category || undefined,
          verified: filters.verified,
        },
      });
      return response.data;
    },
    enabled: debouncedQuery.length >= 2,
  });

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'babalawo':
        return <User size={20} className="text-blue-400" />;
      case 'temple':
        return <Building2 size={20} className="text-purple-400" />;
      case 'product':
        return <Package size={20} className="text-green-400" />;
      case 'course':
        return <GraduationCap size={20} className="text-highlight" />;
      default:
        return <Search size={20} />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Babalawos, Temples, Products, Courses..."
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-12 pr-12 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        )}

        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && query.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-white/10 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
            {suggestions.map((suggestion: any, index: number) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(suggestion.text);
                  setDebouncedQuery(suggestion.text);
                }}
                className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3"
              >
                {getResultIcon(suggestion.type)}
                <span className="text-white">{suggestion.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-colors"
        >
          <Filter size={18} />
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
              Search Types
            </label>
            <div className="flex flex-wrap gap-3">
              {['babalawos', 'temples', 'products', 'courses', 'circles', 'events'].map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.types.includes(type)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFilters({ ...filters, types: [...filters.types, type] });
                      } else {
                        setFilters({ ...filters, types: filters.types.filter((t) => t !== type) });
                      }
                    }}
                    className="text-highlight focus:ring-highlight"
                  />
                  <span className="text-white capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
                Location
              </label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                placeholder="City, State, Country"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-muted uppercase tracking-widest mb-2">
                Category
              </label>
              <input
                type="text"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                placeholder="Category"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="verified"
              checked={filters.verified}
              onChange={(e) => setFilters({ ...filters, verified: e.target.checked })}
              className="text-highlight focus:ring-highlight"
            />
            <label htmlFor="verified" className="text-white cursor-pointer">
              Verified only
            </label>
          </div>
        </div>
      )}

      {/* Search Results */}
      {isLoading && debouncedQuery.length >= 2 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-highlight" />
        </div>
      )}

      {searchResults && searchResults.results && searchResults.results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">
            Results ({searchResults.results.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.results.map((result: SearchResult) => (
              <div
                key={`${result.type}-${result.id}`}
                onClick={() => onResultSelect && onResultSelect(result)}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-highlight transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-2">
                  {getResultIcon(result.type)}
                  <span className="text-xs text-muted uppercase">{result.type}</span>
                </div>
                <h4 className="text-lg font-bold text-white mb-1">
                  {result.yorubaName || result.name || result.title}
                </h4>
                {result.yorubaName && result.name && (
                  <p className="text-sm text-muted">{result.name}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {searchResults && searchResults.results && searchResults.results.length === 0 && debouncedQuery.length >= 2 && (
        <div className="text-center py-12 text-muted">
          <Search size={48} className="mx-auto mb-4 opacity-50" />
          <p>No results found</p>
          <p className="text-sm mt-2">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
