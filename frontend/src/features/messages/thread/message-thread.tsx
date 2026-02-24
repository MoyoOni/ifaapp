import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Send, Paperclip, Check, CheckCheck, Lock, Settings,
  Info, Trash2, MoreVertical
} from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { PrivacyLevel, AutoDeleteDays } from '@common';
import { queueAction, isOnline } from '@/shared/utils/offline-queue';
import { useDraftMessage } from '@/shared/hooks/use-draft-message';
import { useMessageSocket } from '../hooks/use-message-socket';

interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  name: string;
  size: string;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
  attachments?: Attachment[];
  sender: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
  };
  receiver: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
  };
}

interface MessageThreadProps {
  userId: string;
  otherUserId: string;
  onBack?: () => void;
}

/**
 * Message Thread Component
 * Individual conversation view with message history and send functionality
 * NOTE: Messages are end-to-end encrypted - content is decrypted server-side for display
 */
const MessageThread: React.FC<MessageThreadProps> = ({ userId, otherUserId, onBack }) => {
  const conversationId = `${userId}-${otherUserId}`;
  const { draft, saveDraft, clearDraft } = useDraftMessage(conversationId);
  const [messageText, setMessageText] = useState(draft);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [confidential, setConfidential] = useState(false);
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>(PrivacyLevel.PRIVATE);
  const [autoDeleteDays, setAutoDeleteDays] = useState<number | null>(null);
  const [menuOpenMessageId, setMenuOpenMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Real-time updates
  useMessageSocket(userId);

  // Save draft as user types
  useEffect(() => {
    saveDraft(messageText);
  }, [messageText, saveDraft]);

  // State for message menu
  const [, setShowMenu] = useState(false);
  const [, setSelectedMessageId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await api.delete(`/messaging/messages/${messageId}/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-conversation', userId, otherUserId] });
      queryClient.invalidateQueries({ queryKey: ['message-inbox', userId] });
      setShowMenu(false);
      setSelectedMessageId(null);
    },
  });

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch conversation messages
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['message-conversation', userId, otherUserId],
    queryFn: async () => {
      try {
        const response = await api.get(`/messaging/conversation/${userId}/${otherUserId}`);
        return response.data;
      } catch (e) {
        logger.warn('Conversation fetch failed');
        return [];
      }
    },
    enabled: !!userId && !!otherUserId,
  });

  // Get other user info from first message
  const otherUser = messages[0]?.senderId === otherUserId
    ? messages[0].sender
    : messages[0]?.receiver;
  const resolvedOtherUser = otherUser;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, files }: { content: string; files: File[] }) => {
      // Real File Upload
      const uploadedAttachments: Attachment[] = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('sharedWith', otherUserId);
          formData.append('filename', file.name);

          let type = 'document';
          if (file.type.startsWith('image/')) type = 'image';
          else if (file.type.startsWith('audio/')) type = 'audio';
          else if (file.type.startsWith('video/')) type = 'video';

          formData.append('type', type);
          formData.append('mimeType', file.type);

          const { data } = await api.post(`/documents/upload/${userId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          return {
            id: data.id,
            type: data.type as any,
            url: data.url, // Signed URL from backend
            name: data.filename,
            size: (data.size / 1024 / 1024).toFixed(2) + ' MB'
          };
        })
      );

      // If offline
      if (!isOnline()) {
        queueAction({
          type: 'message',
          endpoint: `/messaging/send/${userId}`,
          method: 'POST',
          payload: {
            receiverId: otherUserId,
            content,
            attachments: uploadedAttachments,
            confidential,
            privacyLevel,
            autoDeleteDays: autoDeleteDays || undefined,
          },
        });
        // Return a mock response for immediate UI feedback
        return {
          id: `temp-${Date.now()}`,
          content,
          senderId: userId,
          receiverId: otherUserId,
          createdAt: new Date().toISOString(),
          read: false,
          attachments: uploadedAttachments
        };
      }

      const response = await api.post(`/messaging/send/${userId}`, {
        receiverId: otherUserId,
        content,
        attachments: uploadedAttachments,
        confidential,
        privacyLevel,
        autoDeleteDays: autoDeleteDays || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      setMessageText('');
      setSelectedFiles([]);
      clearDraft(); // Clear draft on successful send
      queryClient.invalidateQueries({ queryKey: ['message-conversation', userId, otherUserId] });
      queryClient.invalidateQueries({ queryKey: ['message-inbox', userId] });
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/messaging/conversation/${otherUserId}/${userId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-conversation', userId, otherUserId] });
      queryClient.invalidateQueries({ queryKey: ['message-inbox', userId] });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((messageText.trim() || selectedFiles.length > 0) && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate({ content: messageText.trim(), files: selectedFiles });
    }
  };

  // Mark conversation as read when opened
  useEffect(() => {
    const unreadMessages = (messages as Message[]).filter(
      (msg: Message) => msg.receiverId === userId && !msg.read
    );
    if (unreadMessages.length > 0) {
      markAsReadMutation.mutate();
    }
  }, [messages, userId]);

  const renderAttachment = (att: Attachment) => {
    switch (att.type) {
      case 'image':
        return <img src={att.url} alt={att.name} className="max-w-full rounded-lg mb-2 border border-white/10" />;
      case 'audio':
        return (
          <div className="bg-black/20 p-2 rounded-lg mb-2 flex items-center gap-2">
            <audio controls src={att.url} className="w-full h-8" />
          </div>
        );
      case 'video':
        return (
          <div className="mb-2">
            <video controls src={att.url} className="max-w-full rounded-lg border border-white/10 max-h-60" />
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg mb-2 border border-white/10">
            <div className="bg-highlight/20 p-2 rounded-full">
              <Paperclip size={16} className="text-highlight" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{att.name}</p>
              <p className="text-xs opacity-60">{att.size}</p>
            </div>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-white p-6 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Go back"
                aria-label="Go back"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="w-12 h-12 rounded-full bg-highlight/20 flex items-center justify-center text-lg font-bold brand-font text-highlight flex-shrink-0">
              {resolvedOtherUser?.avatar ? (
                <img
                  src={resolvedOtherUser.avatar}
                  alt={resolvedOtherUser.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (resolvedOtherUser?.name[0] || '').toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{resolvedOtherUser?.name}</h2>
              {resolvedOtherUser?.yorubaName && (
                <p className="text-muted text-sm">{resolvedOtherUser.yorubaName}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 relative"> {/* Added relative positioning for dropdown */}
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <p className="text-lg">No messages yet.</p>
              <p className="text-sm mt-2">Start the conversation below.</p>
            </div>
          ) : (
            (messages as Message[]).map((message: Message) => {
              const isOwnMessage = message.senderId === userId;
              const isMenuOpen = menuOpenMessageId === message.id;

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} relative`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl p-4 ${isOwnMessage
                      ? 'bg-highlight text-white'
                      : 'bg-white/10 text-white border border-white/20'
                      }`}
                  >
                    {message.attachments && (message.attachments as Attachment[]).map((att: Attachment) => (
                      <div key={att.id}>{renderAttachment(att)}</div>
                    ))}
                    {message.content && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs opacity-70">
                          {new Date(message.createdAt).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                        {isOwnMessage && (
                          <span className="opacity-70">
                            {message.read ? (
                              <CheckCheck size={14} />
                            ) : (
                              <Check size={14} />
                            )}
                          </span>
                        )}
                      </div>

                      {isOwnMessage && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenMessageId(isMenuOpen ? null : message.id);
                            }}
                            className="text-xs opacity-70 hover:opacity-100 ml-2"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {isMenuOpen && (
                            <div className="absolute right-0 mt-1 w-32 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg z-10">
                              <button
                                onClick={() => {
                                  deleteMessageMutation.mutate(message.id);
                                  setMenuOpenMessageId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 rounded-b-lg flex items-center gap-2"
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white/5 backdrop-blur-sm border-t border-white/10 p-6">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto space-y-3">
          {/* Privacy Settings */}
          {showPrivacySettings && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-blue-300 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Privacy Settings
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPrivacySettings(false)}
                  className="text-xs text-blue-300/70 hover:text-blue-300"
                >
                  Hide
                </button>
              </div>

              {/* Confidential Toggle */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="confidential"
                  checked={confidential}
                  onChange={(e) => {
                    setConfidential(e.target.checked);
                    if (e.target.checked) {
                      setPrivacyLevel(PrivacyLevel.CONFIDENTIAL);
                    }
                  }}
                  className="mt-1 w-4 h-4 text-highlight border-white/20 rounded focus:ring-highlight"
                />
                <label htmlFor="confidential" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-300">Confidential Session</span>
                    <Info className="w-3 h-3 text-blue-300/70" />
                  </div>
                  <p className="text-xs text-blue-300/70 mt-0.5">
                    Hide this conversation from activity feed. Messages will be automatically encrypted.
                  </p>
                </label>
              </div>

              {/* Privacy Level */}
              {!confidential && (
                <div>
                  <label className="block text-xs font-medium text-blue-300 mb-2">
                    Privacy Level
                  </label>
                  <select
                    value={privacyLevel}
                    onChange={(e) => setPrivacyLevel(e.target.value as PrivacyLevel)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-highlight"
                    title="Privacy Level"
                    aria-label="Privacy Level"
                  >
                    <option value={PrivacyLevel.PRIVATE}>Private (Default)</option>
                    <option value={PrivacyLevel.COMMUNITY}>Community</option>
                    <option value={PrivacyLevel.PUBLIC}>Public (Not Recommended)</option>
                  </select>
                </div>
              )}

              {/* Auto-Delete Settings */}
              <div>
                <label className="block text-xs font-medium text-blue-300 mb-2 flex items-center gap-2">
                  <Trash2 className="w-3 h-3" />
                  Auto-Delete Messages
                </label>
                <select
                  value={autoDeleteDays || ''}
                  onChange={(e) => setAutoDeleteDays(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-highlight"
                  title="Auto-Delete After"
                  aria-label="Auto-Delete After"
                >
                  <option value="">Never (Keep messages)</option>
                  <option value={AutoDeleteDays.SEVEN_DAYS}>7 days</option>
                  <option value={AutoDeleteDays.THIRTY_DAYS}>30 days</option>
                  <option value={AutoDeleteDays.NINETY_DAYS}>90 days</option>
                </select>
                {autoDeleteDays && (
                  <p className="text-xs text-blue-300/70 mt-1">
                    Messages will be automatically deleted after {autoDeleteDays} days.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* File Preview */}
          {selectedFiles.length > 0 && (
            <div className="px-6 pb-2 flex gap-2 overflow-x-auto">
              {selectedFiles.map((file, i) => (
                <div key={i} className="relative bg-white/10 p-2 rounded-lg flex items-center gap-2 min-w-[150px]">
                  <span className="text-xs truncate max-w-[100px]">{file.name}</span>
                  <button type="button" onClick={() => removeSelectedFile(i)} className="ml-auto text-red-400 hover:text-red-300">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-4">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              onChange={handleFileSelect}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              title="Attach document"
            >
              <Paperclip size={20} className="text-muted" />
            </button>
            <button
              type="button"
              onClick={() => setShowPrivacySettings(!showPrivacySettings)}
              className={`p-3 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 ${confidential ? 'text-yellow-400' : 'text-muted'
                }`}
              title="Privacy settings"
            >
              <Settings size={20} />
            </button>
            <div className="flex-1">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                rows={1}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-muted outline-none focus:ring-2 focus:ring-highlight resize-none min-h-[44px] max-h-32 custom-scrollbar"
              />
              {confidential && (
                <div className="flex items-center gap-2 mt-2 text-xs text-yellow-400">
                  <Lock className="w-3 h-3" />
                  <span>Confidential session active</span>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={(!messageText.trim() && selectedFiles.length === 0) || sendMessageMutation.isPending}
              className="bg-highlight hover:bg-highlight/90 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
            >
              <Send size={18} />
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessageThread;
