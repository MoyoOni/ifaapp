import React, { useState } from 'react';
import SearchInput from './search-input';
import SearchResultsPanel from './search-results-panel';

interface SearchBarProps {
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  placeholder = 'Search temples, babalawos, courses...', 
  autoFocus = false, 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSearchComplete = () => {
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow for clicks on results
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className={`relative inline-block w-full ${className}`}>
      <div onFocus={handleInputFocus} onBlur={handleInputBlur}>
        <SearchInput 
          placeholder={placeholder} 
          autoFocus={autoFocus}
          onSearchComplete={handleSearchComplete}
        />
        {isOpen && <SearchResultsPanel />}
      </div>
    </div>
  );
};

export default SearchBar;