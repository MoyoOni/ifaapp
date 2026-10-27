import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarHeart, MessageCircle } from 'lucide-react';
import api from '@/lib/api';

// COMMUNITY_BACKLOG.md FOR-007: significant days that are near or underway,
// each linking to the gathering thread created for it. Renders nothing when
// no event is in season -- the after-event "Reflections" thread takes over
// from there.
interface SeasonalHighlight {
  id: string;
  title: string;
  yorubaName?: string | null;
  date: string;
  endDate?: string | null;
  thread: { id: string; title: string; postCount: number };
}

interface SeasonalHighlightsBannerProps {
  onSelectThread?: (threadId: string) => void;
}

const whenLabel = (h: SeasonalHighlight): string => {
  const start = new Date(h.date);
  if (start.getTime() <= Date.now()) return 'Happening now';
  return `Begins ${start.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}`;
};

const SeasonalHighlightsBanner: React.FC<SeasonalHighlightsBannerProps> = ({ onSelectThread }) => {
  const { data: highlights = [] } = useQuery<SeasonalHighlight[]>({
    queryKey: ['forum-seasonal-highlights'],
    queryFn: async () => (await api.get('/forum/seasonal-highlights')).data,
    staleTime: 10 * 60_000,
  });

  if (highlights.length === 0) return null;

  return (
    <div className="space-y-2">
      {highlights.map((h) => (
        <button
          key={h.id}
          type="button"
          onClick={() => onSelectThread?.(h.thread.id)}
          className="w-full text-left bg-highlight/10 rounded-2xl p-4 border border-highlight/30 shadow-sm hover:border-highlight/60 hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-3">
            <CalendarHeart size={18} className="text-highlight shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-highlight uppercase tracking-wider">
                {whenLabel(h)}
              </p>
              <p className="text-sm font-bold text-foreground">
                {h.yorubaName ? `${h.yorubaName} · ${h.title}` : h.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <MessageCircle size={12} className="shrink-0" />
                {h.thread.postCount > 0
                  ? `${h.thread.postCount} ${h.thread.postCount === 1 ? 'reply' : 'replies'} in the gathering — join in`
                  : 'Gather with others preparing for it'}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default SeasonalHighlightsBanner;
