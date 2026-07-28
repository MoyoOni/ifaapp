import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Clock } from 'lucide-react';
import api from '@/lib/api';

// COMMUNITY_BACKLOG.md FOR-Q3: "Ask an Elder" -- formalizes the existing
// "Ask a Babalawo" copy (HelpPage.tsx, MessagesPausedPage.tsx) that already
// points here, shown only within the Seeker Questions category.
interface Elder {
  id: string;
  name: string;
  yorubaName?: string;
  avatar?: string;
}

const AskAnElderBanner: React.FC = () => {
  const { data: elders = [] } = useQuery<Elder[]>({
    queryKey: ['elders-answering'],
    queryFn: async () => (await api.get('/forum/elders-answering')).data,
  });

  return (
    <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-4 border border-amber-200 dark:border-amber-800/30 shadow-sm mb-4">
      <div className="flex items-start gap-3">
        <Sparkles size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Ask an Elder</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 leading-snug flex items-center gap-1.5">
            <Clock size={12} className="shrink-0" />
            Elders here aim to respond within a couple of days — not a guarantee, just what to expect.
          </p>
          {elders.length > 0 && (
            <p className="text-xs text-amber-500 dark:text-amber-400/80 mt-1.5">
              {elders.length} elder{elders.length === 1 ? '' : 's'} currently answering questions here
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AskAnElderBanner;
