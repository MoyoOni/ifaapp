import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Lock, Pin } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { DEMO_FORUM_CATEGORIES, DEMO_FORUM_THREADS } from './forum-demo';
import CreateThreadForm from './create-thread-form';


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
}

interface ForumHomeViewProps {
  onSelectThread?: (threadId: string) => void;
  onCreateThread?: (categoryId: string) => void;
}

const getSessionThreads = (): ForumThread[] => {
  if (typeof sessionStorage === 'undefined') {
    return [];
  }
  const stored = sessionStorage.getItem('demo-forum-threads');
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored) as ForumThread[];
  } catch (error) {
    logger.warn('Failed to parse forum threads cache', error);
    return [];
  }
};

/**
 * Forum Home View
 * Displays categories and threads list with search and filters
 * NOTE: Cultural teachings section is read-only and pre-approved
 */
const ForumHomeView: React.FC<ForumHomeViewProps> = ({ onSelectThread, onCreateThread }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery<ForumCategory[]>({
    queryKey: ['forum-categories'],
    queryFn: async () => {
      try {
        const response = await api.get('/forum/categories');
        return response.data;
      } catch (e) {
        if (!isDemoMode) throw e;
        logger.error('Failed to fetch categories, using demo data', e);
        return DEMO_FORUM_CATEGORIES;
      }
    },
  });

  // Fetch threads
  const { data: threads = [], isLoading: threadsLoading } = useQuery<ForumThread[]>({
    queryKey: ['forum-threads', selectedCategory],
    queryFn: async () => {
      try {
        const params = selectedCategory ? { categoryId: selectedCategory } : {};
        const response = await api.get('/forum/threads', { params });
        return response.data || [];
      } catch (e) {
        if (!isDemoMode) throw e;
        logger.error('Failed to fetch threads, using demo data', e);
        const demoThreads = selectedCategory
          ? DEMO_FORUM_THREADS.filter((thread) => thread.categoryId === selectedCategory)
          : DEMO_FORUM_THREADS;
        const sessionThreads = getSessionThreads();
        const filteredSession = selectedCategory
          ? sessionThreads.filter((thread) => thread.categoryId === selectedCategory)
          : sessionThreads;
        return [...filteredSession, ...demoThreads];
      }
    },
  });

  // Filter threads by search query
  const filteredThreads = threads.filter((thread) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      thread.title.toLowerCase().includes(query) ||
      thread.content.toLowerCase().includes(query) ||
      thread.author.name.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* 1. Header Hero */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
        {/* Abstract community pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-300 via-transparent to-transparent"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-300/30 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-emerald-100 uppercase tracking-widest border border-white/20">
              Communal Square
            </span>
            <h1 className="text-4xl md:text-5xl font-bold brand-font leading-tight">
              Ẹgbẹ Community
            </h1>
            <p className="text-emerald-100 max-w-lg text-lg">
              Discussions, teachings, and wisdom sharing. Connect with fellow seekers and elders.
            </p>
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-white text-emerald-700 rounded-xl font-bold hover:bg-emerald-50 transition-colors shadow-lg flex items-center gap-2"
          >
            <Plus size={20} />
            Start Discussion
          </button>
        </div>
      </div>

      {/* 2. Controls Area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Categories Sidebar/List */}
        <div className="lg:w-1/4 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 px-2">
              Topics
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-colors ${selectedCategory === null
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'text-emerald-500 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
              >
                <span>All Discussions</span>
              </button>

              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-colors ${selectedCategory === category.id
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-emerald-500 hover:bg-emerald-50 hover:text-emerald-800'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    {category.icon && (typeof category.icon === 'function' || typeof category.icon === 'object') ? (
                      // @ts-ignore - Lucide icon component
                      <category.icon size={16} />
                    ) : (
                      <span>{category.icon || '#'}</span>
                    )}
                    <span>{category.name}</span>
                  </div>
                  {category.threadCount > 0 && (
                    <span className="text-xs bg-emerald-100 text-emerald-500 px-1.5 py-0.5 rounded-full">
                      {category.threadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Threads Feed */}
        <div className="lg:w-3/4 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-emerald-200 rounded-xl text-emerald-700 shadow-sm focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 outline-none"
            />
          </div>

          {/* List */}
          {threadsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-emerald-100 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="text-center py-20 bg-emerald-50 rounded-3xl border border-emerald-100">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-emerald-600">Quiet in the square.</h3>
              <p className="text-emerald-500 mb-6">Be the first to speak on this topic.</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="text-emerald-700 font-bold hover:underline"
              >
                Start a thread
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => onSelectThread?.(thread.id)}
                  className="group bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer relative overflow-hidden"
                >
                  {/* Left border for pinned/locked */}
                  {(thread.isPinned || thread.isLocked) && (
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${thread.isPinned ? 'bg-emerald-500' : 'bg-emerald-300'}`}></div>
                  )}

                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-400">
                      {thread.author.name[0].toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {thread.isPinned && <Pin size={12} className="text-emerald-500 fill-current" />}
                        {thread.isLocked && <Lock size={12} className="text-emerald-400" />}
                        <h3 className="text-lg font-bold text-emerald-900 group-hover:text-emerald-600 transition-colors truncate">
                          {thread.title}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-medium">
                          {thread.category.name}
                        </span>
                      </div>

                      <p className="text-emerald-600 text-sm line-clamp-2 mb-3">
                        {thread.content}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-emerald-400 font-medium">
                        <span className="text-emerald-600 font-bold">
                          {thread.author.yorubaName || thread.author.name}
                        </span>
                        <span>• {new Date(thread.createdAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1">
                          {thread.postCount} replies
                        </span>
                        <span className="flex items-center gap-1">
                          {thread.viewCount} views
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
            if (onCreateThread) {
              onCreateThread(selectedCategory || '');
            }
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
};

export default ForumHomeView;
