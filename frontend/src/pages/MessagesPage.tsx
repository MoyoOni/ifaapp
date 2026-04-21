import React, { Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MessageThread from '@/features/messages/thread/message-thread';
import MessageInbox from '@/features/messages/inbox/message-inbox';
import { useAuth } from '@/shared/hooks/use-auth';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { FeatureHeader } from '@/shared/components/feature-header';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorBoundary from '@/shared/components/error-boundary';
import { MessagesSkeleton } from '@/shared/components/skeleton';

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
      <div className="min-h-screen bg-muted/40 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-card p-12 rounded-[2.5rem] shadow-xl border border-border/50 max-w-md w-full"
        >
          <div className="w-20 h-20 bg-muted/40 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare size={40} className="text-stone-300" />
          </div>
          <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-200 mb-2 brand-font">Secure Sanctuary</h2>
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
    <div className="min-h-screen bg-muted/40/50">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <FeatureHeader
            feature="messages"
            title={otherUserId ? 'Conversation' : 'Your Inbox'}
            subtitle="Private & Secure Communications"
            icon={MessageSquare}
          >
            {otherUserId && (
              <button
                onClick={() => navigate('/messages')}
                className="mt-3 p-2 hover:bg-muted/500 rounded-xl transition-colors text-blue-400 hover:text-blue-800 dark:text-blue-400 inline-flex items-center gap-2 text-sm"
                aria-label="Back to messages"
              >
                <ArrowLeft size={16} />
                Back to Inbox
              </button>
            )}
          </FeatureHeader>

          {/* Main Interface Content */}
          <div 
            className="bg-card/40 backdrop-blur-md rounded-[2.5rem] border border-white shadow-2xl overflow-hidden min-h-[700px] flex flex-col relative transition-all duration-500"
            role="main"
            aria-label={otherUserId ? "Message conversation" : "Message inbox"}
          >
            <ErrorBoundary 
              fallback={
                <div className="p-8 text-center">
                  <div className="text-destructive text-6xl mb-4">⚠️</div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Communication Error</h2>
                  <p className="text-muted-foreground mb-6">
                    There was a problem loading your messages. Please try again.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
                    aria-label="Refresh messages"
                  >
                    Refresh Messages
                  </button>
                </div>
              }
            >
              <Suspense 
                fallback={
                  <div className="flex items-center justify-center h-[700px]">
                    <LoadingSpinner size="lg" variant="highlight" label="Loading messages..." />
                  </div>
                }
              >
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
                      <Suspense fallback={<MessagesSkeleton />}>
                        <MessageInbox
                          userId={user.id}
                          onSelectConversation={(id) => navigate(`/messages/${id}`)}
                        />
                      </Suspense>
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
                      <Suspense fallback={<MessagesSkeleton />}>
                        <MessageThread
                          userId={user.id}
                          otherUserId={otherUserId}
                          onBack={() => navigate('/messages')}
                        />
                      </Suspense>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;