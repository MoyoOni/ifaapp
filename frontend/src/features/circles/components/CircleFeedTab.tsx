import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Pin,
  Heart,
  MessageCircle,
  Loader2,
  Crown,
  Lock,
} from 'lucide-react';
import api from '@/lib/api';
import { FeedPost } from '../types/circle.types';

interface CircleFeedTabProps {
  circleId?: string;
  feedPosts: FeedPost[];
  isMember: boolean;
  isPatron: boolean;
  newPost: string;
  onPostChange: (content: string) => void;
  onPostSubmit: (patronOnly?: boolean) => void;
  isCreatingPost: boolean;
  userInitial: string;
}

interface FeedComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  content: string;
  createdAt: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// Real like-toggle + comment thread for a single post. Was previously two
// static, non-interactive counts with no backend at all.
const PostReactions: React.FC<{ post: FeedPost; circleId?: string }> = ({ post, circleId }) => {
  const queryClient = useQueryClient();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');

  const invalidateFeed = () => queryClient.invalidateQueries({ queryKey: ['circle-feed', circleId] });

  const likeMutation = useMutation({
    mutationFn: () => api.post(`/circles/feed/${post.id}/like`),
    onSuccess: invalidateFeed,
  });

  const { data: comments = [], isLoading: loadingComments } = useQuery<FeedComment[]>({
    queryKey: ['circle-feed-comments', post.id],
    queryFn: async () => (await api.get(`/circles/feed/${post.id}/comments`)).data,
    enabled: commentsOpen,
  });

  const addCommentMutation = useMutation({
    mutationFn: () => api.post(`/circles/feed/${post.id}/comments`, { content: commentDraft }),
    onSuccess: () => {
      setCommentDraft('');
      queryClient.invalidateQueries({ queryKey: ['circle-feed-comments', post.id] });
      invalidateFeed();
    },
  });

  return (
    <div className="mt-3">
      <div className="flex items-center gap-4 text-muted-foreground">
        <button
          type="button"
          onClick={() => likeMutation.mutate()}
          disabled={likeMutation.isPending}
          className={`flex items-center gap-1 transition-colors ${post.likedByMe ? 'text-red-500' : 'hover:text-red-500'}`}
          aria-pressed={!!post.likedByMe}
        >
          <Heart size={16} className={post.likedByMe ? 'fill-current' : ''} />
          <span className="text-sm">{post.likes}</span>
        </button>
        <button
          type="button"
          onClick={() => setCommentsOpen((o) => !o)}
          className="flex items-center gap-1 hover:text-blue-500 transition-colors"
        >
          <MessageCircle size={16} />
          <span className="text-sm">{post.comments}</span>
        </button>
      </div>

      {commentsOpen && (
        <div className="mt-3 pl-2 border-l-2 border-border space-y-3">
          {loadingComments ? (
            <Loader2 size={14} className="animate-spin text-muted-foreground" />
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted-foreground">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="text-sm">
                <span className="font-semibold text-foreground">{c.authorName}</span>{' '}
                <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                <p className="text-foreground/90">{c.content}</p>
              </div>
            ))
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-1.5 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="button"
              onClick={() => commentDraft.trim() && addCommentMutation.mutate()}
              disabled={!commentDraft.trim() || addCommentMutation.isPending}
              className="p-2 text-primary hover:bg-primary/10 rounded-lg disabled:opacity-50 transition-colors"
              aria-label="Post comment"
            >
              {addCommentMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const CircleFeedTab: React.FC<CircleFeedTabProps> = ({
  circleId,
  feedPosts,
  isMember,
  isPatron,
  newPost,
  onPostChange,
  onPostSubmit,
  isCreatingPost,
  userInitial,
}) => {
  const navigate = useNavigate();
  const [patronOnly, setPatronOnly] = useState(false);

  return (
    <div className="space-y-6">
      {/* New Post Input */}
      {isMember && (
        <div className="flex gap-4 pb-6 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold">{userInitial}</span>
          </div>
          <div className="flex-1">
            <textarea
              value={newPost}
              onChange={(e) => onPostChange(e.target.value)}
              placeholder="Share something with the circle..."
              className="w-full p-3 bg-muted/50 border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-card transition-all"
              rows={3}
            />
            <div className="flex items-center justify-between mt-2">
              {isPatron && (
                <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground select-none">
                  <input
                    type="checkbox"
                    checked={patronOnly}
                    onChange={(e) => setPatronOnly(e.target.checked)}
                    className="accent-amber-500"
                  />
                  <Crown size={14} className="text-amber-500" />
                  Patron-only post
                </label>
              )}
              {!isPatron && <span />}
              <button
                onClick={() => { onPostSubmit(patronOnly); setPatronOnly(false); }}
                disabled={!newPost.trim() || isCreatingPost}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCreatingPost ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed Posts */}
      {feedPosts.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare size={48} className="mx-auto mb-4 text-stone-300" />
          <p className="text-stone-500 font-medium">No posts yet</p>
          <p className="text-stone-400 text-sm">Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {feedPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-xl ${
                post.isPinned
                  ? 'bg-highlight/5 border border-highlight/20'
                  : post.patronOnly
                  ? 'bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-800/30'
                  : 'bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {post.isPinned && (
                  <div className="flex items-center gap-1 text-highlight text-xs font-medium">
                    <Pin size={12} />
                    Pinned
                  </div>
                )}
                {post.patronOnly && (
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                    <Crown size={12} />
                    Patron exclusive
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => navigate(`/profile/${post.authorId}`)} className="flex-shrink-0 hover:opacity-80 transition-opacity">
                  {post.authorAvatar ? (
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold text-sm">
                        {post.authorName.charAt(0)}
                      </span>
                    </div>
                  )}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <button type="button" onClick={() => navigate(`/profile/${post.authorId}`)} className="font-semibold text-foreground hover:underline">{post.authorName}</button>
                    <span className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</span>
                  </div>
                  <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                  <PostReactions post={post} circleId={circleId} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Non-member patron teaser */}
      {!isMember && feedPosts.some(p => p.patronOnly) && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl text-sm text-amber-800 dark:text-amber-300">
          <Lock size={16} className="flex-shrink-0" />
          <span>Some posts in this circle are exclusive to Patrons. Join and become a Patron to unlock them.</span>
        </div>
      )}
    </div>
  );
};
