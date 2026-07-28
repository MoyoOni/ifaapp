import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, ChevronRight } from 'lucide-react';
import { FeatureHeader } from '@/shared/components/feature-header';
import api from '@/lib/api';
import { isDevModeActive } from '@/shared/utils/dev-mode';

// COMMUNITY_BACKLOG.md FOR-004: "Structured thread series for core concepts" --
// browsing surface for the curated (Babalawo/Admin-only) teaching series that
// createThread already supports via isTeachingSeries/seriesName.
interface ThreadSeries {
  seriesName: string;
  category: { id: string; name: string; slug: string };
  threadCount: number;
  startedAt: string;
}

const LearningPathwaysView: React.FC = () => {
  const { data: series = [], isLoading } = useQuery<ThreadSeries[]>({
    queryKey: ['forum-thread-series'],
    queryFn: async () => (await api.get('/forum/series')).data,
    enabled: !isDevModeActive(),
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <FeatureHeader
        feature="community"
        title="Learning Pathways"
        subtitle="Curated teaching series from elders and Babalawo, grouped so you can follow one thread of learning at a time."
        icon={GraduationCap}
      />

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-xl" />
          ))}
        </div>
      ) : series.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
          <BookOpen className="mx-auto text-muted-foreground mb-3" size={32} />
          <p className="text-muted-foreground">No teaching series have been started yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {series.map((s) => (
            <Link
              key={s.seriesName}
              to={`/forum/pathways/${encodeURIComponent(s.seriesName)}`}
              className="flex items-center justify-between p-5 bg-card rounded-xl border border-border/50 hover:border-primary/40 hover:shadow-sm transition-all group"
            >
              <div>
                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{s.seriesName}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {s.threadCount} teaching{s.threadCount === 1 ? '' : 's'} · {s.category.name}
                </p>
              </div>
              <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" size={20} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearningPathwaysView;
