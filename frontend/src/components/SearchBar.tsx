import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  Filter,
  Clock,
  Zap,
  Star,
  MapPin,
  DollarSign,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useSearch from '@/hooks/useSearch';
import SearchResultCard from './SearchResultCard';
import { seededRandomInt } from '@/shared/utils/seeded-random';
import './SearchBar.css';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  showFiltersOption?: boolean;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search spirituality, guides, courses...',
  showFiltersOption = true,
  className = '',
}) => {
  const {
    query,
    setQuery,
    filters,
    clearFilters,
    results,
    totalCount,
    isLoading,
    suggestions,
    trending,
    history,
    clearHistory,
  } = useSearch();

  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (q: string) => {
    setQuery(q);
    setIsOpen(true);
    onSearch?.(q);
  };

  const displayResults = query ? results : [];
  const displayLabel = query ? `${totalCount} results` : 'Trending';

  return (
    <div ref={searchRef} className={`search-bar-container ${className}`}>
      {/* Search Input */}
      <div className="search-input-wrapper">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="search-input"
          aria-label="Search"
        />

        {query && (
          <button
            className="search-clear"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            aria-label="Clear"
          >
            <X size={18} />
          </button>
        )}

        {showFiltersOption && (
          <button
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            title="Filters"
          >
            <Filter size={18} />
          </button>
        )}
      </div>

      {/* Filter Chips */}
      {showFilters && Object.keys(filters).length > 0 && (
        <div className="filter-chips">
          {filters.type && (
            <span className="filter-chip">
              Type: {filters.type.join(', ')}
            </span>
          )}
          {filters.minRating && (
            <span className="filter-chip">Rating: {filters.minRating}+</span>
          )}
          {filters.location && (
            <span className="filter-chip">Location: {filters.location}</span>
          )}
          <button className="filter-clear-btn" onClick={clearFilters}>
            Clear all
          </button>
        </div>
      )}

      {/* Dropdown Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="search-dropdown"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Search Results */}
            {query && results.length > 0 && (
              <div className="search-section">
                <div className="section-header">
                  <span className="section-title">{displayLabel}</span>
                  <span className="execution-time">
                    {seededRandomInt(query, 1, 100)}ms
                  </span>
                </div>

                <div className="results-list">
                  {displayResults.slice(0, 5).map(result => (
                    <SearchResultCard key={result.id} result={result} />
                  ))}
                </div>

                {totalCount > 5 && (
                  <button
                    className="view-all-btn"
                    onClick={() => onSearch?.(query)}
                  >
                    View all {totalCount} results
                  </button>
                )}
              </div>
            )}

            {/* Suggestions */}
            {query && suggestions.length > 0 && (
              <div className="search-section">
                <div className="section-title">Suggestions</div>
                <div className="suggestions-list">
                  {suggestions.map(suggestion => (
                    <button
                      key={suggestion}
                      className="suggestion-item"
                      onClick={() => handleSearch(suggestion)}
                    >
                      <Search size={16} />
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending */}
            {!query && trending.length > 0 && (
              <div className="search-section">
                <div className="section-title">
                  <Zap size={16} />
                  Trending
                </div>
                <div className="trending-list">
                  {trending.slice(0, 5).map(term => (
                    <button
                      key={term}
                      className="trending-item"
                      onClick={() => handleSearch(term)}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search History */}
            {!query && history.length > 0 && (
              <div className="search-section">
                <div className="section-header">
                  <span className="section-title">
                    <Clock size={16} />
                    Recent
                  </span>
                  <button
                    className="clear-history-btn"
                    onClick={clearHistory}
                  >
                    Clear
                  </button>
                </div>
                <div className="history-list">
                  {history.slice(0, 3).map(item => (
                    <button
                      key={item}
                      className="history-item"
                      onClick={() => handleSearch(item)}
                    >
                      <Clock size={14} />
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {query && results.length === 0 && !isLoading && (
              <div className="no-results">
                <Search size={32} />
                <p>No results for "{query}"</p>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="search-loading">
                <div className="spinner" />
                <p>Searching...</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
