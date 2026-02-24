import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, Sparkles, Calendar, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface YorubaWord {
  id: string;
  word: string;
  pronunciation: string;
  definition: string;
  example: string;
  culturalContext: string;
  category: string;
  date: string;
  viewCount: number;
}

interface YorubaWordDetailViewProps {
  wordId: string;
  onBack?: () => void;
}

/**
 * Yoruba Word Detail View Component
 * Shows detailed information about a specific Yoruba word
 */
const YorubaWordDetailView: React.FC<YorubaWordDetailViewProps> = ({ wordId, onBack }) => {
  const { data: word, isLoading } = useQuery<YorubaWord>({
    queryKey: ['yoruba-word', wordId],
    queryFn: async () => {
      const response = await api.get(`/recommendations/daily-word/yoruba/${wordId}`);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-12 h-12 animate-spin text-highlight" />
      </div>
    );
  }

  if (!word) {
    return (
      <div className="text-center py-12 text-muted">
        <p className="text-xl mb-2">Word not found</p>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-4 px-6 py-3 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors"
          >
            Go Back
          </button>
        )}
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>
      )}

      {/* Word Display */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-8 md:p-12 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="inline-flex items-center gap-2 bg-highlight/20 text-highlight px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
            <Sparkles size={14} />
            {word.category}
          </div>
          {word.date && (
            <div className="flex items-center gap-2 text-muted text-sm">
              <Calendar size={16} />
              {formatDate(word.date)}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-6xl md:text-8xl font-bold text-highlight mb-4">
            {word.word}
          </h1>
          <p className="text-2xl text-muted italic mb-6">
            {word.pronunciation}
          </p>
        </div>

        {/* Definition */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Definition</h2>
          <p className="text-xl text-white leading-relaxed">{word.definition}</p>
        </div>

        {/* Example */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={20} className="text-highlight" />
            <h3 className="text-lg font-bold text-white">Example Usage</h3>
          </div>
          <p className="text-white text-lg italic leading-relaxed">"{word.example}"</p>
        </div>

        {/* Cultural Context */}
        <div className="bg-highlight/10 rounded-xl p-6 border border-highlight/30">
          <h3 className="text-lg font-bold text-highlight mb-3 uppercase tracking-widest">
            Cultural Context
          </h3>
          <p className="text-white leading-relaxed">{word.culturalContext}</p>
        </div>

        {/* Stats */}
        {word.viewCount > 0 && (
          <div className="pt-6 border-t border-white/10 text-sm text-muted">
            Viewed {word.viewCount} {word.viewCount === 1 ? 'time' : 'times'}
          </div>
        )}
      </div>
    </div>
  );
};

export default YorubaWordDetailView;
