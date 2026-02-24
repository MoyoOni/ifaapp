import React, { useState } from 'react';
import { 
  MessageSquare, 
  Search, 
  Plus, 
  Archive, 
  MoreHorizontal, 
  UserPlus,
  Lock,
  Bell,
  Settings,
  ArrowLeft,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';

interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    avatar?: string;
    isOnline: boolean;
    lastSeen?: string;
  }[];
  lastMessage: {
    content: string;
    senderId: string;
    timestamp: Date;
    read: boolean;
  };
  unreadCount: number;
  isArchived: boolean;
  isMuted: boolean;
  privacyLevel: 'private' | 'group' | 'circle';
}

const EnhancedMessageInbox: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'private' | 'groups'>('all');
  const [showArchived, setShowArchived] = useState(false);

  // Mock conversation data
  const conversations: Conversation[] = [
    {
      id: 'conv-1',
      participants: [
        {
          id: 'user-123',
          name: 'Babalawo Adeyemi',
          avatar: '',
          isOnline: true,
          lastSeen: new Date().toISOString()
        }
      ],
      lastMessage: {
        content: 'Thank you for your consultation request. I\'ll review your spiritual concerns and prepare accordingly.',
        senderId: 'user-123',
        timestamp: new Date(Date.now() - 3600000),
        read: false
      },
      unreadCount: 2,
      isArchived: false,
      isMuted: false,
      privacyLevel: 'private'
    },
    {
      id: 'conv-2',
      participants: [
        {
          id: 'user-456',
          name: 'Spiritual Circle - Ifa Wisdom',
          avatar: '',
          isOnline: false,
          lastSeen: new Date(Date.now() - 7200000).toISOString()
        }
      ],
      lastMessage: {
        content: 'The monthly Ifa study session is scheduled for next Friday at 7 PM.',
        senderId: 'user-456',
        timestamp: new Date(Date.now() - 86400000),
        read: true
      },
      unreadCount: 0,
      isArchived: false,
      isMuted: true,
      privacyLevel: 'group'
    },
    {
      id: 'conv-3',
      participants: [
        {
          id: 'user-789',
          name: 'Marketplace Vendor - Sacred Items',
          avatar: '',
          isOnline: true,
          lastSeen: new Date().toISOString()
        }
      ],
      lastMessage: {
        content: 'Your order #ORD-789 has been shipped and will arrive within 2-3 business days.',
        senderId: 'user-789',
        timestamp: new Date(Date.now() - 172800000),
        read: true
      },
      unreadCount: 0,
      isArchived: false,
      isMuted: false,
      privacyLevel: 'private'
    }
  ];
  
  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      try {
        // In a real app, we would call an API endpoint to delete the conversation
        // For now, we'll simulate the deletion by just returning the ID
        return conversationId;
      } catch (error) {
        console.error('Error deleting conversation:', error);
        throw error;
      }
    },
    onSuccess: (_conversationId) => {
      // This will be called after a successful deletion
      // We can invalidate the query to refetch the conversations
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.participants.some(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || conv.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && conv.unreadCount > 0) ||
      (filter === 'private' && conv.privacyLevel === 'private') ||
      (filter === 'groups' && conv.privacyLevel === 'group');
    
    const matchesArchive = showArchived || !conv.isArchived;
    
    return matchesSearch && matchesFilter && matchesArchive;
  });

  const getPrivacyIcon = (level: string) => {
    switch (level) {
      case 'private': return Lock;
      case 'group': return UserPlus;
      default: return MessageSquare;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusIndicator = (participant: Conversation['participants'][0]) => {
    if (participant.isOnline) {
      return <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>;
    }
    return (
      <div className="text-xs text-stone-500" title={`Last seen: ${new Date(participant.lastSeen || '').toLocaleString()}`}>
        {formatTime(new Date(participant.lastSeen || ''))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-stone-200 bg-gradient-to-r from-stone-50 to-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} className="text-stone-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Messages</h1>
              <p className="text-stone-600 text-sm">{conversations.length} conversations</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
              <Settings size={20} className="text-stone-600" />
            </button>
            <button className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
              <Bell size={20} className="text-stone-600" />
            </button>
            <button className="p-2 bg-highlight text-white rounded-xl hover:bg-yellow-600 transition-colors">
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={20} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="private">Private</option>
              <option value="groups">Groups</option>
            </select>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-3 py-2 border rounded-xl transition-colors ${
                showArchived 
                  ? 'bg-highlight text-white border-highlight' 
                  : 'border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Archive size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          <div className="divide-y divide-stone-100">
            {filteredConversations.map((conversation) => {
              const otherParticipant = conversation.participants[0];
              const PrivacyIcon = getPrivacyIcon(conversation.privacyLevel);
              const isUnread = conversation.unreadCount > 0;
              
              return (
                <div 
                  key={conversation.id}
                  onClick={() => navigate(`/messages/${otherParticipant.id}`)}
                  className="p-4 hover:bg-stone-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center">
                        <span className="text-stone-600 font-bold">
                          {otherParticipant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {getStatusIndicator(otherParticipant)}
                      {conversation.isMuted && (
                        <div className="absolute -bottom-1 -right-1 bg-stone-100 p-1 rounded-full">
                          <Bell size={12} className="text-stone-400" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-bold truncate ${isUnread ? 'text-stone-900' : 'text-stone-700'}`}>
                            {otherParticipant.name}
                          </h3>
                          <PrivacyIcon size={14} className="text-stone-400" />
                          {otherParticipant.isOnline && (
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-stone-500 whitespace-nowrap">
                            {formatTime(conversation.lastMessage.timestamp)}
                          </span>
                          {conversation.isArchived && (
                            <Archive size={14} className="text-stone-400" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <p className={`text-sm truncate ${isUnread ? 'text-stone-800 font-medium' : 'text-stone-600'}`}>
                          {conversation.lastMessage.senderId === user?.id ? 'You: ' : ''}
                          {conversation.lastMessage.content}
                        </p>
                        {isUnread && (
                          <span className="flex-shrink-0 w-2 h-2 bg-highlight rounded-full"></span>
                        )}
                      </div>
                      
                      {conversation.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-highlight text-white text-xs font-bold rounded-full mt-1">
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="relative">
                        <button className="p-1 hover:bg-stone-200 rounded-lg">
                          <MoreHorizontal size={16} className="text-stone-500" />
                        </button>
                                          
                        {/* Delete dropdown */}
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-stone-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Are you sure you want to delete this conversation?')) {
                                deleteConversationMutation.mutate(conversation.id);
                              }
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-500 rounded-b-lg flex items-center gap-2"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageSquare size={48} className="text-stone-300 mb-4" />
            <h3 className="text-lg font-bold text-stone-900 mb-2">
              {searchTerm || filter !== 'all' ? 'No conversations found' : 'No messages yet'}
            </h3>
            <p className="text-stone-600 mb-6">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Start a conversation by messaging someone'}
            </p>
            {!searchTerm && filter === 'all' && (
              <button className="px-4 py-2 bg-highlight text-white font-bold rounded-xl hover:bg-yellow-600 transition-colors">
                Start New Conversation
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-stone-200 bg-stone-50">
        <div className="flex justify-center gap-4">
          <button className="flex items-center gap-2 px-3 py-2 text-stone-600 hover:text-stone-900 transition-colors">
            <UserPlus size={18} />
            <span className="text-sm font-medium">New Chat</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-stone-600 hover:text-stone-900 transition-colors">
            <Archive size={18} />
            <span className="text-sm font-medium">Archived</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMessageInbox;