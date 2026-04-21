import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  MessageSquare,
  Users,
  ThumbsUp,
  TrendingUp,
  BarChart2,
  Layers,
  Send,
  Star,
} from 'lucide-react';

type Period = '7d' | '30d' | '90d';

interface ForumMetrics {
  period: Period;
  newThreads: number;
  newPosts: number;
  activeUsers: number;
  avgRepliesPerThread: number;
  totalAcknowledges: number;
  engagementRate: string;
  topCategories: { categoryId: string; _count: { id: number } }[];
  topAuthors: { authorId: string; _count: { id: number } }[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  threadCount?: number;
}

interface ForumUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

const PERIOD_LABELS: Record<Period, string> = { '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days' };

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function SeedThreadModal({
  categories,
  onClose,
  onSeed,
  isPending,
}: {
  categories: Category[];
  onClose: () => void;
  onSeed: (data: { categoryId: string; title: string; content: string }) => void;
  isPending: boolean;
}) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg p-6 space-y-4 shadow-xl">
        <h3 className="font-semibold text-lg">Seed a Thread</h3>
        <div className="space-y-1">
          <label className="text-sm font-medium">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border border-border rounded px-3 py-2 text-sm bg-card text-foreground"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Thread title…"
            className="w-full border border-border rounded px-3 py-2 text-sm bg-card text-foreground"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Opening post</label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write the opening message to spark discussion…"
            className="w-full border border-border rounded px-3 py-2 text-sm bg-card text-foreground resize-none"
          />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded hover:bg-highlight">Cancel</button>
          <button
            type="button"
            onClick={() => onSeed({ categoryId, title, content })}
            disabled={isPending || !title.trim() || !content.trim()}
            className="px-4 py-2 text-sm bg-foreground text-background rounded hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? 'Creating…' : 'Create Thread'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminForumIntelligenceTab() {
  const qc = useQueryClient();
  const [period, setPeriod] = useState<Period>('7d');
  const [showSeed, setShowSeed] = useState(false);

  const { data: metrics, isLoading } = useQuery<ForumMetrics>({
    queryKey: ['admin', 'forum-metrics', period],
    queryFn: () => api.get('/forum/admin/metrics', { params: { period } }).then((r) => r.data),
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['forum', 'categories'],
    queryFn: () => api.get('/forum/categories').then((r) => r.data),
  });

  // Hydrate top author IDs → names
  const topAuthorIds = metrics?.topAuthors.map((a) => a.authorId) ?? [];
  const { data: authorUsers } = useQuery<ForumUser[]>({
    queryKey: ['admin', 'users-by-ids', topAuthorIds],
    queryFn: () =>
      api.get('/admin/users', { params: { ids: topAuthorIds.join(',') } }).then((r) =>
        Array.isArray(r.data) ? r.data : r.data.users ?? [],
      ),
    enabled: topAuthorIds.length > 0,
  });
  const authorMap = new Map((authorUsers ?? []).map((u) => [u.id, u]));

  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c]));

  const seedMutation = useMutation({
    mutationFn: (data: { categoryId: string; title: string; content: string }) =>
      api.post('/forum/threads', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'forum-metrics'] });
      setShowSeed(false);
    },
  });

  return (
    <div className="space-y-6">
      {showSeed && categories && (
        <SeedThreadModal
          categories={categories}
          onClose={() => setShowSeed(false)}
          onSeed={(d) => seedMutation.mutate(d)}
          isPending={seedMutation.isPending}
        />
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">Forum Intelligence</h2>
          <p className="text-sm text-muted-foreground mt-1">Health metrics for the community forum.</p>
        </div>
        <div className="flex items-center gap-2">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                period === p ? 'border-foreground bg-highlight font-medium' : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard icon={MessageSquare} label="New Threads" value={metrics?.newThreads ?? 0} sub={PERIOD_LABELS[period]} />
          <StatCard icon={BarChart2} label="New Posts" value={metrics?.newPosts ?? 0} sub={PERIOD_LABELS[period]} />
          <StatCard icon={Users} label="Active Contributors" value={metrics?.activeUsers ?? 0} sub="unique posters" />
          <StatCard icon={TrendingUp} label="Avg Replies / Thread" value={metrics?.avgRepliesPerThread ?? 0} sub="higher = more discussion" />
          <StatCard icon={ThumbsUp} label="Total Àṣẹ Given" value={metrics?.totalAcknowledges ?? 0} sub="post acknowledges" />
          <StatCard icon={Layers} label="Engagement Rate" value={metrics?.engagementRate ?? '—'} sub="acknowledges per post" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-highlight flex items-center justify-between">
            <span className="font-medium text-sm">Most Active Categories</span>
            <button
              type="button"
              onClick={() => setShowSeed(true)}
              className="flex items-center gap-1 text-xs px-2 py-1 border border-border rounded hover:bg-card transition-colors"
            >
              <Send className="w-3 h-3" /> Seed thread
            </button>
          </div>
          {!metrics?.topCategories?.length ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No data for this period</p>
          ) : (
            metrics.topCategories.map((cat, i) => {
              const name = categoryMap.get(cat.categoryId)?.name ?? cat.categoryId.slice(0, 8) + '…';
              const max = metrics.topCategories[0]._count.id;
              const pct = Math.round((cat._count.id / max) * 100);
              return (
                <div key={cat.categoryId} className="px-4 py-3 border-b border-border last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      <span className="text-muted-foreground mr-2">#{i + 1}</span>{name}
                    </span>
                    <span className="text-sm text-muted-foreground">{cat._count.id} threads</span>
                  </div>
                  <div className="h-1.5 bg-highlight rounded-full overflow-hidden">
                    <div className="h-full bg-foreground rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Top Contributors */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-highlight flex items-center gap-2">
            <Star className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-sm">Top Contributors</span>
          </div>
          {!metrics?.topAuthors?.length ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No data for this period</p>
          ) : (
            metrics.topAuthors.map((author, i) => {
              const user = authorMap.get(author.authorId);
              const initials = (user?.name ?? '?').slice(0, 2).toUpperCase();
              return (
                <div key={author.authorId} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                  <span className="text-xs font-bold text-muted-foreground w-4">#{i + 1}</span>
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-highlight flex items-center justify-center text-xs font-medium">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name ?? 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{author._count.id} posts</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
