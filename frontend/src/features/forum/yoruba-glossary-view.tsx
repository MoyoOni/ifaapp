import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Volume2 } from 'lucide-react';
import { FeatureHeader } from '@/shared/components/feature-header';
import api from '@/lib/api';

interface GlossaryWord {
  word: string;
  pronunciation: string;
  definition: string;
  example: string;
  culturalContext: string;
  category: string;
}

// COMMUNITY_BACKLOG.md FOR-008: "pronunciation guides for spiritual terms" +
// "translation assistance" (word-level, not sentence machine-translation) +
// "cultural context explanations". Reuses the existing DailyYorubaWord
// system's static glossary rather than a new content model -- that system
// already had all of this, it just had no browsable entry point (only a
// single rotating "today's word").
const YorubaGlossaryView: React.FC = () => {
  const [category, setCategory] = useState<string | null>(null);

  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['yoruba-word-categories'],
    queryFn: async () => (await api.get('/recommendations/daily-word/yoruba/categories')).data.categories,
  });

  const { data: words = [], isLoading } = useQuery<GlossaryWord[]>({
    queryKey: ['yoruba-glossary', category],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      const res = await api.get(`/recommendations/daily-word/yoruba/glossary?${params.toString()}`);
      return res.data;
    },
  });

  return (
    <div className="py-6 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <FeatureHeader
        feature="forum"
        title="Yorùbá Glossary"
        subtitle="Pronunciation, meaning, and cultural context for spiritual and everyday Yorùbá terms."
        icon={BookOpen}
      />

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            category === null ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
          }`}
        >
          All Terms
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading glossary...</p>
      ) : (
        <div className="space-y-4">
          {words.map((w) => (
            <div key={w.word} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                <h3 className="font-bold text-foreground text-lg">{w.word}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{w.category}</span>
              </div>
              <p className="text-sm text-highlight flex items-center gap-1 mb-2">
                <Volume2 size={14} /> {w.pronunciation}
              </p>
              <p className="text-sm text-muted-foreground">{w.definition}</p>
              <p className="text-xs text-muted-foreground italic mt-2">"{w.example}"</p>
              <p className="text-xs text-muted-foreground mt-2">{w.culturalContext}</p>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-6 text-center">
        Discuss and learn more Yorùbá in{' '}
        <Link to="/forum" className="text-highlight hover:underline">
          Yorùbá Language & Culture
        </Link>
        .
      </p>
    </div>
  );
};

export default YorubaGlossaryView;
