import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Search, Plus, MoreHorizontal, User, Lock, X } from 'lucide-react';
import { logger } from '@/shared/utils/logger';
import { motion, AnimatePresence } from 'framer-motion';
import { getInbox } from '../message-service';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useSubscription } from '@/features/subscription/use-subscription';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { isDevModeActive } from '@/shared/utils/dev-mode';

interface Conversation {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender: any;
  receiver: any;
  otherUser: any;
  unreadCount: number;
}

interface MessageInboxProps {
  userId: string;
  onSelectConversation?: (otherUserId: string) => void;
}

/**
 * Message Inbox Component
 * Refined with premium aesthetics and Framer Motion animations.
 */
const MessageInbox: React.FC<MessageInboxProps> = ({ userId, onSelectConversation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showComposer, setShowComposer] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const composerRef = useRef<HTMLDivElement>(null);
  const { isDevoted } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userSearch.trim() || userSearch.length < 2) { setUserResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get('/users', { params: { search: userSearch, limit: 8 } });
        setUserResults(res.data ?? []);
      } catch {
        setUserResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const { data: limitStatus } = useQuery({
    queryKey: ['message-limit-status'],
    queryFn: () => api.get('/messaging/limit-status').then(r => r.data),
    enabled: !isDevoted,
    staleTime: 60 * 1000,
  });

  const handleNewMessage = () => {
    if (!isDevoted && limitStatus && limitStatus.remaining === 0) {
      navigate('/pricing');
      return;
    }
    setShowComposer(true);
    setUserSearch('');
    setUserResults([]);
  };

  const handleSelectUser = (targetUserId: string) => {
    setShowComposer(false);
    if (onSelectConversation) {
      onSelectConversation(targetUserId);
    } else {
      navigate(`/messages/${targetUserId}`);
    }
  };

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['message-inbox', userId],
    queryFn: async () => {
      try {
        return await getInbox(userId);
      } catch (e) {
        logger.error('Failed to fetch inbox', e);
        return [];
      }
    },
    enabled: !!userId && !isDevModeActive(),
  });

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = !searchQuery ||
      conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filter === 'all' || (filter === 'unread' && conv.unreadCount > 0);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* New Message Composer Modal */}
      {showComposer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div ref={composerRef} className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-bold text-foreground">New Message</h3>
              <button type="button" onClick={() => setShowComposer(false)} aria-label="Close" className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  autoFocus
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-9 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-foreground text-sm outline-none focus:border-highlight"
                />
              </div>
              {searching && <p className="text-xs text-muted-foreground text-center py-2">Searching...</p>}
              {!searching && userSearch.length >= 2 && userResults.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">No users found</p>
              )}
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {userResults.map((u: any) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectUser(u.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-highlight/20 flex items-center justify-center text-highlight font-bold flex-shrink-0">
                      {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : (u.yorubaName || u.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{u.yorubaName || u.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{u.role?.toLowerCase()}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. Inbox Controls */}
      <div className="p-6 border-b border-border/60 bg-muted/500">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-highlight transition-colors" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border text-foreground rounded-2xl outline-none focus:ring-4 focus:ring-highlight/10 focus:border-highlight transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex bg-muted p-1 rounded-xl w-full md:w-auto">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'unread' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Unread
              </button>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleNewMessage}
                className="p-3 bg-highlight text-white rounded-xl shadow-lg shadow-highlight/20 hover:bg-yellow-600 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                aria-label="Create new message"
              >
                {!isDevoted && limitStatus?.remaining === 0
                  ? <Lock size={20} />
                  : <Plus size={20} />
                }
              </button>
              {!isDevoted && limitStatus && (
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {limitStatus.remaining} of {limitStatus.limit} left this month
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Demo Mode Banner - we determine this dynamically based on the conversation IDs */}
      {(conversations.length > 0 && conversations.some(conv => conv.id.startsWith('demo-') || conv.id.startsWith('seed-'))) && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-6 py-2">
          <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
            Demo mode — Showing sample conversations. Messages are stored in your browser session.
          </p>
        </div>
      )}

      {/* 2. Conversations List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <LoadingSpinner size="lg" variant="highlight" />
              <span className="text-muted-foreground font-medium">Opening Sanctuary...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center px-6"
            >
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <MessageSquare size={40} className="text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No conversations found</h3>
              <p className="text-muted-foreground max-w-xs">
                {searchQuery ? "Try searching for something else." : "Start a secure conversation with your Babalawo or Community."}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.05 } }
              }}
              className="divide-y divide-border/40"
            >
              {filteredConversations.map((conv) => (
                <motion.button
                  key={conv.id}
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    visible: { opacity: 1, x: 0 }
                  }}
                  onClick={() => onSelectConversation?.(conv.otherUser.id)}
                  className="w-full flex items-center gap-4 p-6 hover:bg-muted/50 transition-all group relative"
                >
                  {/* Unread Indicator Dot */}
                  {conv.unreadCount > 0 && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-12 bg-highlight rounded-full" />
                  )}

                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground overflow-hidden border-2 border-card shadow-sm transition-all group-hover:border-highlight/30">
                      {conv.otherUser.avatar ? (
                        <img src={conv.otherUser.avatar} alt={conv.otherUser.name} className="w-full h-full object-cover" />
                      ) : (
                        <User size={32} className="opacity-30" />
                      )}
                    </div>
                    {conv.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-highlight text-white text-[10px] font-bold w-6 h-6 rounded-lg border-2 border-card flex items-center justify-center shadow-md">
                        {conv.unreadCount}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`text-lg font-bold truncate transition-colors ${conv.unreadCount > 0 ? 'text-foreground group-hover:text-highlight' : 'text-muted-foreground group-hover:text-foreground'}`}>
                        {conv.otherUser.name}
                      </h3>
                      <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                        {new Date(conv.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                      {conv.content}
                    </p>
                  </div>

                  {/* Action Hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground" aria-label="More options">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MessageInbox;
