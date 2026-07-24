import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Define types for search
export type SearchCategory = 'all' | 'temples' | 'babalawos' | 'circles' | 'products' | 'courses' | 'events' | 'articles';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category: SearchCategory;
  url: string;
  thumbnail?: string;
  metadata?: Record<string, any>;
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  filteredResults: SearchResult[];
  category: SearchCategory;
  isLoading: boolean;
  error?: string;
  suggestions: string[];
}

type SearchAction =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_RESULTS'; payload: SearchResult[] }
  | { type: 'SET_CATEGORY'; payload: SearchCategory }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_SUGGESTIONS'; payload: string[] }
  | { type: 'CLEAR_SEARCH' };

const initialState: SearchState = {
  query: '',
  results: [],
  filteredResults: [],
  category: 'all',
  isLoading: false,
  suggestions: [],
};

const searchReducer = (state: SearchState, action: SearchAction): SearchState => {
  switch (action.type) {
    case 'SET_QUERY':
      return {
        ...state,
        query: action.payload,
        // Filter results based on query if we have results
        filteredResults: state.results.filter(item =>
          item.title.toLowerCase().includes(action.payload.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(action.payload.toLowerCase()))
        )
      };
    case 'SET_RESULTS':
      return {
        ...state,
        results: action.payload,
        filteredResults: state.category === 'all' 
          ? action.payload.filter(item => 
              item.title.toLowerCase().includes(state.query.toLowerCase()) ||
              (item.description && item.description.toLowerCase().includes(state.query.toLowerCase()))
            )
          : action.payload.filter(item => 
              item.category === state.category &&
              (item.title.toLowerCase().includes(state.query.toLowerCase()) || 
               (item.description && item.description.toLowerCase().includes(state.query.toLowerCase())))
            )
      };
    case 'SET_CATEGORY':
      return {
        ...state,
        category: action.payload,
        filteredResults: action.payload === 'all' 
          ? state.results.filter(item => 
              item.title.toLowerCase().includes(state.query.toLowerCase()) ||
              (item.description && item.description.toLowerCase().includes(state.query.toLowerCase()))
            )
          : state.results.filter(item => 
              item.category === action.payload &&
              (item.title.toLowerCase().includes(state.query.toLowerCase()) || 
               (item.description && item.description.toLowerCase().includes(state.query.toLowerCase())))
            )
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.payload };
    case 'CLEAR_SEARCH':
      return { 
        ...initialState,
        suggestions: state.suggestions // Keep suggestions when clearing search
      };
    default:
      return state;
  }
};

interface SearchContextProps extends SearchState {
  performSearch: (query: string, category?: SearchCategory) => void;
  setSearchCategory: (category: SearchCategory) => void;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextProps | undefined>(undefined);

interface SearchProviderProps {
  children: ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(searchReducer, initialState);

  const performSearch = async (query: string, category?: SearchCategory) => {
    dispatch({ type: 'SET_QUERY', payload: query });
    
    if (category) {
      dispatch({ type: 'SET_CATEGORY', payload: category });
    }
    
    if (!query.trim()) {
      dispatch({ type: 'SET_RESULTS', payload: [] });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // In a real app, this would be an API call to your search endpoint
      // For now, we'll simulate search results
      setTimeout(() => {
        const mockResults: SearchResult[] = [
          {
            id: '1',
            title: 'Iluase Spiritual Center',
            description: 'A traditional IFA spiritual center led by experienced babalawos',
            category: 'temples',
            url: '/temples/iluase-center'
          },
          {
            id: '2',
            title: 'Chief Adebowale',
            description: 'Experienced babalawo specializing in guidance and divination',
            category: 'babalawos',
            url: '/profile/adebowale'
          },
          {
            id: '3',
            title: 'Healing Circles Community',
            description: 'Join our weekly healing circles for spiritual growth',
            category: 'circles',
            url: '/circles/healing-circles'
          },
          {
            id: '5',
            title: 'Introduction to IFA Course',
            description: 'Learn the fundamentals of Ifa with experienced teachers',
            category: 'courses',
            url: '/academy/course/intro-to-ifa'
          },
          {
            id: '6',
            title: 'Annual IFA Festival',
            description: 'Join us for our annual celebration of Ifa traditions',
            category: 'events',
            url: '/events/ifa-festival'
          }
        ];

        // Filter results based on the search term
        const filtered = mockResults.filter(item => 
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(query.toLowerCase())) ||
          item.category.includes(query.toLowerCase())
        );

        // Further filter by category if specified
        const categoryFiltered = category && category !== 'all' 
          ? filtered.filter(item => item.category === category)
          : filtered;

        dispatch({ type: 'SET_RESULTS', payload: categoryFiltered });
        dispatch({ type: 'SET_LOADING', payload: false });
      }, 300); // Simulate API delay
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Search failed. Please try again.' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const setSearchCategory = (category: SearchCategory) => {
    dispatch({ type: 'SET_CATEGORY', payload: category });
    
    // Re-filter results based on new category
    if (state.query) {
      const filtered = state.results.filter(item => 
        item.category === category &&
        (item.title.toLowerCase().includes(state.query.toLowerCase()) || 
         (item.description && item.description.toLowerCase().includes(state.query.toLowerCase())))
      );
      dispatch({ type: 'SET_RESULTS', payload: filtered });
    }
  };

  const clearSearch = () => {
    dispatch({ type: 'CLEAR_SEARCH' });
  };

  return (
    <SearchContext.Provider
      value={{
        ...state,
        performSearch,
        setSearchCategory,
        clearSearch
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = (): SearchContextProps => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};