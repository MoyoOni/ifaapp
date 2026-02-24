import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Search, Plus, MoreHorizontal, User } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { motion, AnimatePresence } from 'framer-motion';

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

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['message-inbox', userId],
    queryFn: async () => {
      let apiConversations: Conversation[] = [];
      try {
        const response = await api.get(`/messaging/inbox/${userId}`);
        apiConversations = response.data || [];
      } catch (e) {
        logger.warn('Using demo inbox');
      }

      if (apiConversations.length > 0) {
        return apiConversations;
      }

      return [];
    },
    enabled: !!userId,
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
      {/* 1. Inbox Controls */}
      <div className="p-6 border-b border-stone-100 bg-white/50">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-highlight transition-colors" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-2xl outline-none focus:ring-4 focus:ring-highlight/10 focus:border-highlight transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex bg-stone-100 p-1 rounded-xl w-full md:w-auto">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'all' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'unread' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                Unread
              </button>
            </div>
            <button className="p-3 bg-highlight text-white rounded-xl shadow-lg shadow-highlight/20 hover:bg-yellow-600 transition-all hover:scale-105 active:scale-95">
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Conversations List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 border-4 border-highlight/20 border-t-highlight rounded-full animate-spin"></div>
              <span className="text-stone-400 font-medium">Opening Sanctuary...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center px-6"
            >
              <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-6">
                <MessageSquare size={40} className="text-stone-200" />
              </div>
              <h3 className="text-xl font-bold text-stone-800 mb-2">No conversations found</h3>
              <p className="text-stone-500 max-w-xs">
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
              className="divide-y divide-stone-50"
            >
              {filteredConversations.map((conv) => (
                <motion.button
                  key={conv.id}
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    visible: { opacity: 1, x: 0 }
                  }}
                  onClick={() => onSelectConversation?.(conv.otherUser.id)}
                  className="w-full flex items-center gap-4 p-6 hover:bg-stone-50/80 transition-all group relative"
                >
                  {/* Unread Indicator Dot */}
                  {conv.unreadCount > 0 && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-12 bg-highlight rounded-full" />
                  )}

                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center text-2xl font-bold text-stone-400 overflow-hidden border-2 border-white shadow-sm transition-all group-hover:border-highlight/30">
                      {conv.otherUser.avatar ? (
                        <img src={conv.otherUser.avatar} alt={conv.otherUser.name} className="w-full h-full object-cover" />
                      ) : (
                        <User size={32} className="opacity-30" />
                      )}
                    </div>
                    {conv.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-highlight text-white text-[10px] font-bold w-6 h-6 rounded-lg border-2 border-white flex items-center justify-center shadow-md">
                        {conv.unreadCount}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`text-lg font-bold truncate transition-colors ${conv.unreadCount > 0 ? 'text-stone-900 group-hover:text-highlight' : 'text-stone-600 group-hover:text-stone-900'}`}>
                        {conv.otherUser.name}
                      </h3>
                      <span className="text-xs font-semibold text-stone-400 whitespace-nowrap">
                        {new Date(conv.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-stone-800 font-semibold' : 'text-stone-500'}`}>
                      {conv.content}
                    </p>
                  </div>

                  {/* Action Hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-stone-200 rounded-lg text-stone-400 hover:text-stone-600">
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
