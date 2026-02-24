import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MessageThread from '@/features/messages/thread/message-thread';
import MessageInbox from '@/features/messages/inbox/message-inbox';
import { useAuth } from '@/shared/hooks/use-auth';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Messages Page
 * Displays inbox and conversation threads
 * Routes: /messages (inbox) and /messages/:otherUserId (thread)
 */
const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { otherUserId } = useParams<{ otherUserId: string }>();

  // If no user logged in
  if (!user?.id) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white p-12 rounded-[2.5rem] shadow-xl border border-stone-100 max-w-md w-full"
        >
          <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare size={40} className="text-stone-300" />
          </div>
          <h2 className="text-3xl font-bold text-stone-800 mb-2 brand-font">Secure Sanctuary</h2>
          <p className="text-stone-500 mb-8 leading-relaxed">Please sign in to access your private encrypted communications.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 bg-highlight text-white rounded-xl font-bold shadow-lg hover:bg-yellow-600 transition-all hover:-translate-y-1"
          >
            Log In
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50/50">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-4 mb-2">
                {otherUserId && (
                  <button
                    onClick={() => navigate('/messages')}
                    className="p-2 hover:bg-white rounded-xl transition-colors text-stone-400 hover:text-stone-800"
                  >
                    <ArrowLeft size={24} />
                  </button>
                )}
                <h1 className="text-4xl font-bold text-stone-900 brand-font tracking-tight">
                  {otherUserId ? 'Conversation' : 'Your Inbox'}
                </h1>
              </div>
              <p className="text-stone-500 font-medium">Private & Secure Communications</p>
            </div>
          </div>

          {/* Main Interface Content */}
          <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white shadow-2xl overflow-hidden min-h-[700px] flex flex-col relative transition-all duration-500">
            <AnimatePresence mode="wait" initial={false}>
              {!otherUserId ? (
                <motion.div
                  key="inbox"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex-1 flex flex-col"
                >
                  <MessageInbox
                    userId={user.id}
                    onSelectConversation={(id) => navigate(`/messages/${id}`)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="thread"
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex-1 flex flex-col"
                >
                  <MessageThread
                    userId={user.id}
                    otherUserId={otherUserId}
                    onBack={() => navigate('/messages')}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
