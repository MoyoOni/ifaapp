import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Lock, Pin, Send, Loader2, Shield, Trash2, BookOpen, Eye, Share2, Bookmark, BookmarkCheck, UserCircle2, MoreHorizontal, Flag, Bell, BellOff, AlertTriangle, Stethoscope } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { UserRole } from '@common';
import AseAcknowledgmentButton from './ase-acknowledgment-button';
import ForumRoleBadge from './forum-role-badge';
import { useConfirm } from '@/hooks/use-confirm';
import { getSocket } from '@/lib/socket';
import { CulturalOrientationGate } from './cultural-orientation-gate';

interface ForumPost {
  id: string;
  threadId: string;
  authorId: string;
  content: string;
  status: string;
  isEdited: boolean;
  editedAt?: string;
  isAnonymous?: boolean;
  isFirstResponder?: boolean;
  postTag?: string;
  acknowledgeCount: number;
  isAcknowledged?: boolean;
  elderReactions?: Array<{
    id: string;
    emoji: string;
    userId: string;
    createdAt: string;
    elder: {
      id: string;
      name: string;
      yorubaName?: string;
      avatar?: string;
      verified: boolean;
      role?: string;
    };
  }>;
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
    isCommunityBuilder?: boolean;
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
  isSacred?: boolean;
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

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  image: string | null;
  category: string;
}

interface ThreadViewProps {
  threadId: string;
  onBack?: () => void;
}


/** Render post content, highlighting @mentions in amber */
function renderContent(text: string) {
  const parts = text.split(/(@[\w\u00C0-\u024F\u1E00-\u1EFF]+)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className="text-amber-500 font-semibold">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

/**
 * Thread View Component
 * Individual thread view with posts and reply functionality
 * NOTE: Cultural teachings threads are read-only - posts require moderator approval
 */
const ThreadView: React.FC<ThreadViewProps> = ({ threadId, onBack }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [replyText, setReplyText] = useState('');
  const [viewerCount, setViewerCount] = useState(1);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [copyConfirm, setCopyConfirm] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [postTag, setPostTag] = useState('');
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportNote, setReportNote] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  // F9-602: Crisis modal
  const [crisisModalVisible, setCrisisModalVisible] = useState(false);
  // F9-604: Elder flag modal
  const [elderFlagPostId, setElderFlagPostId] = useState<string | null>(null);
  const [elderFlagReason, setElderFlagReason] = useState('');
  const [elderFlagSubmitted, setElderFlagSubmitted] = useState(false);
  const [postMenuOpenId, setPostMenuOpenId] = useState<string | null>(null);
  // F9-605: Citation prompt
  const [citationPromptPostId, setCitationPromptPostId] = useState<string | null>(null);
  const [citationText, setCitationText] = useState('');
  const [citationOpen, setCitationOpen] = useState(false);
  // F9-705: Micro-tip
  const [tipPostId, setTipPostId] = useState<string | null>(null);
  const [tipAmount, setTipAmount] = useState<number>(500);
  const [tipPending, setTipPending] = useState(false);
  const [tipSuccess, setTipSuccess] = useState(false);
  const [streak, setStreak] = useState<{ contributionStreak: number; longestStreak: number; lastContributionDate?: string | null } | null>(null);
  // @mention autocomplete
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionDropdown, setMentionDropdown] = useState(false);
  const [mentionCursor, setMentionCursor] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const postsEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { ConfirmationDialog, confirm } = useConfirm();

  // F9-902: Cultural Orientation Gate
  const [orientationGateOpen, setOrientationGateOpen] = useState(false);
  const [pendingReply, setPendingReply] = useState<string | null>(null);

  // Fetch thread with demo fallback
  const { data: thread, isLoading: threadLoading } = useQuery<ForumThread>({
    queryKey: ['forum-thread', threadId],
    queryFn: async () => {
      const response = await api.get(`/forum/threads/${threadId}`);
      return response.data;
    },
    enabled: !!threadId,
  });

  // F9-704: Related marketplace products
  const { data: relatedProducts = [] } = useQuery<RelatedProduct[]>({
    queryKey: ['forum-related-products', threadId],
    queryFn: async () => {
      const res = await api.get(`/forum/threads/${threadId}/related-products`);
      return res.data ?? [];
    },
    enabled: !!threadId,
    staleTime: 5 * 60_000,
  });

  // Fetch posts with demo fallback
  const { data: posts = [], isLoading: postsLoading } = useQuery<ForumPost[]>({
    queryKey: ['forum-posts', threadId],
    queryFn: async () => {
      const response = await api.get(`/forum/threads/${threadId}/posts`);
      return response.data || [];
    },
    enabled: !!threadId,
  });

  // Auto-scroll to bottom when new posts arrive
  useEffect(() => {
    postsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [posts]);

  // Socket: join forum thread room for real-time presence + new posts
  useEffect(() => {
    if (!user || !threadId) return;
    const socket = getSocket();
    socket.emit('forum:join', threadId);

    const handleViewers = ({ count }: { count: number }) => setViewerCount(count);
    const handleNewPost = ({ post }: { post: ForumPost }) => {
      queryClient.setQueryData(['forum-posts', threadId], (existing: ForumPost[] = []) => {
        if (existing.some((p) => p.id === post.id)) return existing;
        return [...existing, post];
      });
    };

    socket.on('forum:viewers', handleViewers);
    socket.on('forum:new_post', handleNewPost);

    return () => {
      socket.emit('forum:leave', threadId);
      socket.off('forum:viewers', handleViewers);
      socket.off('forum:new_post', handleNewPost);
    };
  }, [threadId, user, queryClient]);

  // Fetch bookmark status for logged-in users
  useEffect(() => {
    if (!user) return;
    api.get(`/forum/threads/${threadId}/bookmark`)
      .then((res) => setIsBookmarked(res.data?.bookmarked ?? false))
      .catch(() => {});
  }, [threadId, user]);

  // Fetch subscription status for logged-in users
  useEffect(() => {
    if (!user) return;
    api.get(`/forum/threads/${threadId}/subscribe`)
      .then((res) => setIsSubscribed(res.data?.subscribed ?? false))
      .catch(() => {});
  }, [threadId, user]);

  useEffect(() => {
    if (!user) return;
    api.get('/forum/me/contribution-streak')
      .then((res) => setStreak(res.data ?? null))
      .catch(() => {});
  }, [user, threadId]);

  const handleSubscribeToggle = useCallback(async () => {
    if (!user) return;
    try {
      if (isSubscribed) {
        await api.delete(`/forum/threads/${threadId}/subscribe`);
        setIsSubscribed(false);
      } else {
        await api.post(`/forum/threads/${threadId}/subscribe`);
        setIsSubscribed(true);
      }
    } catch {
      // ignore
    }
  }, [isSubscribed, threadId, user]);

  // @mention: search users when typing @...
  const { data: mentionResults = [] } = useQuery<{ id: string; name: string; yorubaName?: string }[]>({
    queryKey: ['user-search-mention', mentionSearch],
    queryFn: async () => {
      if (!mentionSearch) return [];
      const res = await api.get('/users', { params: { search: mentionSearch, limit: 6 } });
      return res.data?.users ?? res.data ?? [];
    },
    enabled: mentionDropdown && mentionSearch.length >= 1,
    staleTime: 30_000,
  });

  const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setReplyText(val);
    // Detect @mention trigger at current cursor
    const pos = e.target.selectionStart ?? val.length;
    const textBefore = val.slice(0, pos);
    const match = textBefore.match(/@([\w\u00C0-\u024F]*)$/);
    if (match) {
      setMentionSearch(match[1]);
      setMentionDropdown(true);
      setMentionCursor(0);
    } else {
      setMentionDropdown(false);
      setMentionSearch('');
    }
  };

  const insertMention = (handle: string) => {
    const pos = textareaRef.current?.selectionStart ?? replyText.length;
    const textBefore = replyText.slice(0, pos);
    const textAfter = replyText.slice(pos);
    const replaced = textBefore.replace(/@[\w\u00C0-\u024F]*$/, `@${handle} `);
    setReplyText(replaced + textAfter);
    setMentionDropdown(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleShare = useCallback(() => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: thread?.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopyConfirm(true);
        setTimeout(() => setCopyConfirm(false), 2000);
      }).catch(() => {});
    }
  }, [thread?.title]);

  // F9-701: WhatsApp deep-link share
  const handleWhatsAppShare = useCallback(() => {
    const url = window.location.href;
    const text = encodeURIComponent(
      `Interesting discussion happening on Ìlú Àṣẹ — the Ifá spiritual community platform:\n"${thread?.title}"\nJoin the dialogue: ${url}\n*Dialogue* ✦ — Ìlú Àṣẹ`
    );
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const waUrl = isMobile
      ? `https://wa.me/?text=${text}`
      : `https://web.whatsapp.com/send?text=${text}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    // Fire-and-forget analytics
    api.post(`/forum/threads/${threadId}/share`).catch(() => {});
  }, [thread?.title, threadId]);

  const handleBookmark = useCallback(async () => {
    if (!user) return;
    try {
      if (isBookmarked) {
        await api.delete(`/forum/threads/${threadId}/bookmark`);
        setIsBookmarked(false);
      } else {
        await api.post(`/forum/threads/${threadId}/bookmark`);
        setIsBookmarked(true);
      }
    } catch {
      // ignore
    }
  }, [isBookmarked, threadId, user]);

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await api.post('/forum/posts', {
        threadId,
        content,
        isAnonymous,
        postTag: postTag.trim() || undefined,
      });
      return response.data;
    },
    onSuccess: (createdPost) => {
      setReplyText('');
      setIsAnonymous(false);
      setPostTag('');
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

      // F9-602: Show crisis resources modal if backend flagged distress signal
      if ((createdPost as any)?.crisisDetected) {
        setCrisisModalVisible(true);
      }

      api.get('/forum/me/contribution-streak')
        .then((res) => setStreak(res.data ?? null))
        .catch(() => {});

      // F9-605: Show citation prompt in Ifá Studies / Practitioners' Inner Circle
      const categorySlug = thread?.category.slug;
      if (createdPost && (categorySlug === 'ifa-divination-studies' || categorySlug === 'practitioners-inner-circle')) {
        setCitationPromptPostId(createdPost.id);
        setCitationOpen(false);
        setCitationText('');
      }
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

  const submitReport = async () => {
    if (!reportingPostId || !reportReason) return;
    try {
      await api.post(`/forum/posts/${reportingPostId}/report`, { reason: reportReason, note: reportNote || undefined });
      setReportSubmitted(true);
      setTimeout(() => { setReportingPostId(null); setReportSubmitted(false); setReportReason(''); setReportNote(''); }, 2000);
    } catch {
      // ignore duplicate report errors silently
      setReportingPostId(null);
    }
  };

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim() && !createPostMutation.isPending) {
      // F9-902: Check if category is restricted
      const restrictedCategories = ['ifa-divination-studies', 'practitioners-inner-circle'];
      if (thread && restrictedCategories.includes(thread.category?.slug || '')) {
        // Check if user has passed orientation
        if (!user?.passedCulturalOrientation) {
          setPendingReply(replyText.trim());
          setOrientationGateOpen(true);
          return;
        }
      }
      createPostMutation.mutate(replyText.trim());
    }
  };

  if (threadLoading || postsLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted p-6">
        <div className="max-w-2xl mx-auto text-center py-20">
          {/* Cultural illustration */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-highlight/10 flex items-center justify-center">
            <BookOpen size={40} className="text-highlight" />
          </div>
          <h2 className="text-2xl font-bold brand-font text-foreground mb-3">
            This Wisdom is Being Prepared
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
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

  // Sacred content gate — non-initiated users see a disclaimer
  const isSacredGated = thread.isSacred && user?.role !== 'BABALAWO' && user?.role !== 'ADMIN';
  if (isSacredGated) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
          {onBack && (
            <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft size={16} /> Back to Forum
            </button>
          )}
          <div className="w-24 h-24 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center">
            <Lock size={40} className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold brand-font text-foreground">Sacred Knowledge</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            This discussion contains teachings reserved for initiated practitioners. Verification as a Babalawo is required to access this content.
          </p>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300 max-w-sm mx-auto">
            🔱 Sacred content is protected to honour the tradition and its practitioners.
          </div>
          <a
            href="/verify"
            className="inline-block px-6 py-3 bg-highlight text-white rounded-xl font-bold hover:bg-yellow-600 transition-colors"
          >
            Learn About Verification
          </a>
        </div>
      </div>
    );
  }

  const isTeachingsCategory = thread.category.isTeachings;
  const isHealingCategory = thread.category.slug === 'healing-herbs-wellness';
  const canReply = !thread.isLocked && (!isTeachingsCategory || user?.role === UserRole.ADMIN);
  const isVerifiedBabalawo = user?.role === 'BABALAWO' && (user as any)?.verified;

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
                aria-label="Go back"
                title="Go back"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {thread.isPinned && (
                  <Pin size={20} className="text-highlight fill-highlight" />
                )}
                {thread.isLocked && <Lock size={20} className="text-muted-foreground" />}
                <h1 className="text-3xl font-bold brand-font text-foreground">{thread.title}</h1>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <button type="button" onClick={() => navigate(`/profile/${thread.author.id}`)} className="hover:underline">By {thread.author.yorubaName || thread.author.name}</button>
                {thread.author.verified && <span className="text-highlight">✓ Verified</span>}
                <span>• {thread.category.name}</span>
                <span>• {thread.viewCount} views</span>
                <span>• {thread.postCount} posts</span>
              </div>
            </div>
          </div>

          {/* Action bar: viewer count, share, bookmark, moderation */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Viewer count — only shown when >1 */}
            {viewerCount > 1 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-1">
                <Eye size={13} />
                {viewerCount} reading
              </span>
            )}

            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1 p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              title="Copy link"
            >
              <Share2 size={16} />
              {copyConfirm && <span className="text-xs text-emerald-500">Copied!</span>}
            </button>

            {/* F9-701: WhatsApp Share */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Share on WhatsApp"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#25D366]">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </button>

            {/* Bookmark */}
            {user && (
              <button
                type="button"
                onClick={handleBookmark}
                className={`p-2 hover:bg-muted rounded-lg transition-colors ${isBookmarked ? 'text-highlight' : 'text-muted-foreground hover:text-foreground'}`}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark thread'}
              >
                {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              </button>
            )}

            {/* Subscribe / Notify bell */}
            {user && (
              <button
                type="button"
                onClick={handleSubscribeToggle}
                className={`p-2 hover:bg-muted rounded-lg transition-colors ${isSubscribed ? 'text-highlight' : 'text-muted-foreground hover:text-foreground'}`}
                title={isSubscribed ? 'Unsubscribe from notifications' : 'Subscribe to replies'}
              >
                {isSubscribed ? <Bell size={16} className="fill-highlight" /> : <BellOff size={16} />}
              </button>
            )}

            {/* Moderation Tools (Admin only) */}
            {user?.role === UserRole.ADMIN && (
              <>
                <button
                  type="button"
                  onClick={() => moderateThreadMutation.mutate(thread.isLocked ? 'unlock' : 'lock')}
                  disabled={moderateThreadMutation.isPending}
                  className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                  title={thread.isLocked ? 'Unlock thread' : 'Lock thread'}
                >
                  <Lock size={18} className={thread.isLocked ? 'text-highlight' : 'text-muted-foreground'} />
                </button>
                <button
                  type="button"
                  onClick={() => moderateThreadMutation.mutate(thread.isPinned ? 'unpin' : 'pin')}
                  disabled={moderateThreadMutation.isPending}
                  className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                  title={thread.isPinned ? 'Unpin thread' : 'Pin thread'}
                >
                  <Pin size={18} className={thread.isPinned ? 'text-highlight fill-highlight' : 'text-muted-foreground'} />
                </button>
                {!thread.isApproved && (
                  <button
                    type="button"
                    onClick={() => moderateThreadMutation.mutate('approve')}
                    disabled={moderateThreadMutation.isPending}
                    className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                    title="Approve thread"
                  >
                    <Shield size={18} className="text-highlight" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = await confirm({
                      title: 'Delete Thread',
                      message: 'Are you sure you want to delete this thread? This cannot be undone.',
                      confirmText: 'Delete',
                    });
                    if (confirmed) {
                      deleteThreadMutation.mutate();
                    }
                  }}
                  disabled={deleteThreadMutation.isPending}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50 text-red-400"
                  title="Delete thread"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* F9-601: Sacred Knowledge Banner */}
        {thread.isSacred && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-4 flex gap-3 items-start">
            <span className="text-amber-500 text-lg leading-none mt-0.5">🔱</span>
            <div>
              <p className="text-amber-500 font-bold text-sm">Sacred Knowledge</p>
              <p className="text-amber-400/80 text-sm mt-0.5">
                This discussion contains initiatory or esoteric content shared in trust.
                For personal guidance, consult a verified Babaláwo.
              </p>
            </div>
          </div>
        )}

        {/* Thread Content (First Post) */}
        <div className="bg-card border border-border/60 shadow-sm rounded-xl p-6 space-y-4">
          <div className="flex items-start gap-4">
            <button type="button" onClick={() => navigate(`/profile/${thread.author.id}`)} className="w-12 h-12 rounded-full bg-highlight/20 flex items-center justify-center text-highlight font-bold flex-shrink-0 hover:opacity-80 transition-opacity">
              {(thread.author.yorubaName || thread.author.name)[0].toUpperCase()}
            </button>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => navigate(`/profile/${thread.author.id}`)} className="font-bold hover:underline">{thread.author.yorubaName || thread.author.name}</button>
                {thread.author.verified && (
                  <span className="text-xs bg-highlight/20 text-highlight px-2 py-1 rounded">
                    Verified
                  </span>
                )}
                {thread.author.culturalLevel && (
                  <span className="text-xs text-muted-foreground">{thread.author.culturalLevel}</span>
                )}
              </div>
              <div className="text-muted-foreground text-sm">
                {new Date(thread.createdAt).toLocaleString()}
              </div>
              <div className="text-foreground whitespace-pre-wrap">{thread.content}</div>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Replies ({posts.length})</h2>

          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-card border border-border/60 shadow-sm rounded-xl p-6 space-y-4 animate-in fade-in duration-300"
            >
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => { if (!(post.isAnonymous && post.author.id === 'anon')) navigate(`/profile/${post.author.id}`); }}
                  className="w-10 h-10 rounded-full bg-highlight/20 flex items-center justify-center text-highlight font-bold text-sm flex-shrink-0 overflow-hidden hover:opacity-80 transition-opacity"
                  disabled={post.isAnonymous && post.author.id === 'anon'}
                >
                  {post.isAnonymous && post.author.id === 'anon' ? (
                    <UserCircle2 size={28} className="text-muted-foreground" />
                  ) : post.author.avatar ? (
                    <img src={post.author.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (post.author.yorubaName || post.author.name)[0].toUpperCase()
                  )}
                </button>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => { if (!(post.isAnonymous && post.author.id === 'anon')) navigate(`/profile/${post.author.id}`); }}
                      disabled={post.isAnonymous && post.author.id === 'anon'}
                      className={`font-bold text-sm ${post.isAnonymous && post.author.id === 'anon' ? 'italic text-muted-foreground cursor-default' : 'hover:underline'}`}
                    >
                      {post.author.yorubaName || post.author.name}
                    </button>
                    {post.isAnonymous && post.author.id === 'anon' ? (
                      <Lock size={10} className="text-muted-foreground" />
                    ) : (
                      <ForumRoleBadge
                        role={post.author.role}
                        verified={post.author.verified}
                        subscriptionStatus={post.author.subscriptionStatus}
                        culturalLevel={post.author.culturalLevel}
                        isCommunityBuilder={post.author.isCommunityBuilder}
                      />
                    )}
                    {post.isEdited && (
                      <span className="text-xs text-muted-foreground italic">(edited)</span>
                    )}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {new Date(post.createdAt).toLocaleString()}
                  </div>
                  <div className="text-foreground text-sm whitespace-pre-wrap">{renderContent(post.content)}</div>
                  <div className="flex items-center flex-wrap gap-2">
                    {post.isFirstResponder && (
                      <span className="text-[10px] uppercase tracking-wider bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded-full font-bold">
                        First Responder
                      </span>
                    )}
                    {post.postTag && (
                      <span className="text-[10px] uppercase tracking-wider bg-highlight/20 text-highlight px-2 py-1 rounded-full font-bold">
                        {post.postTag}
                      </span>
                    )}
                  </div>

                  {/* F9-803: Elder reactions */}
                  <div className="flex items-center flex-wrap gap-2">
                    {(post.elderReactions ?? []).map((reaction) => (
                      <span
                        key={reaction.id}
                        className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full"
                        title={`${reaction.elder.yorubaName || reaction.elder.name}`}
                      >
                        <span>{reaction.emoji}</span>
                        <span className="text-muted-foreground">
                          {reaction.elder.yorubaName || reaction.elder.name}
                        </span>
                      </span>
                    ))}
                    {isVerifiedBabalawo && (
                      <div className="flex items-center gap-1">
                        {['🔥', '🙏🏾', '✅'].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="text-xs px-2 py-1 rounded-full border border-border hover:bg-muted transition-colors"
                            onClick={async () => {
                              try {
                                await api.post(`/forum/posts/${post.id}/elder-reactions`, { emoji });
                                queryClient.invalidateQueries({ queryKey: ['forum-posts', threadId] });
                              } catch {
                                // ignore
                              }
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                        <button
                          type="button"
                          className="text-xs px-2 py-1 rounded-full border border-border hover:bg-muted transition-colors text-muted-foreground"
                          onClick={async () => {
                            try {
                              await api.delete(`/forum/posts/${post.id}/elder-reactions`);
                              queryClient.invalidateQueries({ queryKey: ['forum-posts', threadId] });
                            } catch {
                              // ignore
                            }
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Àṣẹ Acknowledgment + actions */}
                  <div className="flex items-center justify-between gap-3 pt-3">
                    <AseAcknowledgmentButton
                      postId={post.id}
                      acknowledgeCount={post.acknowledgeCount}
                      isAcknowledged={post.isAcknowledged || false}
                      userId={user?.id}
                    />
                    <div className="flex items-center gap-1">
                      {user && post.author.id !== 'anon' && post.authorId !== user.id && (
                        <button
                          type="button"
                          onClick={() => { setReportingPostId(post.id); setReportReason(''); setReportNote(''); }}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Report this post"
                        >
                          <Flag size={12} /> Report
                        </button>
                      )}
                      {/* F9-705: Tip button — only for Babalawo posts the viewer didn't write */}
                      {user && post.author.role === 'BABALAWO' && post.authorId !== user.id && (
                        <button
                          type="button"
                          onClick={() => { setTipPostId(post.id); setTipAmount(500); setTipSuccess(false); }}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-pink-500 transition-colors px-2 py-1 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20"
                          title="Send a small tip to this Babalawo"
                        >
                          💝 Tip
                        </button>
                      )}
                      {/* F9-604: Elder Flag — verified Babalawo only */}
                      {isVerifiedBabalawo && post.authorId !== user?.id && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setPostMenuOpenId(postMenuOpenId === post.id ? null : post.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="More options"
                          >
                            <MoreHorizontal size={14} />
                          </button>
                          {postMenuOpenId === post.id && (
                            <div className="absolute right-0 bottom-full mb-1 bg-popover border border-border rounded-xl shadow-lg z-50 min-w-[220px] overflow-hidden">
                              <button
                                type="button"
                                onClick={() => {
                                  setElderFlagPostId(post.id);
                                  setElderFlagReason('');
                                  setElderFlagSubmitted(false);
                                  setPostMenuOpenId(null);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-amber-500 hover:bg-amber-500/10 transition-colors flex items-center gap-2"
                              >
                                🔱 Flag as Culturally Inaccurate
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div ref={postsEndRef} />
        </div>

        {/* Reply Form */}
        {canReply && (
          <form onSubmit={handleSubmitReply} className="bg-card border border-border/60 shadow-sm rounded-xl p-6 space-y-4">
            {streak && (
              <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 inline-flex items-center gap-2">
                <span>🔥 {streak.contributionStreak}-day streak</span>
                <span>• Best: {streak.longestStreak}</span>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                Your Reply
              </label>
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={replyText}
                  onChange={handleReplyChange}
                  onKeyDown={(e) => {
                    if (!mentionDropdown || mentionResults.length === 0) return;
                    if (e.key === 'ArrowDown') { e.preventDefault(); setMentionCursor((c) => Math.min(c + 1, mentionResults.length - 1)); }
                    if (e.key === 'ArrowUp') { e.preventDefault(); setMentionCursor((c) => Math.max(c - 1, 0)); }
                    if (e.key === 'Enter' || e.key === 'Tab') {
                      e.preventDefault();
                      const pick = mentionResults[mentionCursor];
                      if (pick) insertMention(pick.yorubaName ?? pick.name);
                    }
                    if (e.key === 'Escape') setMentionDropdown(false);
                  }}
                  placeholder="Share your thoughts... type @ to mention someone"
                  rows={4}
                  className="w-full bg-background border border-border rounded-xl p-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-highlight resize-none"
                />
                {/* @mention autocomplete dropdown */}
                {mentionDropdown && mentionResults.length > 0 && (
                  <ul className="absolute bottom-full left-0 mb-1 w-64 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                    {mentionResults.map((u, i) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); insertMention(u.yorubaName ?? u.name); }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${i === mentionCursor ? 'bg-highlight/20 text-highlight' : 'hover:bg-muted text-foreground'}`}
                        >
                          <span className="font-semibold">{u.yorubaName ?? u.name}</span>
                          {u.yorubaName && <span className="text-muted-foreground ml-1 text-xs">({u.name})</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Post Tag (optional)
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {['Prayer', 'Guidance', 'Testimony', 'Question'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setPostTag(postTag === tag ? '' : tag)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      postTag === tag
                        ? 'bg-highlight text-white border-highlight'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            {/* Anonymous checkbox — only shown in Seeker Questions */}
            {thread?.category.slug === 'seeker-questions' && (
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-border accent-highlight"
                />
                Post anonymously — your name will be hidden from other community members
              </label>
            )}

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

        {/* F9-603: Healing category disclaimer footer */}
        {isHealingCategory && (
          <div className="bg-muted/50 border border-border/40 rounded-xl px-5 py-4 flex gap-3 items-start text-sm text-muted-foreground">
            <Stethoscope size={16} className="flex-shrink-0 mt-0.5 text-emerald-500" />
            <div>
              <span className="font-semibold text-foreground">Community Wisdom Notice — </span>
              Discussions here share traditional knowledge and lived experience. Spiritual practices
              complement — they do not replace — professional medical, legal, or psychological care.
              For serious health concerns, please consult a qualified practitioner.
            </div>
          </div>
        )}

        {/* F9-704: Related marketplace items */}
        {relatedProducts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <span>🛍️</span> Sacred Items in This Conversation
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {relatedProducts.map((product) => (
                <a
                  key={product.id}
                  href={`/marketplace/products/${product.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 w-40 bg-card border border-border/60 rounded-xl overflow-hidden hover:border-highlight/50 hover:shadow-md transition-all"
                >
                  <div className="h-24 bg-muted flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">🪬</span>
                    )}
                  </div>
                  <div className="p-2 space-y-1">
                    <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight">{product.name}</p>
                    <p className="text-xs text-highlight font-bold">
                      {product.currency} {product.price.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground hover:text-highlight transition-colors">
                      View in Marketplace →
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* F9-605: Citation prompt — shown after posting in Ifá Studies / Inner Circle */}
        {citationPromptPostId && (
          <div className="bg-highlight/5 border border-highlight/20 rounded-xl p-4 space-y-3 animate-in fade-in duration-300">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-sm text-foreground">Your wisdom has been shared. 🙏🏾</p>
                <p className="text-xs text-muted-foreground mt-1">
                  If this references a specific Odù or teaching — adding your source helps the community learn.
                </p>
              </div>
              <button type="button" onClick={() => setCitationPromptPostId(null)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
            </div>
            {citationOpen ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={citationText}
                  onChange={(e) => setCitationText(e.target.value)}
                  placeholder="Source, elder, or reference…"
                  className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-highlight"
                />
                <button
                  type="button"
                  disabled={!citationText.trim()}
                  onClick={async () => {
                    if (!citationText.trim() || !citationPromptPostId) return;
                    try {
                      await api.patch(`/forum/posts/${citationPromptPostId}`, {
                        content: `${citationText.trim()} [Source: ${citationText.trim()}]`,
                      });
                    } catch { /* non-blocking */ }
                    setCitationPromptPostId(null);
                  }}
                  className="px-4 py-2 bg-highlight text-white rounded-xl text-sm font-bold hover:bg-yellow-600 transition-colors disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button type="button" onClick={() => setCitationOpen(true)} className="px-4 py-2 bg-highlight text-white rounded-xl text-sm font-bold hover:bg-yellow-600 transition-colors">
                  Add source
                </button>
                <button type="button" onClick={() => setCitationPromptPostId(null)} className="px-4 py-2 border border-border text-foreground rounded-xl text-sm hover:bg-muted transition-colors">
                  No source needed
                </button>
              </div>
            )}
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
      <ConfirmationDialog />

      {/* Report Modal */}
      {reportingPostId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-md p-6 space-y-4">
            {reportSubmitted ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-3">✅</div>
                <p className="font-bold text-foreground">Report submitted.</p>
                <p className="text-sm text-muted-foreground mt-1">Our community moderators will review it.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><Flag size={16} className="text-red-400" /> Report Post</h3>
                  <button type="button" onClick={() => setReportingPostId(null)} className="text-muted-foreground hover:text-foreground">✕</button>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    aria-label="Report reason"
                    className="w-full bg-muted/50 border border-border rounded-xl p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-highlight"
                  >
                    <option value="">Select a reason…</option>
                    <option value="Misinformation">Misinformation about Ifá / Isese</option>
                    <option value="Spam">Spam or repetitive content</option>
                    <option value="Harassment">Harassment or personal attacks</option>
                    <option value="Cultural Disrespect">Cultural disrespect or mockery</option>
                    <option value="Exploitation">Exploitation or financial scam</option>
                    <option value="Other">Other</option>
                  </select>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Additional note (optional)</label>
                  <textarea
                    value={reportNote}
                    onChange={(e) => setReportNote(e.target.value)}
                    rows={2}
                    placeholder="Any context that helps the moderator…"
                    className="w-full bg-muted/50 border border-border rounded-xl p-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-highlight resize-none"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setReportingPostId(null)} className="px-4 py-2 border border-border text-foreground rounded-xl text-sm font-bold hover:bg-muted transition-colors">Cancel</button>
                  <button type="button" disabled={!reportReason} onClick={submitReport} className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50">Submit Report</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* F9-602: Mental Health Crisis Resources Modal */}
      {crisisModalVisible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in duration-300">
            <div className="text-center">
              <div className="text-3xl mb-2">🙏🏾</div>
              <h3 className="text-lg font-bold text-foreground">You are not alone.</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              If you're going through something difficult right now, support is available:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Nigeria:</strong> Mentally Aware Initiative — 0800 200 0248 (free, 24/7)</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <span><strong className="text-foreground">UK:</strong> Samaritans — 116 123 (free, 24/7)</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <span><strong className="text-foreground">US:</strong> 988 Suicide &amp; Crisis Lifeline — call or text 988</span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Your post has been shared with the community. A moderator will check in with you.
            </p>
            <button
              type="button"
              onClick={() => setCrisisModalVisible(false)}
              className="w-full py-3 bg-highlight text-white rounded-xl font-bold hover:bg-yellow-600 transition-colors"
            >
              Thank you — I understand
            </button>
          </div>
        </div>
      )}

      {/* F9-604: Elder Quiet Flag Modal */}
      {elderFlagPostId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-md p-6 space-y-4">
            {elderFlagSubmitted ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-3">🔱</div>
                <p className="font-bold text-foreground">Thank you, Elder.</p>
                <p className="text-sm text-muted-foreground mt-1">Your guidance protects the tradition.</p>
                <button
                  type="button"
                  onClick={() => { setElderFlagPostId(null); setElderFlagSubmitted(false); }}
                  className="mt-4 px-6 py-2 bg-highlight text-white rounded-xl text-sm font-bold hover:bg-yellow-600 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">🔱 Flag as Culturally Inaccurate</h3>
                  <button type="button" onClick={() => setElderFlagPostId(null)} className="text-muted-foreground hover:text-foreground">✕</button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your concern will be reviewed by our moderation team. This flag is not visible to the post author or community.
                </p>
                <textarea
                  value={elderFlagReason}
                  onChange={(e) => setElderFlagReason(e.target.value)}
                  rows={3}
                  placeholder="Please describe the cultural inaccuracy…"
                  className="w-full bg-muted/50 border border-border rounded-xl p-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-highlight resize-none"
                />
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setElderFlagPostId(null)} className="px-4 py-2 border border-border text-foreground rounded-xl text-sm font-bold hover:bg-muted transition-colors">Cancel</button>
                  <button
                    type="button"
                    disabled={!elderFlagReason.trim()}
                    onClick={async () => {
                      try {
                        await api.post(`/forum/posts/${elderFlagPostId}/elder-flag`, { reason: elderFlagReason.trim() });
                        setElderFlagSubmitted(true);
                      } catch { setElderFlagPostId(null); }
                    }}
                    className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors disabled:opacity-50"
                  >
                    Submit Flag
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* F9-705: Micro-Tip Modal */}
      {tipPostId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-sm p-6 space-y-5">
            {tipSuccess ? (
              <div className="text-center py-4 space-y-3">
                <div className="text-4xl">🙏🏾</div>
                <p className="font-bold text-foreground text-lg">Àṣẹ!</p>
                <p className="text-muted-foreground text-sm">Your appreciation has been sent.</p>
                <button
                  type="button"
                  onClick={() => { setTipPostId(null); setTipSuccess(false); }}
                  className="w-full py-3 bg-highlight text-white rounded-xl font-bold hover:bg-yellow-600 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">💝 Support This Wisdom</h3>
                  <button type="button" onClick={() => setTipPostId(null)} className="text-muted-foreground hover:text-foreground">✕</button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Send a small token of appreciation to the Babaláwo who shared this wisdom.
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Choose amount (₦)</label>
                  <div className="flex gap-2">
                    {[500, 1000, 2000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTipAmount(amt)}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-colors ${tipAmount === amt ? 'bg-highlight text-white border-highlight' : 'border-border text-foreground hover:bg-muted'}`}
                      >
                        ₦{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setTipPostId(null)} className="flex-1 py-3 border border-border text-foreground rounded-xl text-sm font-bold hover:bg-muted transition-colors">
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={tipPending}
                    onClick={async () => {
                      if (!tipPostId) return;
                      setTipPending(true);
                      try {
                        await api.post(`/forum/posts/${tipPostId}/tip`, { amount: tipAmount, currency: 'NGN' });
                        setTipSuccess(true);
                      } catch {
                        setTipPostId(null);
                      } finally {
                        setTipPending(false);
                      }
                    }}
                    className="flex-1 py-3 bg-highlight text-white rounded-xl text-sm font-bold hover:bg-yellow-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {tipPending ? (
                      <><Loader2 size={14} className="animate-spin" /> Sending…</>
                    ) : (
                      `Send ₦${tipAmount.toLocaleString()}`
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* F9-902: Cultural Orientation Gate */}
      <CulturalOrientationGate
        open={orientationGateOpen}
        categoryName={thread?.category?.name}
        onComplete={(passed) => {
          setOrientationGateOpen(false);
          if (passed && pendingReply) {
            createPostMutation.mutate(pendingReply);
            setPendingReply(null);
            setReplyText('');
          }
        }}
      />
    </div>
  );
};

export default ThreadView;
