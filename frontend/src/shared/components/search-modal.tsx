import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, User, Building2, ShoppingBag, GraduationCap, Users, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { cn } from '@/lib/utils';

interface SearchResult {
  type: 'babalawo' | 'temple' | 'product' | 'course' | 'circle' | 'event';
  id: string;
  name?: string;
  title?: string;
  yorubaName?: string;
  slug?: string;
  avatar?: string;
  logo?: string;
  verified?: boolean;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  babalawo: User,
  temple: Building2,
  product: ShoppingBag,
  course: GraduationCap,
  circle: Users,
  event: Calendar,
};

const TYPE_LABELS: Record<string, string> = {
  babalawo: 'Babalawo',
  temple: 'Temple',
  product: 'Product',
  course: 'Course',
  circle: 'Circle',
  event: 'Event',
};

function getResultPath(result: SearchResult): string {
  switch (result.type) {
    case 'babalawo': return `/profile/${result.id}`;
    case 'temple': return `/temples/${result.slug || result.id}`;
    case 'product': return `/marketplace/${result.id}`;
    case 'course': return `/academy/course/${result.id}`;
    case 'circle': return `/circles/${result.slug || result.id}`;
    case 'event': return `/events/${result.slug || result.id}`;
    default: return '/';
  }
}

export const SearchModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await api.get('/search', {
          params: { q: query, limit: 10 },
        });
        setResults(response.data.results || []);
        setSelectedIndex(0);
      } catch (err) {
        logger.error('Search failed', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback((result: SearchResult) => {
    navigate(getResultPath(result));
    onClose();
  }, [navigate, onClose]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [results, selectedIndex, handleSelect, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={20} className="text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search babalawos, temples, products, courses..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted rounded border border-border">
            ESC
          </kbd>
          <button type="button" aria-label="Close search" onClick={onClose} className="sm:hidden text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {loading && (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">Searching...</div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
              No results for "{query}"
            </div>
          )}

          {!loading && results.length > 0 && (
            <ul className="py-2">
              {results.map((result, index) => {
                const Icon = TYPE_ICONS[result.type] || Search;
                const displayName = result.name || result.title || 'Untitled';
                return (
                  <li key={`${result.type}-${result.id}`}>
                    <button
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                        index === selectedIndex
                          ? "bg-primary/10 text-foreground"
                          : "text-muted-foreground hover:bg-secondary/10"
                      )}
                    >
                      <Icon size={16} className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium text-foreground">{displayName}</div>
                        {result.yorubaName && (
                          <div className="truncate text-xs text-muted-foreground">{result.yorubaName}</div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                        {TYPE_LABELS[result.type] || result.type}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {!loading && query.length < 2 && (
            <div className="px-4 py-6 text-center text-muted-foreground text-xs">
              Type at least 2 characters to search
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 bg-muted rounded border border-border font-mono">↑↓</kbd> navigate</span>
            <span><kbd className="px-1 py-0.5 bg-muted rounded border border-border font-mono">↵</kbd> select</span>
          </div>
          <span>
            <kbd className="px-1 py-0.5 bg-muted rounded border border-border font-mono">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
};
