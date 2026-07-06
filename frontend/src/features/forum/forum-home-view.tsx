import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Lock, Pin, X, Flame, MessageSquare, HelpCircle, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/api';
import CreateThreadForm from './create-thread-form';
import ForumRoleBadge from './forum-role-badge';
import { useAuth } from '@/shared/hooks/use-auth';

interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  threadCount: number;
  isTeachings: boolean;
}

interface ForumThread {
  id: string;
  categoryId: string;
  authorId: string;
  title: string;
  content: string;
  tags: string[];
  status: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  postCount: number;
  lastPostAt?: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
    verified: boolean;
    role?: string;
    subscriptionStatus?: string;
    culturalLevel?: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  lastPoster?: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
  };
  _count?: {
    posts: number;
  };
}

interface ForumHomeViewProps {
  onSelectThread?: (threadId: string) => void;
  onCreateThread?: (categoryId: string) => void;
}

function relativeTime(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return '';
  }
}

/**
 * Forum Home View — Dialogue.™
 * BoxDen-style community forum for Ìlú Àṣẹ.
 * All logged-in users can start discussions.
 * Practitioners' Inner Circle is hidden from non-BABALAWO users.
 */
const PROVERBS = [
  { yoruba: 'Ọ̀rọ̀ s\'ọ̀rọ̀, ẹni t\'ó bá mọ̀ ń gbọ́', english: 'Talk to talk; whoever understands, listens.' },
  { yoruba: 'Ìwà l\'ẹwà', english: 'Character is beauty.' },
  { yoruba: 'Àgbàdo tó bá jó ẹgbẹ rẹ kò ní jẹ nìkan', english: 'The corn that burns its neighbour will not eat alone.' },
  { yoruba: 'Ojú tó rán ìmọ̀ ńkọ́ ìmọ̀', english: 'The eyes that have seen knowledge do not unlearn knowledge.' },
  { yoruba: 'Ọmọ tí a kò kọ́ ni yóò ta ilé tí a kọ́', english: 'The child we do not teach will sell the house we built.' },
  { yoruba: 'Bí a bá fẹ́ mọ ẹni tí ó tọ̀, a wo ọ̀nà rẹ̀', english: 'To know who is righteous, watch their path.' },
  { yoruba: 'Àṣẹ', english: 'So it shall be — may it come to pass.' },
  { yoruba: 'Kò sí ọba tí kò ní ìjòyè', english: 'There is no king without titled elders.' },
  { yoruba: 'Ifá ló mọ ohun tí ó dára fún ẹni', english: 'Ifá knows what is best for the person.' },
  { yoruba: 'Adìẹ kì í gbàgbé ibi tí ó ti dìgbó', english: 'The chicken never forgets where it last scratched.' },
];

interface TrendingThread {
  id: string;
  title: string;
  postCount: number;
  viewCount: number;
  _score: number;
  category: { id: string; name: string; slug: string };
  author: { name: string; yorubaName?: string };
}

interface SearchResults {
  threads: ForumThread[];
  posts: Array<{
    id: string;
    content: string;
    createdAt: string;
    author: { id: string; name: string; yorubaName?: string; avatar?: string };
    thread: { id: string; title: string; category: { id: string; name: string; slug: string } };
  }>;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

const TOUR_STEPS = [
  {
    id: 'categories',
    title: 'Explore the Community Spaces',
    body: 'Choose a category from the sidebar to filter discussions — from Ifá divination studies to music and culture.',
    placement: 'right' as const,
  },
  {
    id: 'search',
    title: 'Find Any Wisdom Instantly',
    body: 'Use the search bar to find threads, posts, and discussions across the entire forum.',
    placement: 'bottom' as const,
  },
  {
    id: 'create',
    title: 'Start Your Dialogue',
    body: '"Dialogue ✦" — press this to start a new discussion. All logged-in community members can contribute.',
    placement: 'left' as const,
  },
];

const ForumHomeView: React.FC<ForumHomeViewProps> = ({ onSelectThread, onCreateThread }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Proverb of the Day — day-based selection, dismissible per day
  const todayKey = new Date().toISOString().slice(0, 10);
  const proverbDismissed = localStorage.getItem(`forum_proverb_dismissed_${todayKey}`) === '1';
  const [proverbVisible, setProverbVisible] = useState(!proverbDismissed);
  const proverb = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return PROVERBS[dayOfYear % PROVERBS.length];
  }, []);
  const dismissProverb = () => {
    localStorage.setItem(`forum_proverb_dismissed_${todayKey}`, '1');
    setProverbVisible(false);
  };

  // Onboarding tooltip tour — desktop only, shown once per account
  const tourKey = `forum_tour_done_${user?.id ?? 'guest'}`;
  const [tourStep, setTourStep] = useState<number>(() => {
    if (typeof window === 'undefined') return -1;
    if (window.innerWidth < 768) return -1; // desktop only
    return localStorage.getItem(tourKey) ? -1 : 0;
  });
  const tourDone = tourStep === -1;
  const advanceTour = () => {
    const next = tourStep + 1;
    if (next >= TOUR_STEPS.length) {
      localStorage.setItem(tourKey, '1');
      setTourStep(-1);
    } else {
      setTourStep(next);
    }
  };
  const dismissTour = () => {
    localStorage.setItem(tourKey, '1');
    setTourStep(-1);
  };

  // Refs for tour targets
  const tourCategoryRef = useRef<HTMLDivElement>(null);
  const tourSearchRef = useRef<HTMLDivElement>(null);
  const tourCreateRef = useRef<HTMLButtonElement>(null);

  const isBabalawo = user?.role === 'BABALAWO' || user?.role === 'ADMIN';

  // Fetch categories
  const { data: rawCategories = [] } = useQuery<ForumCategory[]>({
    queryKey: ['forum-categories'],
    queryFn: async () => {
      const response = await api.get('/forum/categories');
      return response.data;
    },
  });

  // Hide Practitioners' Inner Circle from non-BABALAWO users
  const categories = rawCategories.filter(
    (c) => c.slug !== 'practitioners-inner-circle' || isBabalawo,
  );

  // Fetch trending threads
  const { data: trendingThreads = [] } = useQuery<TrendingThread[]>({
    queryKey: ['forum-trending'],
    queryFn: async () => {
      try {
        const res = await api.get('/forum/trending');
        return res.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Full-text search (API-backed, debounced)
  const { data: searchResults, isFetching: searchFetching } = useQuery<SearchResults>({
    queryKey: ['forum-search', debouncedQuery],
    queryFn: async () => {
      const res = await api.get('/forum/search', { params: { q: debouncedQuery } });
      return res.data;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30 * 1000,
  });

  // Fetch threads
  const { data: threads = [], isLoading: threadsLoading } = useQuery<ForumThread[]>({
    queryKey: ['forum-threads', selectedCategory, selectedTag],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedTag) params.tag = selectedTag;
      const response = await api.get('/forum/threads', { params });
      return response.data || [];
    },
  });

  const isSearching = debouncedQuery.length >= 2;
  const filteredThreads = isSearching ? [] : threads;

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory);

  // Active in the Community — distinct authors from currently-loaded threads.
  // Real data already on hand, not a fabricated "online now" presence feature
  // (this app has no live presence tracking today).
  const activeMembers = useMemo(() => {
    const seen = new Map<string, ForumThread['author']>();
    for (const t of threads) {
      if (!seen.has(t.author.id)) seen.set(t.author.id, t.author);
    }
    return Array.from(seen.values()).slice(0, 10);
  }, [threads]);

  const totalThreadCount = categories.reduce((sum, c) => sum + c.threadCount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header Hero */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-300 via-transparent to-transparent"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-300/30 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-card/20 backdrop-blur-md text-xs font-bold text-emerald-100 dark:text-emerald-200 uppercase tracking-widest border border-white/20">
              Communal Square
            </span>
            <h1 className="text-4xl md:text-5xl font-bold brand-font leading-tight">
              Ẹgbẹ Community
            </h1>
            <p className="text-emerald-100 dark:text-emerald-200 max-w-lg text-lg">
              <em>"Ọ̀rọ̀ s'ọ̀rọ̀, ẹni t'ó bá mọ̀ ń gbọ́"</em> — Whoever understands, listens.
            </p>
          </div>

          {user ? (
            <button
              ref={tourCreateRef}
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-card text-emerald-700 dark:text-emerald-400 rounded-xl font-bold hover:bg-emerald-50 transition-colors shadow-lg flex items-center gap-2"
              title="Share your wisdom with the community"
            >
              <Plus size={20} />
              Dialogue ✦
            </button>
          ) : (
            <button
              type="button"
              onClick={() => window.location.href = '/login'}
              className="px-6 py-3 bg-card text-emerald-700 dark:text-emerald-400 rounded-xl font-bold hover:bg-emerald-50 transition-colors shadow-lg flex items-center gap-2"
            >
              <Lock size={20} />
              Sign in to discuss
            </button>
          )}
        </div>
      </div>

      {/* Proverb of the Day Banner */}
      {proverbVisible && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-5 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-amber-800 dark:text-amber-200 font-semibold italic text-sm md:text-base">
              "{proverb.yoruba}"
            </p>
            <p className="text-amber-600 dark:text-amber-400 text-xs mt-1">— {proverb.english}</p>
          </div>
          <button
            type="button"
            onClick={dismissProverb}
            className="shrink-0 text-amber-400 hover:text-amber-600 transition-colors mt-0.5"
            title="Dismiss for today"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Layout */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Categories Sidebar */}
        <div ref={tourCategoryRef} className="lg:w-1/5 space-y-4">
          <div className="bg-card rounded-2xl p-4 border border-emerald-100 shadow-sm">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 px-2">
              Topics
            </h3>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={`w-full flex items-start justify-between px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                  selectedCategory === null
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200'
                    : 'text-emerald-500 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-200'
                }`}
              >
                <span>All Discussions</span>
              </button>

              {categories.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-start justify-between px-3 py-2 rounded-xl text-sm font-bold transition-colors text-left ${
                    selectedCategory === category.id
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700'
                      : 'text-emerald-500 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-200'
                  }`}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none">{category.icon || '#'}</span>
                      <span className="truncate">{category.name}</span>
                    </div>
                    {category.description && (
                      <span className="text-xs font-normal text-emerald-400 dark:text-emerald-500 truncate pl-6">
                        {category.description}
                      </span>
                    )}
                  </div>
                  {category.threadCount > 0 && (
                    <span className="ml-2 shrink-0 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                      {category.threadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* F9-904: Oral History Archive quick link */}
          <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-4 border border-amber-200 dark:border-amber-800/30 shadow-sm">
            <button
              type="button"
              onClick={() => {
                // Navigate to Yorùbá Language & Culture category to surface the pinned thread
                const cultureCategory = categories.find((c) => c.slug === 'yoruba-language-culture');
                if (cultureCategory) setSelectedCategory(cultureCategory.id);
              }}
              className="w-full flex items-center gap-3 text-left group"
            >
              <BookOpen size={18} className="text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300 group-hover:text-amber-600 transition-colors">
                  Oral History Archive
                </p>
                <p className="text-xs text-amber-500 dark:text-amber-400 mt-0.5 leading-snug">
                  Share your story of finding this path
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Threads Feed */}
        <div className="lg:w-3/5 space-y-6">

          {/* 🔥 Hot Right Now — trending threads */}
          {trendingThreads.length > 0 && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-500 uppercase tracking-wider">
                <Flame size={14} className="text-orange-400" /> Hot Right Now
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin scrollbar-thumb-emerald-200">
                {trendingThreads.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onSelectThread?.(t.id)}
                    className="shrink-0 w-52 bg-card border border-emerald-100 rounded-2xl p-4 text-left hover:border-emerald-300 hover:shadow-md transition-all"
                  >
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                      {t.category.name}
                    </span>
                    <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100 mt-1 line-clamp-2 leading-snug">
                      {t.title}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-emerald-400 font-medium">
                      <span>{t.postCount} replies</span>
                      <span>·</span>
                      <span>{t.viewCount} views</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div ref={tourSearchRef} className="space-y-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-12 pr-4 py-3 bg-card border border-emerald-200 rounded-xl text-emerald-700 dark:text-emerald-400 shadow-sm focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 outline-none"
              />
            </div>
            {selectedTag && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-500">Filtering by tag:</span>
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
                >
                  #{selectedTag} ✕
                </button>
              </div>
            )}
          </div>

          {/* Search results (API-backed) */}
          {isSearching && (
            <div className="space-y-4">
              <p className="text-xs text-emerald-500 font-semibold uppercase tracking-wider">
                {searchFetching ? 'Searching…' : `Results for "${debouncedQuery}"`}
              </p>

              {!searchFetching && searchResults && (searchResults.threads.length + searchResults.posts.length) === 0 && (
                <div className="text-center py-16 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100">
                  <Search size={36} className="mx-auto mb-3 text-emerald-300" />
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">No results for "{debouncedQuery}"</p>
                  <p className="text-sm text-emerald-400 mt-1 mb-4">Be the first to start this conversation. Dialogue ✦</p>
                  {user && (
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(true)}
                      className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline text-sm"
                    >
                      Start a thread
                    </button>
                  )}
                </div>
              )}

              {searchResults && searchResults.threads.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <Pin size={10} /> Threads
                  </p>
                  {searchResults.threads.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onSelectThread?.(t.id)}
                      className="bg-card border border-emerald-100 rounded-2xl p-4 cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-emerald-500">{t.category.name}</span>
                      </div>
                      <p className="font-bold text-emerald-900 dark:text-emerald-100 text-sm leading-snug">
                        {highlightMatch(t.title, debouncedQuery)}
                      </p>
                      <p className="text-xs text-emerald-500 line-clamp-2 mt-1">
                        {highlightMatch(t.content, debouncedQuery)}
                      </p>
                      <p className="text-xs text-emerald-400 mt-2">{t._count?.posts ?? 0} replies · by {t.author.yorubaName ?? t.author.name}</p>
                    </div>
                  ))}
                </div>
              )}

              {searchResults && searchResults.posts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <MessageSquare size={10} /> Replies
                  </p>
                  {searchResults.posts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => onSelectThread?.(p.thread.id)}
                      className="bg-card border border-emerald-100 rounded-2xl p-4 cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-emerald-500">{p.thread.category.name}</span>
                        <span className="text-xs text-emerald-400">in "{p.thread.title}"</span>
                      </div>
                      <p className="text-sm text-emerald-800 dark:text-emerald-200 line-clamp-3">
                        {highlightMatch(p.content, debouncedQuery)}
                      </p>
                      <p className="text-xs text-emerald-400 mt-2">by {p.author.yorubaName ?? p.author.name} · {relativeTime(p.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Thread list */}
          {!isSearching && threadsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : !isSearching && filteredThreads.length === 0 ? (
            <div className="text-center py-20 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Quiet in the square.</h3>
              <p className="text-emerald-500 dark:text-emerald-400 mb-6">
                {selectedCategoryObj
                  ? `Be the first to start a dialogue in ${selectedCategoryObj.name}. Dialogue ✦`
                  : 'Be the first to speak. Dialogue ✦'}
              </p>
              {user && (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
                >
                  Start a thread
                </button>
              )}
            </div>
          ) : !isSearching ? (
            <div className="space-y-4">
              {filteredThreads.map((thread) => {
                const lastActivity = thread.lastPostAt || thread.createdAt;
                const isRecent =
                  lastActivity &&
                  new Date(lastActivity).getTime() > Date.now() - 30 * 60 * 1000;

                const isOralHistory = thread.tags?.includes('oral-history');

                return (
                  <div
                    key={thread.id}
                    onClick={() => onSelectThread?.(thread.id)}
                    className={`group p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden ${
                      isOralHistory
                        ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30 hover:border-amber-400'
                        : 'bg-card border-emerald-100 hover:border-emerald-300'
                    }`}
                  >
                    {/* Pinned / locked / oral-history left border */}
                    {(thread.isPinned || thread.isLocked || isOralHistory) && (
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1 ${
                          isOralHistory
                            ? 'bg-amber-400'
                            : thread.isPinned
                            ? 'bg-emerald-500'
                            : 'bg-emerald-300'
                        }`}
                      />
                    )}

                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); navigate(`/profile/${thread.author.id}`); }}
                        className="shrink-0 w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center font-bold text-emerald-400 overflow-hidden hover:opacity-80 transition-opacity"
                      >
                        {thread.author.avatar ? (
                          <img src={thread.author.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          thread.author.name[0].toUpperCase()
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        {/* Title row */}
                        <div className="flex items-center flex-wrap gap-2 mb-1">
                          {thread.isPinned && <Pin size={12} className="text-emerald-500 fill-current shrink-0" />}
                          {thread.isLocked && <Lock size={12} className="text-emerald-400 shrink-0" />}
                          <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 group-hover:text-emerald-600 transition-colors">
                            {thread.title}
                          </h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                            {thread.category.name}
                          </span>
                        </div>

                        {/* Excerpt */}
                        <p className="text-emerald-600 dark:text-emerald-400 text-sm line-clamp-2 mb-3">
                          {thread.content}
                        </p>

                        {/* Tags */}
                        {thread.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {thread.tags.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSelectedTag(tag === selectedTag ? null : tag); }}
                                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-colors ${
                                  selectedTag === tag
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200'
                                }`}
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Meta row */}
                        <div className="flex items-center flex-wrap gap-3 text-xs text-emerald-400 font-medium">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); navigate(`/profile/${thread.author.id}`); }}
                            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                          >
                            {thread.author.yorubaName || thread.author.name}
                          </button>
                          <ForumRoleBadge
                            role={thread.author.role}
                            verified={thread.author.verified}
                            subscriptionStatus={thread.author.subscriptionStatus}
                            culturalLevel={thread.author.culturalLevel}
                          />
                          {lastActivity && (
                            <span
                              className="flex items-center gap-1"
                              title={new Date(lastActivity).toLocaleString()}
                            >
                              {isRecent && (
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" title="Active in the last 30 minutes" />
                              )}
                              {relativeTime(lastActivity)}
                            </span>
                          )}
                          <span>{thread.postCount} replies</span>
                          <span>{thread.viewCount} views</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Community Sidebar */}
        <div className="lg:w-1/5 space-y-4">
          <div className="bg-card rounded-2xl p-4 border border-emerald-100 shadow-sm">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 px-2">
              The Square
            </h3>
            <div className="space-y-2 px-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-emerald-500">Categories</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">{categories.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-emerald-500">Discussions</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">{totalThreadCount}</span>
              </div>
            </div>
          </div>

          {activeMembers.length > 0 && (
            <div className="bg-card rounded-2xl p-4 border border-emerald-100 shadow-sm">
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 px-2">
                Active in the Community
              </h3>
              <div className="space-y-1">
                {activeMembers.map((member) => (
                  <button
                    type="button"
                    key={member.id}
                    onClick={() => navigate(`/profile/${member.id}`)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-left hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                  >
                    <span className="shrink-0 w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-500 overflow-hidden">
                      {member.avatar ? (
                        <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        member.name[0].toUpperCase()
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-emerald-800 dark:text-emerald-200 truncate">
                        {member.yorubaName || member.name}
                      </span>
                      <ForumRoleBadge
                        role={member.role}
                        verified={member.verified}
                        subscriptionStatus={member.subscriptionStatus}
                        culturalLevel={member.culturalLevel}
                      />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Thread Modal */}
      {showCreateForm && (
        <CreateThreadForm
          categoryId={selectedCategory || undefined}
          onSuccess={() => {
            setShowCreateForm(false);
            if (onCreateThread) onCreateThread(selectedCategory || '');
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Onboarding Tooltip Tour — desktop only, shown once */}
      {!tourDone && user && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          {/* Subtle scrim */}
          <div className="absolute inset-0 bg-black/20 pointer-events-auto" onClick={dismissTour} />
          {/* Tour card — fixed bottom-right */}
          {(() => {
            const step = TOUR_STEPS[tourStep];
            if (!step) return null;
            return (
              <div className="fixed bottom-8 right-8 pointer-events-auto w-72 bg-card border border-emerald-200 shadow-2xl rounded-2xl p-5 z-50">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <HelpCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                      Step {tourStep + 1} of {TOUR_STEPS.length}
                    </span>
                  </div>
                  <button type="button" onClick={dismissTour} className="text-muted-foreground hover:text-foreground" aria-label="Dismiss tour">
                    <X size={14} />
                  </button>
                </div>
                <h4 className="font-bold text-foreground text-sm mb-1">{step.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">{step.body}</p>
                <div className="flex items-center justify-between gap-2">
                  <button type="button" onClick={dismissTour} className="text-xs text-muted-foreground hover:text-foreground underline">Skip tour</button>
                  <button
                    type="button"
                    onClick={advanceTour}
                    className="px-4 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors"
                  >
                    {tourStep + 1 < TOUR_STEPS.length ? 'Next →' : 'Done ✓'}
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default ForumHomeView;
