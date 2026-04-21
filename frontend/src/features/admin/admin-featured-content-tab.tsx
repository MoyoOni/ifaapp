import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Star, StarOff, Search, MessageSquare, ShoppingBag, BookOpen, Users } from 'lucide-react';

const fmt = new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' });

type ContentType = 'thread' | 'product' | 'course' | 'circle';

interface FeaturedItem {
  id: string;
  title?: string;
  name?: string;
  featuredUntil: string | null;
  createdAt: string;
  author?: { name: string };
  vendor?: { businessName: string };
  instructor?: { name: string };
  creator?: { name: string };
  isFeatured?: boolean;
}

interface FeaturedContent {
  threads: FeaturedItem[];
  products: FeaturedItem[];
  courses: FeaturedItem[];
  circles: FeaturedItem[];
}

interface SearchResult extends FeaturedItem {
  isFeatured: boolean;
}

const CONTENT_TYPES: { id: ContentType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'thread', label: 'Threads', icon: MessageSquare },
  { id: 'product', label: 'Products', icon: ShoppingBag },
  { id: 'course', label: 'Courses', icon: BookOpen },
  { id: 'circle', label: 'Circles', icon: Users },
];

function itemLabel(item: FeaturedItem) {
  return item.title ?? item.name ?? '—';
}

function itemOwner(item: FeaturedItem) {
  return (
    item.author?.name ??
    item.vendor?.businessName ??
    item.instructor?.name ??
    item.creator?.name ??
    '—'
  );
}

function FeaturedRow({
  item,
  type,
  onToggle,
  isPending,
}: {
  item: FeaturedItem;
  type: ContentType;
  onToggle: (id: string, type: ContentType, featured: boolean, until: string | null) => void;
  isPending: boolean;
}) {
  const [showUntil, setShowUntil] = useState(false);
  const [untilDate, setUntilDate] = useState(
    item.featuredUntil ? item.featuredUntil.slice(0, 10) : '',
  );
  const featured = item.isFeatured !== undefined ? item.isFeatured : true;

  return (
    <div className="flex items-center justify-between gap-4 py-3 px-4 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{itemLabel(item)}</p>
        <p className="text-sm text-muted-foreground">{itemOwner(item)}</p>
      </div>
      <div className="text-sm text-muted-foreground whitespace-nowrap">
        {item.featuredUntil ? `Until ${fmt.format(new Date(item.featuredUntil))}` : 'No expiry'}
      </div>
      <div className="flex items-center gap-2">
        {showUntil && (
          <input
            type="date"
            aria-label="Feature until date"
            className="border border-border rounded px-2 py-1 text-sm bg-card text-foreground"
            value={untilDate}
            onChange={(e) => setUntilDate(e.target.value)}
          />
        )}
        <button
          type="button"
          className="text-sm text-muted-foreground underline"
          onClick={() => setShowUntil((v) => !v)}
        >
          {showUntil ? 'hide' : 'set expiry'}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            onToggle(item.id, type, !featured, showUntil && untilDate ? untilDate : null)
          }
          className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
            featured
              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              : 'bg-card border border-border hover:bg-highlight text-foreground'
          }`}
        >
          {featured ? (
            <>
              <StarOff className="w-3.5 h-3.5" /> Unfeature
            </>
          ) : (
            <>
              <Star className="w-3.5 h-3.5" /> Feature
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function AdminFeaturedContentTab() {
  const qc = useQueryClient();
  const [activeType, setActiveType] = useState<ContentType>('thread');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const { data: featured, isLoading } = useQuery<FeaturedContent>({
    queryKey: ['admin', 'featured-content'],
    queryFn: () => api.get('/admin/featured-content').then((r) => r.data),
  });

  const { data: searchResults } = useQuery<SearchResult[]>({
    queryKey: ['admin', 'featured-search', activeType, debouncedQ],
    queryFn: () =>
      api
        .get('/admin/featured-content/search', { params: { type: activeType, q: debouncedQ } })
        .then((r) => r.data),
    enabled: debouncedQ.length >= 2,
  });

  const toggle = useMutation({
    mutationFn: ({
      id,
      type,
      featured: feat,
      featuredUntil,
    }: {
      id: string;
      type: ContentType;
      featured: boolean;
      featuredUntil: string | null;
    }) =>
      api.patch(`/admin/featured-content/${type}/${id}`, { featured: feat, featuredUntil }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'featured-content'] });
      qc.invalidateQueries({ queryKey: ['admin', 'featured-search'] });
    },
  });

  function handleToggle(
    id: string,
    type: ContentType,
    feat: boolean,
    featuredUntil: string | null,
  ) {
    toggle.mutate({ id, type, featured: feat, featuredUntil });
  }

  function handleSearch(q: string) {
    setSearchQuery(q);
    if (searchTimer) clearTimeout(searchTimer);
    setSearchTimer(setTimeout(() => setDebouncedQ(q), 400));
  }

  const currentFeatured: FeaturedItem[] = featured
    ? {
        thread: featured.threads,
        product: featured.products,
        course: featured.courses,
        circle: featured.circles,
      }[activeType]
    : [];

  const totalFeatured =
    (featured?.threads.length ?? 0) +
    (featured?.products.length ?? 0) +
    (featured?.courses.length ?? 0) +
    (featured?.circles.length ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Featured Content</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Surface the best community content across the platform. Currently {totalFeatured} item
          {totalFeatured !== 1 ? 's' : ''} featured.
        </p>
      </div>

      {/* Type tabs */}
      <div className="flex gap-2 border-b border-border">
        {CONTENT_TYPES.map(({ id, label, icon: Icon }) => {
          const count = featured
            ? { thread: featured.threads, product: featured.products, course: featured.courses, circle: featured.circles }[id].length
            : 0;
          return (
            <button
              key={id}
              onClick={() => {
                setActiveType(id);
                setSearchQuery('');
                setDebouncedQ('');
              }}
              type="button"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeType === id
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {count > 0 && (
                <span className="bg-amber-100 text-amber-800 text-xs px-1.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={`Search ${activeType}s to feature…`}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-border rounded bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
        />
      </div>

      {/* Search results */}
      {debouncedQ.length >= 2 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-highlight border-b border-border text-sm font-medium text-muted-foreground">
            Search results
          </div>
          {!searchResults || searchResults.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No results found</p>
          ) : (
            searchResults.map((item) => (
              <FeaturedRow
                key={item.id}
                item={item}
                type={activeType}
                onToggle={handleToggle}
                isPending={toggle.isPending}
              />
            ))
          )}
        </div>
      )}

      {/* Currently featured */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-highlight flex items-center justify-between">
          <span className="font-medium text-sm">
            Currently Featured {CONTENT_TYPES.find((t) => t.id === activeType)?.label}
          </span>
          {currentFeatured.length > 0 && (
            <span className="text-xs text-muted-foreground">{currentFeatured.length} item{currentFeatured.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        {isLoading ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : currentFeatured.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No featured {activeType}s. Use the search above to feature content.
          </p>
        ) : (
          currentFeatured.map((item) => (
            <FeaturedRow
              key={item.id}
              item={{ ...item, isFeatured: true }}
              type={activeType}
              onToggle={handleToggle}
              isPending={toggle.isPending}
            />
          ))
        )}
      </div>
    </div>
  );
}
