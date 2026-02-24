import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Search, 
  Send, 
  ArrowLeft, 
  Paperclip, 
  Smile, 
  MoreVertical,
  Phone,
  Video,
  Archive,
  UserPlus
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import { useNavigate, useParams } from 'react-router-dom';

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  isOnline: boolean;
  isArchived: boolean;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

const FunctionalMessaging: React.FC = () => {
  const navigate = useNavigate();
  const { otherUserId } = useParams<{ otherUserId: string }>();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'inbox' | 'thread'>('inbox');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const conversations: Conversation[] = [
    {
      id: 'user-123',
      name: 'Babalawo Adeyemi',
      avatar: '',
      lastMessage: 'Thank you for your consultation request. I\'ll review your spiritual concerns.',
      timestamp: new Date(Date.now() - 3600000),
      unreadCount: 2,
      isOnline: true,
      isArchived: false
    },
    {
      id: 'user-456',
      name: 'Marketplace Vendor',
      avatar: '',
      lastMessage: 'Your order #ORD-789 has been shipped and will arrive within 2-3 business days.',
      timestamp: new Date(Date.now() - 86400000),
      unreadCount: 0,
      isOnline: false,
      isArchived: false
    },
    {
      id: 'user-789',
      name: 'Spiritual Circle',
      avatar: '',
      lastMessage: 'The monthly Ifa study session is scheduled for next Friday at 7 PM.',
      timestamp: new Date(Date.now() - 172800000),
      unreadCount: 0,
      isOnline: true,
      isArchived: false
    }
  ];

  const messages: Message[] = [
    {
      id: 'msg-1',
      senderId: otherUserId || 'user-123',
      content: 'Good day! Thank you for reaching out. I understand you\'d like spiritual guidance regarding your recent concerns.',
      timestamp: new Date(Date.now() - 3600000),
      read: true
    },
    {
      id: 'msg-2',
      senderId: user?.id || 'current-user',
      content: 'Hello Babalawo, thank you for responding. I\'ve been experiencing some challenges with my business lately.',
      timestamp: new Date(Date.now() - 3500000),
      read: true
    },
    {
      id: 'msg-3',
      senderId: otherUserId || 'user-123',
      content: 'I see. Business challenges can indeed have spiritual dimensions. I recommend we schedule a proper consultation.',
      timestamp: new Date(Date.now() - 3400000),
      read: false
    }
  ];

  // Set active view based on route
  useEffect(() => {
    if (otherUserId) {
      setActiveView('thread');
    } else {
      setActiveView('inbox');
    }
  }, [otherUserId]);

  const filteredConversations = conversations.filter(conv => 
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log('Sending message:', message);
      setMessage('');
      // In real app: send message via API
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectConversation = (userId: string) => {
    navigate(`/messages/${userId}`);
  };

  const handleBackToInbox = () => {
    navigate('/messages');
  };

  const currentConversation = conversations.find(c => c.id === otherUserId);

  // Inbox View
  if (activeView === 'inbox') {
    return (
      <div className="flex flex-col h-full bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 bg-gradient-to-r from-stone-50 to-white">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-stone-900">Messages</h1>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
                <UserPlus size={20} className="text-stone-600" />
              </button>
              <button className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
                <Archive size={20} className="text-stone-600" />
              </button>
            </div>
          </div>
          
          {/* Search */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={20} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {filteredConversations.map((conversation) => (
                <div 
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation.id)}
                  className="p-4 hover:bg-stone-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center">
                        <span className="text-stone-600 font-bold">
                          {conversation.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {conversation.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-stone-900 truncate">{conversation.name}</h3>
                        <span className="text-xs text-stone-500 whitespace-nowrap">
                          {formatTime(conversation.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-stone-600 truncate">{conversation.lastMessage}</p>
                        {conversation.unreadCount > 0 && (
                          <span className="flex-shrink-0 w-2 h-2 bg-highlight rounded-full"></span>
                        )}
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-highlight text-white text-xs font-bold rounded-full mt-1">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <MessageSquare size={48} className="text-stone-300 mb-4" />
              <h3 className="text-lg font-bold text-stone-900 mb-2">No conversations found</h3>
              <p className="text-stone-600">
                {searchTerm ? 'Try adjusting your search' : 'Start a conversation by messaging someone'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Thread View
  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-stone-200 bg-gradient-to-r from-stone-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleBackToInbox}
              className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} className="text-stone-600" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-stone-200 rounded-full flex items-center justify-center">
                  <span className="text-stone-600 font-bold">
                    {currentConversation?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                {currentConversation?.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              
              <div>
                <h2 className="font-bold text-stone-900">{currentConversation?.name}</h2>
                <span className={`text-xs ${currentConversation?.isOnline ? 'text-green-600' : 'text-stone-500'}`}>
                  {currentConversation?.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
              <Phone size={18} className="text-stone-600" />
            </button>
            <button className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
              <Video size={18} className="text-stone-600" />
            </button>
            <button className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
              <MoreVertical size={18} className="text-stone-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isOwnMessage = msg.senderId === user?.id;
          
          return (
            <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? '' : 'order-1'}`}>
                <div className={`rounded-2xl px-4 py-2 ${
                  isOwnMessage 
                    ? 'bg-highlight text-white rounded-br-md' 
                    : 'bg-stone-100 text-stone-900 rounded-bl-md'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <div className={`flex items-center gap-1 mt-1 text-xs ${
                    isOwnMessage ? 'text-yellow-100' : 'text-stone-500'
                  }`}>
                    <span>{formatTime(msg.timestamp)}</span>
                  </div>
                </div>
              </div>
              
              {!isOwnMessage && (
                <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center mx-2 order-2">
                  <span className="text-stone-600 text-sm font-bold">
                    {currentConversation?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          );
        })}
        <div />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-stone-200 bg-stone-50">
        <div className="flex items-end gap-2">
          <button className="p-2 hover:bg-stone-200 rounded-xl transition-colors">
            <Paperclip size={20} className="text-stone-600" />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent resize-none"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button className="absolute right-2 bottom-2 p-1 hover:bg-stone-200 rounded-lg">
              <Smile size={18} className="text-stone-500" />
            </button>
          </div>
          <button 
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className={`p-3 rounded-xl transition-colors ${
              message.trim() 
                ? 'bg-highlight text-white hover:bg-yellow-600' 
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FunctionalMessaging;