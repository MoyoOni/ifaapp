import React from 'react';
import { useSearch, SearchCategory } from '../../contexts/search-context';
import { Globe, Users, UsersRound, ShoppingCart, BookOpen, Calendar, FileText } from 'lucide-react';

const categoryIcons: Record<SearchCategory, React.ReactNode> = {
  all: <Globe className="w-4 h-4" />,
  temples: <Globe className="w-4 h-4" />,
  babalawos: <Users className="w-4 h-4" />,
  circles: <UsersRound className="w-4 h-4" />,
  products: <ShoppingCart className="w-4 h-4" />,
  courses: <BookOpen className="w-4 h-4" />,
  events: <Calendar className="w-4 h-4" />,
  articles: <FileText className="w-4 h-4" />
};

const categoryLabels: Record<SearchCategory, string> = {
  all: 'All',
  temples: 'Temples',
  babalawos: 'Babalawos',
  circles: 'Circles',
  products: 'Products',
  courses: 'Courses',
  events: 'Events',
  articles: 'Articles'
};

const SearchResultsPanel: React.FC = () => {
  const { filteredResults, query, isLoading, error } = useSearch();

  if (!query) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto">
        <div className="p-4 flex justify-center items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-lg shadow-lg">
        <div className="p-4 text-red-500 dark:text-red-400">{error}</div>
      </div>
    );
  }

  if (filteredResults.length === 0 && query) {
    return (
      <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <div className="p-4 text-gray-500 dark:text-gray-400">No results found for "{query}"</div>
      </div>
    );
  }

  return (
    <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto">
      <div className="p-2">
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Search Results ({filteredResults.length})
        </div>
        {filteredResults.map((result) => (
          <a
            key={result.id}
            href={result.url}
            className="flex items-start p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span className="mr-3 text-blue-500 dark:text-blue-400 mt-0.5">
              {categoryIcons[result.category]}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-white truncate">{result.title}</div>
              {result.description && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {result.description}
                </div>
              )}
              <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {categoryLabels[result.category]}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default SearchResultsPanel;