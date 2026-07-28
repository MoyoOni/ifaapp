import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Circle, GraduationCap } from 'lucide-react';
import { FeatureHeader } from '@/shared/components/feature-header';
import api from '@/lib/api';
import { isDevModeActive } from '@/shared/utils/dev-mode';

// COMMUNITY_BACKLOG.md FOR-004: series detail, progress tracking, and
// rule-based Academy course recommendations.
interface ThreadAuthor {
  id: string;
  name: string;
  yorubaName?: string;
  avatar?: string;
  verified: boolean;
}

interface SeriesThread {
  id: string;
  title: string;
  createdAt: string;
  author: ThreadAuthor;
  category: { id: string; name: string; slug: string };
}

interface RecommendedCourse {
  id: string;
  title: string;
  slug: string;
  category: string;
  level: string;
  thumbnail?: string | null;
  price: number;
  currency: string;
}

interface SeriesDetail {
  seriesName: string;
  threads: SeriesThread[];
  myProgress: { postedInThreads: number; totalThreads: number } | null;
  recommendedCourses: RecommendedCourse[];
}

const PathwayDetailView: React.FC = () => {
  const { seriesName = '' } = useParams<{ seriesName: string }>();

  const { data, isLoading } = useQuery<SeriesDetail>({
    queryKey: ['forum-thread-series', seriesName],
    queryFn: async () => (await api.get(`/forum/series/${encodeURIComponent(seriesName)}`)).data,
    enabled: !!seriesName && !isDevModeActive(),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-pulse space-y-3">
        <div className="h-24 bg-muted rounded-2xl" />
        <div className="h-16 bg-muted rounded-xl" />
        <div className="h-16 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!data || data.threads.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Link to="/forum/pathways" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-4">
          <ArrowLeft size={16} /> Back to Learning Pathways
        </Link>
        <p className="text-muted-foreground">This series could not be found.</p>
      </div>
    );
  }

  const progressPercent = data.myProgress
    ? Math.round((data.myProgress.postedInThreads / data.myProgress.totalThreads) * 100)
    : null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link to="/forum/pathways" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-4">
        <ArrowLeft size={16} /> Back to Learning Pathways
      </Link>

      <FeatureHeader feature="community" title={data.seriesName} icon={GraduationCap} />

      {progressPercent !== null && (
        <div className="mb-6 p-4 bg-card rounded-xl border border-border/50">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Your progress</span>
            <span className="font-bold text-foreground">
              {data.myProgress!.postedInThreads}/{data.myProgress!.totalThreads} teachings engaged with
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      )}

      <div className="space-y-3 mb-8">
        {data.threads.map((t, i) => (
          <Link
            key={t.id}
            to={`/forum/${t.id}`}
            className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border/50 hover:border-primary/40 transition-all"
          >
            <div className="mt-0.5 shrink-0">
              {i < (data.myProgress?.postedInThreads ?? 0) ? (
                <CheckCircle2 className="text-primary" size={20} />
              ) : (
                <Circle className="text-muted-foreground" size={20} />
              )}
            </div>
            <div>
              <p className="font-bold text-foreground">{t.title}</p>
              <p className="text-sm text-muted-foreground">
                By {t.author.name}{t.author.yorubaName ? ` (${t.author.yorubaName})` : ''}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {data.recommendedCourses.length > 0 && (
        <div>
          <h2 className="font-bold text-foreground mb-3">Continue learning in the Academy</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.recommendedCourses.map((c) => (
              <Link
                key={c.id}
                to={`/academy/course/${c.id}`}
                className="p-4 bg-card rounded-xl border border-border/50 hover:border-primary/40 transition-all"
              >
                <p className="font-bold text-foreground">{c.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{c.category} · {c.level}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PathwayDetailView;
