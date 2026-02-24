import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Calendar, Loader2, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';

interface WordHistoryEntry {
  id: string;
  word: string;
  pronunciation: string;
  definition: string;
  example: string;
  culturalContext: string;
  category: string;
  date: string;
  viewedAt: string;
}

interface YorubaWordHistoryViewProps {
  userId?: string;
  onBack?: () => void;
  onWordSelect?: (wordId: string) => void;
}

/**
 * Yoruba Word History View Component
 * Shows a user's history of viewed Yoruba words
 */
const YorubaWordHistoryView: React.FC<YorubaWordHistoryViewProps> = ({
  userId,
  onBack,
  onWordSelect,
}) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const { data: history = [], isLoading } = useQuery<WordHistoryEntry[]>({
    queryKey: ['yoruba-word-history', targetUserId],
    queryFn: async () => {
      const response = await api.get(`/recommendations/daily-word/yoruba/history/${targetUserId}`, {
        params: { limit: 100 },
      });
      return response.data;
    },
    enabled: !!targetUserId,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-12 h-12 animate-spin text-highlight" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        )}
        <div className="flex-1 text-right">
          <h1 className="text-3xl font-bold text-white mb-2">Word History</h1>
          <p className="text-muted">
            {history.length} {history.length === 1 ? 'word' : 'words'} viewed
          </p>
        </div>
      </div>

      {/* History List */}
      {history.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <BookOpen size={64} className="mx-auto mb-4 opacity-50" />
          <p className="text-xl mb-2">No word history yet</p>
          <p className="text-sm">Start exploring daily Yoruba words to build your history</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4 hover:border-highlight transition-all cursor-pointer"
              onClick={() => onWordSelect && onWordSelect(entry.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-highlight/20 text-highlight rounded-full text-xs font-medium">
                      {entry.category}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-highlight mb-1">{entry.word}</h3>
                  <p className="text-muted italic text-sm">{entry.pronunciation}</p>
                </div>
              </div>

              <p className="text-white line-clamp-2">{entry.definition}</p>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-muted">
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span>{formatDate(entry.viewedAt)}</span>
                </div>
                <span>{formatTime(entry.viewedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default YorubaWordHistoryView;
