import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useSearch } from '../../contexts/search-context';

interface SearchInputProps {
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  onSearchComplete?: () => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ 
  placeholder = 'Search temples, babalawos, courses...', 
  autoFocus = false, 
  className = '', 
  onSearchComplete 
}) => {
  const { query, performSearch, clearSearch, isLoading } = useSearch();
  const [localQuery, setLocalQuery] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update local query when context query changes
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      performSearch(localQuery.trim());
      onSearchComplete?.();
    }
  };

  const clearInput = () => {
    setLocalQuery('');
    clearSearch();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
  };

  return (
    <form data-testid="search-form" onSubmit={handleSearch} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          {isLoading ? (
            <div className="w-5 h-5 flex items-center justify-center">
              <div className="animate-spin rounded-full h-3 w-3 border border-t-transparent border-gray-400"></div>
            </div>
          ) : (
            <Search className="w-5 h-5 text-gray-500" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={handleInputChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
        {localQuery && (
          <button
            type="button"
            onClick={clearInput}
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            aria-label="Clear search" // Added aria-label for accessibility
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center"
          aria-label="Search"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          ) : (
            <Search className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>
    </form>
  );
};

export default SearchInput;