import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Volume2 } from 'lucide-react';
import api from '@/lib/api';

// COMMUNITY_BACKLOG.md FOR-008: surfaces the existing (but previously
// orphaned -- no UI anywhere linked to it) Daily Yoruba Word system, shown
// only within the Yorùbá Language & Culture category. Same pattern as
// FOR-Q3's AskAnElderBanner.
interface DailyWord {
  id: string;
  word: string;
  pronunciation: string;
  definition: string;
}

const DailyYorubaWordBanner: React.FC = () => {
  const { data: word } = useQuery<DailyWord>({
    queryKey: ['daily-yoruba-word'],
    queryFn: async () => (await api.get('/recommendations/daily-word/yoruba')).data,
    staleTime: 60 * 60 * 1000,
  });

  if (!word) return null;

  return (
    <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800/30 shadow-sm mb-4">
      <div className="flex items-start gap-3">
        <BookOpen size={18} className="text-emerald-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-widest">
            Word of the Day
          </p>
          <p className="text-lg font-bold text-foreground mt-1">{word.word}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
            <Volume2 size={12} /> {word.pronunciation}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{word.definition}</p>
          <div className="flex items-center gap-4 mt-2">
            <Link to={`/yoruba-word/${word.id}`} className="text-xs font-medium text-emerald-600 hover:underline">
              Full context →
            </Link>
            <Link to="/yoruba-glossary" className="text-xs font-medium text-emerald-600 hover:underline">
              Browse glossary →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyYorubaWordBanner;
