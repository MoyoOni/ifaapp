/**
 * Search Service
 * Full-text search with indexing, filtering, and relevance ranking
 */

import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';

export interface SearchResult {
  id: string;
  type: 'babalawo' | 'temple' | 'course' | 'product' | 'circle' | 'event' | 'guide';
  title: string;
  description?: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  price?: number;
  location?: string;
  relevanceScore: number;
  highlights: string[];
}

export interface SearchFilters {
  type?: SearchResult['type'][];
  minRating?: number;
  maxPrice?: number;
  minPrice?: number;
  location?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  verified?: boolean;
}

export interface SearchIndex {
  query: string;
  results: SearchResult[];
  totalCount: number;
  executionTime: number;
  filters: SearchFilters;
}

class SearchService {
  private static readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  private static cache: Map<string, { data: SearchIndex; timestamp: number }> = new Map();
  private static searchHistory: string[] = [];
  private static maxHistorySize = 20;

  /**
   * Search with full-text query
   */
  static async search(
    query: string,
    filters?: SearchFilters,
    limit: number = 20,
    offset: number = 0
  ): Promise<SearchIndex> {
    const cacheKey = this.generateCacheKey(query, filters);

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const startTime = performance.now();

      const response = await api.get('/search', {
        params: {
          q: query,
          filters: JSON.stringify(filters || {}),
          limit,
          offset,
        },
      });

      const executionTime = performance.now() - startTime;

      const result: SearchIndex = {
        query,
        results: response.data.results || [],
        totalCount: response.data.totalCount || 0,
        executionTime,
        filters: filters || {},
      };

      // Cache result
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });

      // Add to search history
      this.addToHistory(query);

      return result;
    } catch (error) {
      logger.error('Search error:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions/autocomplete
   */
  static async getSuggestions(
    query: string,
    limit: number = 10
  ): Promise<string[]> {
    try {
      const response = await api.get('/search/suggestions', {
        params: { q: query, limit },
      });

      return response.data.suggestions || [];
    } catch (error) {
      logger.error('Suggestions error:', error);
      return [];
    }
  }

  /**
   * Get trending searches
   */
  static async getTrending(limit: number = 10): Promise<string[]> {
    try {
      const response = await api.get('/search/trending', {
        params: { limit },
      });

      return response.data.trending || [];
    } catch (error) {
      logger.error('Trending error:', error);
      return [];
    }
  }

  /**
   * Get search history
   */
  static getHistory(): string[] {
    return [...this.searchHistory];
  }

  /**
   * Add query to search history
   */
  private static addToHistory(query: string): void {
    // Remove if already exists
    this.searchHistory = this.searchHistory.filter(q => q !== query);

    // Add to front
    this.searchHistory.unshift(query);

    // Limit size
    if (this.searchHistory.length > this.maxHistorySize) {
      this.searchHistory.pop();
    }

    // Persist to localStorage
    try {
      localStorage.setItem('search_history', JSON.stringify(this.searchHistory));
    } catch (e) {
      logger.warn('Failed to persist search history');
    }
  }

  /**
   * Load search history from localStorage
   */
  static loadHistory(): void {
    try {
      const stored = localStorage.getItem('search_history');
      if (stored) {
        this.searchHistory = JSON.parse(stored);
      }
    } catch (e) {
      logger.warn('Failed to load search history');
    }
  }

  /**
   * Clear search history
   */
  static clearHistory(): void {
    this.searchHistory = [];
    try {
      localStorage.removeItem('search_history');
    } catch (e) {
      logger.warn('Failed to clear search history');
    }
  }

  /**
   * Calculate relevance score (client-side ranking boost)
   */
  static calculateRelevance(
    query: string,
    title: string,
    description: string,
    type: SearchResult['type']
  ): number {
    let score = 0;

    // Exact match in title: 100
    if (title.toLowerCase() === query.toLowerCase()) {
      score += 100;
    }
    // Title contains exact word: 50
    else if (
      title.toLowerCase().split(' ').some(word => word === query.toLowerCase())
    ) {
      score += 50;
    }
    // Title starts with query: 30
    else if (title.toLowerCase().startsWith(query.toLowerCase())) {
      score += 30;
    }
    // Query appears in title: 20
    else if (title.toLowerCase().includes(query.toLowerCase())) {
      score += 20;
    }

    // Description contains query: 5
    if (description?.toLowerCase().includes(query.toLowerCase())) {
      score += 5;
    }

    // Type boost
    const typeBoosts: Record<SearchResult['type'], number> = {
      babalawo: 15,
      temple: 10,
      course: 10,
      product: 8,
      circle: 8,
      event: 5,
      guide: 12,
    };

    score += typeBoosts[type] || 0;

    return Math.min(score, 100);
  }

  /**
   * Generate cache key
   */
  private static generateCacheKey(query: string, filters?: SearchFilters): string {
    return `search-${query}-${JSON.stringify(filters || {})}`;
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Highlight search terms in text
   */
  static highlightMatches(text: string, query: string): string {
    if (!text || !query) return text;

    const regex = new RegExp(`(${query.split(' ').join('|')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}

export default SearchService;
