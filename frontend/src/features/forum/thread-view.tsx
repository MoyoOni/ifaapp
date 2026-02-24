import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Lock, Pin, Send, Loader2, Shield, Trash2, BookOpen } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { UserRole } from '@common';
import AseAcknowledgmentButton from './ase-acknowledgment-button';
import { DEMO_FORUM_POSTS_BY_THREAD, DEMO_FORUM_THREADS } from './forum-demo';

interface ForumPost {
  id: string;
  threadId: string;
  authorId: string;
  content: string;
  status: string;
  isEdited: boolean;
  editedAt?: string;
  acknowledgeCount: number;
  isAcknowledged?: boolean; // Whether current user has acknowledged this post
  createdAt: string;
  author: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
    verified: boolean;
    culturalLevel?: string;
  };
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
  isApproved: boolean;
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
    isTeachings?: boolean;
  };
}

interface ThreadViewProps {
  threadId: string;
  onBack?: () => void;
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

const getSessionPosts = (threadId: string): ForumPost[] => {
  if (typeof sessionStorage === 'undefined') {
    return [];
  }
  const stored = sessionStorage.getItem(`demo-forum-posts:${threadId}`);
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored) as ForumPost[];
  } catch (error) {
    logger.warn('Failed to parse forum posts cache', error);
    return [];
  }
};

const storeSessionPost = (threadId: string, post: ForumPost) => {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  const existing = getSessionPosts(threadId);
  sessionStorage.setItem(`demo-forum-posts:${threadId}`, JSON.stringify([...existing, post]));
};

/**
 * Thread View Component
 * Individual thread view with posts and reply functionality
 * NOTE: Cultural teachings threads are read-only - posts require moderator approval
 */
const ThreadView: React.FC<ThreadViewProps> = ({ threadId, onBack }) => {
  const { user } = useAuth();
  const [replyText, setReplyText] = useState('');
  const postsEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch thread with demo fallback
  const { data: thread, isLoading: threadLoading } = useQuery<ForumThread>({
    queryKey: ['forum-thread', threadId],
    queryFn: async () => {
      // Try API first
      try {
        const response = await api.get(`/forum/threads/${threadId}`);
        return response.data;
      } catch (e) {
        if (!isDemoMode) throw e;

        if (!isDemoMode) throw e;


        logger.error('Failed to fetch thread, using demo data', e);
        const sessionThreads = getSessionThreads();
        const sessionThread = sessionThreads.find((item) => item.id === threadId);
        if (sessionThread) {
          return sessionThread;
        }
        return DEMO_FORUM_THREADS.find((item) => item.id === threadId) || null;
      }
    },
    enabled: !!threadId,
  });

  // Fetch posts with demo fallback
  const { data: posts = [], isLoading: postsLoading } = useQuery<ForumPost[]>({
    queryKey: ['forum-posts', threadId],
    queryFn: async () => {
      // Try API first
      try {
        const response = await api.get(`/forum/threads/${threadId}/posts`);
        return response.data || [];
      } catch (e) {
        if (!isDemoMode) throw e;

        if (!isDemoMode) throw e;


        logger.error('Failed to fetch posts, using demo data', e);
        const sessionPosts = getSessionPosts(threadId);
        if (sessionPosts.length > 0) {
          return sessionPosts;
        }
        return DEMO_FORUM_POSTS_BY_THREAD[threadId as keyof typeof DEMO_FORUM_POSTS_BY_THREAD] || [];
      }
    },
    enabled: !!threadId,
  });

  // Auto-scroll to bottom when new posts arrive
  useEffect(() => {
    postsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [posts]);

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      try {
        const response = await api.post('/forum/posts', {
          threadId,
          content,
        });
        return response.data;
      } catch (error) {
        if (!isDemoMode) throw error;

        if (!isDemoMode) throw error;


        logger.error('Failed to create post, using demo fallback', error);
        const now = new Date().toISOString();
        const authorId = user?.id || 'demo-client-1';
        const author = {
          id: authorId,
          name: user?.name || 'Community Member',
          yorubaName: (user as any)?.yorubaName,
          avatar: (user as any)?.avatar,
          verified: (user as any)?.verified ?? true,
          culturalLevel: (user as any)?.culturalLevel,
        };
        const post: ForumPost = {
          id: `demo-post-${Date.now()}`,
          threadId,
          authorId,
          content,
          status: 'ACTIVE',
          isEdited: false,
          acknowledgeCount: 0,
          createdAt: now,
          author,
        };
        storeSessionPost(threadId, post);
        return post;
      }
    },
    onSuccess: (createdPost) => {
      setReplyText('');
      const appendPost = (existing: ForumPost[] | undefined) => {
        if (!createdPost) {
          return existing || [];
        }
        const current = existing || [];
        if (current.some((post) => post.id === createdPost.id)) {
          return current;
        }
        return [...current, createdPost as ForumPost];
      };
      queryClient.setQueryData(['forum-posts', threadId], appendPost);
      queryClient.setQueryData(['forum-thread', threadId], (existing?: ForumThread) => {
        if (!existing) {
          return existing;
        }
        return {
          ...existing,
          postCount: (existing.postCount || 0) + 1,
          lastPostAt: createdPost?.createdAt || new Date().toISOString(),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['forum-threads'] });
    },
  });

  // Moderation mutations
  const moderateThreadMutation = useMutation({
    mutationFn: async (action: 'approve' | 'lock' | 'unlock' | 'pin' | 'unpin') => {
      const response = await api.patch(`/forum/threads/${threadId}/moderate/${action}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-thread', threadId] });
      queryClient.invalidateQueries({ queryKey: ['forum-threads'] });
    },
  });

  const deleteThreadMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/forum/threads/${threadId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-threads'] });
      if (onBack) {
        onBack();
      }
    },
  });

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim() && !createPostMutation.isPending) {
      createPostMutation.mutate(replyText.trim());
    }
  };

  if (threadLoading || postsLoading) {
    return (
      <div className="min-h-screen bg-background text-white p-6 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 p-6">
        <div className="max-w-2xl mx-auto text-center py-20">
          {/* Cultural illustration */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-highlight/10 flex items-center justify-center">
            <BookOpen size={40} className="text-highlight" />
          </div>
          <h2 className="text-2xl font-bold brand-font text-stone-800 mb-3">
            This Wisdom is Being Prepared
          </h2>
          <p className="text-stone-500 mb-8 max-w-md mx-auto">
            The thread you seek is not yet ready for viewing. Like all sacred knowledge,
            it must be gathered with care and intention.
          </p>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 bg-highlight text-white rounded-xl font-bold hover:bg-yellow-600 transition-colors"
            >
              Return to Forum
            </button>
          )}
        </div>
      </div>
    );
  }

  const isTeachingsCategory = thread.category.isTeachings;
  const canReply = !thread.isLocked && (!isTeachingsCategory || user?.role === UserRole.ADMIN);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-stone-200 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {thread.isPinned && (
                  <Pin size={20} className="text-highlight fill-highlight" />
                )}
                {thread.isLocked && <Lock size={20} className="text-muted" />}
                <h1 className="text-3xl font-bold brand-font text-stone-900">{thread.title}</h1>
              </div>
              <div className="flex items-center gap-4 text-sm text-stone-500">
                <span>By {thread.author.yorubaName || thread.author.name}</span>
                {thread.author.verified && <span className="text-highlight">✓ Verified</span>}
                <span>• {thread.category.name}</span>
                <span>• {thread.viewCount} views</span>
                <span>• {thread.postCount} posts</span>
              </div>
            </div>
          </div>

          {/* Moderation Tools (Admin only) */}
          {user?.role === UserRole.ADMIN && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => moderateThreadMutation.mutate(thread.isLocked ? 'unlock' : 'lock')}
                disabled={moderateThreadMutation.isPending}
                className="p-2 hover:bg-stone-200 rounded-lg transition-colors disabled:opacity-50"
                title={thread.isLocked ? 'Unlock thread' : 'Lock thread'}
              >
                <Lock size={18} className={thread.isLocked ? 'text-highlight' : 'text-muted'} />
              </button>
              <button
                onClick={() => moderateThreadMutation.mutate(thread.isPinned ? 'unpin' : 'pin')}
                disabled={moderateThreadMutation.isPending}
                className="p-2 hover:bg-stone-200 rounded-lg transition-colors disabled:opacity-50"
                title={thread.isPinned ? 'Unpin thread' : 'Pin thread'}
              >
                <Pin
                  size={18}
                  className={thread.isPinned ? 'text-highlight fill-highlight' : 'text-muted'}
                />
              </button>
              {!thread.isApproved && (
                <button
                  onClick={() => moderateThreadMutation.mutate('approve')}
                  disabled={moderateThreadMutation.isPending}
                  className="p-2 hover:bg-stone-200 rounded-lg transition-colors disabled:opacity-50"
                  title="Approve thread"
                >
                  <Shield size={18} className="text-highlight" />
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this thread?')) {
                    deleteThreadMutation.mutate();
                  }
                }}
                disabled={deleteThreadMutation.isPending}
                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50 text-red-400"
                title="Delete thread"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Thread Content (First Post) */}
        <div className="bg-white border border-stone-100 shadow-sm rounded-xl p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-highlight/20 flex items-center justify-center text-highlight font-bold flex-shrink-0">
              {(thread.author.yorubaName || thread.author.name)[0].toUpperCase()}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <span className="font-bold">{thread.author.yorubaName || thread.author.name}</span>
                {thread.author.verified && (
                  <span className="text-xs bg-highlight/20 text-highlight px-2 py-1 rounded">
                    Verified
                  </span>
                )}
                {thread.author.culturalLevel && (
                  <span className="text-xs text-muted">{thread.author.culturalLevel}</span>
                )}
              </div>
              <div className="text-muted text-sm">
                {new Date(thread.createdAt).toLocaleString()}
              </div>
              <div className="text-stone-700 whitespace-pre-wrap">{thread.content}</div>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Replies ({posts.length})</h2>

          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-stone-100 shadow-sm rounded-xl p-6 space-y-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-highlight/20 flex items-center justify-center text-highlight font-bold text-sm flex-shrink-0">
                  {(post.author.yorubaName || post.author.name)[0].toUpperCase()}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm">
                      {post.author.yorubaName || post.author.name}
                    </span>
                    {post.author.verified && (
                      <span className="text-xs bg-highlight/20 text-highlight px-2 py-1 rounded">
                        Verified
                      </span>
                    )}
                    {post.isEdited && (
                      <span className="text-xs text-muted italic">(edited)</span>
                    )}
                  </div>
                  <div className="text-stone-400 text-xs">
                    {new Date(post.createdAt).toLocaleString()}
                  </div>
                  <div className="text-stone-700 text-sm whitespace-pre-wrap">{post.content}</div>

                  {/* Àṣẹ Acknowledgment Button */}
                  <div className="flex items-center gap-3 pt-3">
                    <AseAcknowledgmentButton
                      postId={post.id}
                      acknowledgeCount={post.acknowledgeCount}
                      isAcknowledged={post.isAcknowledged || false}
                      userId={user?.id}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div ref={postsEndRef} />
        </div>

        {/* Reply Form */}
        {canReply && (
          <form onSubmit={handleSubmitReply} className="bg-white border border-stone-100 shadow-sm rounded-xl p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted uppercase tracking-widest">
                Your Reply
              </label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Share your thoughts... (Yoruba diacritics supported: Àṣẹ, Babaláwo)"
                rows={4}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-highlight resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={!replyText.trim() || createPostMutation.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-highlight text-white rounded-xl font-bold hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createPostMutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Post Reply
                </>
              )}
            </button>
          </form>
        )}

        {thread.isLocked && (
          <div className="bg-highlight/10 border border-highlight/20 rounded-xl p-4 text-center text-highlight">
            <Lock size={20} className="mx-auto mb-2" />
            This thread is locked. No new replies are allowed.
          </div>
        )}

        {isTeachingsCategory && !thread.isLocked && user?.role !== UserRole.ADMIN && (
          <div className="bg-highlight/10 border border-highlight/20 rounded-xl p-4 text-center text-highlight">
            <p className="text-sm">
              Cultural teachings threads are read-only. Posts require moderator approval.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadView;
