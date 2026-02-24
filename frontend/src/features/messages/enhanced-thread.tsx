import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  Lock,
  Info,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Image,
  Shield,
  Timer,
  BellOff,
  Trash2,
  FileText,
  Play,
  Music
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import { useNavigate, useParams } from 'react-router-dom';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  readAt?: Date;
  attachments?: Attachment[];
  isEncrypted: boolean;
  encryptionType?: 'end-to-end' | 'server';
}

interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  name: string;
  size: string;
  thumbnail?: string;
}

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
  role?: string;
}

const EnhancedMessageThread: React.FC = () => {
  const navigate = useNavigate();
  const { otherUserId } = useParams<{ otherUserId: string }>();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isTyping] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  // Mock data
  const mockParticipants: Participant[] = [
    {
      id: otherUserId || 'user-123',
      name: 'Babalawo Adeyemi',
      avatar: '',
      isOnline: true,
      lastSeen: new Date(),
      role: 'Verified Practitioner'
    }
  ];

  const mockMessages: Message[] = [
    {
      id: 'msg-1',
      senderId: otherUserId || 'user-123',
      content: 'Good day! Thank you for reaching out. I understand you\'d like spiritual guidance regarding your recent concerns. Could you share more details about what\'s troubling you?',
      timestamp: new Date(Date.now() - 3600000),
      read: true,
      readAt: new Date(Date.now() - 3500000),
      isEncrypted: true,
      encryptionType: 'end-to-end'
    },
    {
      id: 'msg-2',
      senderId: user?.id || 'current-user',
      content: 'Hello Babalawo, thank you for responding. I\'ve been experiencing some challenges with my business lately and I\'m seeking spiritual guidance on how to move forward positively.',
      timestamp: new Date(Date.now() - 3500000),
      read: true,
      isEncrypted: true,
      encryptionType: 'end-to-end'
    },
    {
      id: 'msg-3',
      senderId: otherUserId || 'user-123',
      content: 'I see. Business challenges can indeed have spiritual dimensions. I recommend we schedule a proper consultation where I can perform the appropriate divination for your situation. Would tomorrow at 2 PM work for you?',
      timestamp: new Date(Date.now() - 3400000),
      read: false,
      isEncrypted: true,
      encryptionType: 'end-to-end'
    }
  ];

  useEffect(() => {
    setParticipants(mockParticipants);
    setMessages(mockMessages);
    scrollToBottom();
  }, [otherUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        senderId: user?.id || 'current-user',
        content: message.trim(),
        timestamp: new Date(),
        read: false,
        isEncrypted: true,
        encryptionType: 'end-to-end'
      };

      setMessages(prev => [...prev, newMessage]);
      setMessage('');
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (window.confirm('Delete this message?')) {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    }
    setActiveMenu(null);
  };

  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  const renderMessageStatus = (msg: Message) => {
    if (msg.senderId !== user?.id) return null;

    if (msg.read) {
      return <CheckCheck size={16} className="text-blue-500" />;
    }
    return <Check size={16} className="text-stone-400" />;
  };

  const otherParticipant = participants[0];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-stone-200 bg-gradient-to-r from-stone-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/messages')}
              className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} className="text-stone-600" />
            </button>

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-stone-200 rounded-full flex items-center justify-center">
                  <span className="text-stone-600 font-bold">
                    {otherParticipant?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                {otherParticipant?.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>

              <div>
                <h2 className="font-bold text-stone-900">{otherParticipant?.name}</h2>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${otherParticipant?.isOnline ? 'text-green-600' : 'text-stone-500'}`}>
                    {otherParticipant?.isOnline ? 'Online' : `Last seen ${formatTime(otherParticipant?.lastSeen || new Date())}`}
                  </span>
                  <Shield size={12} className="text-green-500" />
                  <Lock size={12} className="text-stone-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-stone-100 rounded-xl transition-colors opacity-50 cursor-not-allowed" title="Coming soon">
              <Phone size={18} className="text-stone-600" />
            </button>
            <button className="p-2 hover:bg-stone-100 rounded-xl transition-colors opacity-50 cursor-not-allowed" title="Coming soon">
              <Video size={18} className="text-stone-600" />
            </button>
            <button
              onClick={() => setShowInfoPanel(!showInfoPanel)}
              className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
            >
              <Info size={18} className="text-stone-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      {showInfoPanel && (
        <div className="p-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-stone-900">Chat Information</h3>
            <button
              onClick={() => setShowInfoPanel(false)}
              className="p-1 hover:bg-stone-200 rounded-lg"
            >
              <Info size={16} className="text-stone-500" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-stone-600">Encryption</span>
              <span className="text-green-600 font-medium">End-to-end encrypted</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-600">Notifications</span>
              <button className="p-1 hover:bg-stone-200 rounded">
                <BellOff size={16} className="text-stone-500" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-600">Auto-delete</span>
              <button className="p-1 hover:bg-stone-200 rounded">
                <Timer size={16} className="text-stone-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const showDate = index === 0 || !isSameDay(msg.timestamp, messages[index - 1].timestamp);
          const isOwnMessage = msg.senderId === user?.id;

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="px-3 py-1 bg-stone-100 text-stone-600 text-xs font-medium rounded-full">
                    {formatDate(msg.timestamp)}
                  </span>
                </div>
              )}

              <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}>
                <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                  <div className={`rounded-2xl px-4 py-2 ${isOwnMessage
                      ? 'bg-highlight text-white rounded-br-md'
                      : 'bg-stone-100 text-stone-900 rounded-bl-md'
                    }`}>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mb-2 space-y-2">
                        {msg.attachments.map(att => (
                          <div key={att.id} className="rounded-lg overflow-hidden border border-white/20 bg-black/5">
                            {att.type === 'image' && (
                              <img src={att.url} alt={att.name} className="w-full h-auto max-h-60 object-cover" />
                            )}
                            {att.type === 'video' && (
                              <div className="flex items-center gap-3 p-3 bg-stone-800 text-white">
                                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                                  <Video size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate">{att.name}</p>
                                  <p className="text-[10px] opacity-60 tracking-wider">VIDEO • {att.size}</p>
                                </div>
                                <button className="p-2 hover:bg-white/10 rounded-lg"><Play size={16} /></button>
                              </div>
                            )}
                            {att.type === 'audio' && (
                              <div className="flex items-center gap-3 p-3 bg-stone-100 text-stone-900">
                                <div className="w-10 h-10 bg-stone-200 rounded-full flex items-center justify-center text-highlight">
                                  <Music size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate">{att.name}</p>
                                  <p className="text-[10px] text-stone-400 tracking-wider">AUDIO • {att.size}</p>
                                </div>
                                <button className="p-2 hover:bg-stone-200 rounded-lg text-stone-600"><Play size={16} /></button>
                              </div>
                            )}
                            {att.type === 'document' && (
                              <div className="flex items-center gap-3 p-3 bg-white text-stone-900">
                                <div className="w-10 h-10 bg-stone-50 rounded-full flex items-center justify-center text-blue-500">
                                  <FileText size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate">{att.name}</p>
                                  <p className="text-[10px] text-stone-400 tracking-wider">DOCUMENT • {att.size}</p>
                                </div>
                                <button className="p-2 hover:bg-stone-50 rounded-lg text-stone-600"><Paperclip size={16} /></button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <div className={`flex items-center gap-1 mt-1 text-xs ${isOwnMessage ? 'text-yellow-100' : 'text-stone-500'
                      }`}>
                      <span>{formatTime(msg.timestamp)}</span>
                      {renderMessageStatus(msg)}
                    </div>
                  </div>
                </div>

                {isOwnMessage && (
                  <div className="relative self-center order-1">
                    <button
                      onClick={() => setActiveMenu(activeMenu === msg.id ? null : msg.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-stone-400 hover:text-stone-600 transition-all"
                      title="Message options"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {activeMenu === msg.id && (
                      <div className="absolute right-0 bottom-full mb-2 w-32 bg-white rounded-xl shadow-xl border border-stone-100 py-1 z-10 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-stone-50 flex items-center gap-2 font-medium"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {!isOwnMessage && (
                  <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center mx-2 order-2">
                    <span className="text-stone-600 text-sm font-bold">
                      {otherParticipant?.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-stone-100 rounded-2xl rounded-bl-md px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-stone-200 bg-stone-50">
        <div className="flex items-end gap-2">
          <button className="p-2 hover:bg-stone-200 rounded-xl transition-colors">
            <Paperclip size={20} className="text-stone-600" />
          </button>
          <button className="p-2 hover:bg-stone-200 rounded-xl transition-colors">
            <Image size={20} className="text-stone-600" />
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
            className={`p-3 rounded-xl transition-colors ${message.trim()
                ? 'bg-highlight text-white hover:bg-yellow-600'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
          >
            <Send size={18} />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-stone-500">
          <div className="flex items-center gap-3">
            <span>End-to-end encrypted</span>
            <Shield size={12} />
          </div>
          <span>Press Enter to send</span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMessageThread;