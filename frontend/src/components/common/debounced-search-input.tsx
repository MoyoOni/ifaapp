import React, { useState } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DebouncedSearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
  delay?: number;
  autoFocus?: boolean;
}

const DebouncedSearchInput: React.FC<DebouncedSearchInputProps> = ({
  placeholder = 'Search...',
  onSearch,
  className,
  delay = 300,
  autoFocus = false
}) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, delay);

  // Call the onSearch callback when the debounced query changes
  React.useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const clearQuery = () => {
    setQuery('');
    onSearch(''); // Clear the search when clearing the input
  };

  return (
    <div className={cn("relative", className)}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="w-5 h-5 text-muted-foreground" />
      </div>
      
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-10 pr-10 py-2 text-sm text-foreground border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        autoFocus={autoFocus}
      />
      
      {query && (
        <button
          type="button"
          onClick={clearQuery}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export { DebouncedSearchInput };