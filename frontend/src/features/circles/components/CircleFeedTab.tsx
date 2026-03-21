import React from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Pin,
  Heart,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import { FeedPost } from '../types/circle.types';

interface CircleFeedTabProps {
  feedPosts: FeedPost[];
  isMember: boolean;
  newPost: string;
  onPostChange: (content: string) => void;
  onPostSubmit: () => void;
  isCreatingPost: boolean;
  userInitial: string;
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

export const CircleFeedTab: React.FC<CircleFeedTabProps> = ({
  feedPosts,
  isMember,
  newPost,
  onPostChange,
  onPostSubmit,
  isCreatingPost,
  userInitial,
}) => {
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
            <div className="flex justify-end mt-2">
              <button
                onClick={onPostSubmit}
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
                post.isPinned ? 'bg-highlight/5 border border-highlight/20' : 'bg-muted/50'
              }`}
            >
              {post.isPinned && (
                <div className="flex items-center gap-1 text-highlight text-xs font-medium mb-2">
                  <Pin size={12} />
                  Pinned Post
                </div>
              )}
              <div className="flex gap-3">
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
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{post.authorName}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</span>
                  </div>
                  <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                  <div className="flex items-center gap-4 mt-3 text-muted-foreground">
                    <button aria-label={`Like post (${post.likes} likes)`} className="flex items-center gap-1 hover:text-red-500 transition-colors">
                      <Heart size={16} />
                      <span className="text-sm" aria-hidden="true">{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                      <MessageCircle size={16} />
                      <span className="text-sm">{post.comments}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
