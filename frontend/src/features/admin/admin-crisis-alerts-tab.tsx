import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, ExternalLink, Loader2, User } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';

// COMMUNITY_BACKLOG.md FOR-015: this queue now merges Forum posts and Circle
// feed posts (see forum.service.ts's getCrisisSignalPosts) -- `source`
// discriminates which, `thread`/`circle` are mutually exclusive depending on it.
interface CrisisPost {
  id: string;
  content: string;
  createdAt: string;
  source: 'forum' | 'circle';
  author: { id: string; name: string; email: string; role: string };
  thread?: { id: string; title: string; categoryId: string };
  circle?: { id: string; name: string; slug: string };
}

const AdminCrisisAlertsTab: React.FC = () => {
  const [page, setPage] = useState(1);
  const { success: toastSuccess, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-crisis-signals', page],
    queryFn: () => api.get(`/forum/admin/crisis-signals?page=${page}&limit=20`).then(r => r.data),
  });

  const clearMutation = useMutation({
    mutationFn: ({ postId, source }: { postId: string; source: 'forum' | 'circle' }) =>
      api.patch(`/forum/admin/crisis-signals/${postId}/clear?source=${source}`),
    onSuccess: () => {
      toastSuccess('Crisis signal cleared');
      queryClient.invalidateQueries({ queryKey: ['admin-crisis-signals'] });
    },
    onError: () => toastError('Failed to clear signal'),
  });

  const posts: CrisisPost[] = data?.posts ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <AlertTriangle size={22} className="text-red-500" /> Crisis Signal Alerts
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Forum and Circle posts flagged by the automated welfare detection system. Review and clear when actioned.
        </p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-sm text-amber-800 dark:text-amber-300">
        <strong>Reminder:</strong> Always follow your platform's welfare protocol before clearing a flag. If a user appears to be in crisis, contact them directly or refer to relevant support services.
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-highlight" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckCircle size={40} className="mx-auto mb-3 text-emerald-500 opacity-60" />
          <p className="font-medium">No active crisis signals</p>
          <p className="text-xs mt-1">All flagged posts have been reviewed or no signals detected yet.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{total} flagged post{total !== 1 ? 's' : ''} awaiting review</p>
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-card border border-red-200 dark:border-red-900/50 rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User size={14} className="text-muted-foreground" />
                    <span className="font-semibold text-foreground">{post.author.name}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{post.author.email}</span>
                    <span className="text-xs bg-muted/60 px-2 py-0.5 rounded-full text-muted-foreground">{post.author.role}</span>
                    <span className="text-xs bg-muted/60 px-2 py-0.5 rounded-full text-muted-foreground uppercase">
                      {post.source}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(post.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <ExternalLink size={12} />
                  {post.source === 'forum' && post.thread ? (
                    <a href={`/forum/${post.thread.id}`} target="_blank" rel="noreferrer" className="hover:text-highlight underline">
                      {post.thread.title}
                    </a>
                  ) : post.circle ? (
                    <a href={`/circles/${post.circle.slug}`} target="_blank" rel="noreferrer" className="hover:text-highlight underline">
                      {post.circle.name}
                    </a>
                  ) : null}
                </div>

                <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl p-3 text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
                  {post.content}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => clearMutation.mutate({ postId: post.id, source: post.source })}
                    disabled={clearMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {clearMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    Mark as Reviewed
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm bg-muted/60 rounded-xl disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm bg-muted/60 rounded-xl disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminCrisisAlertsTab;
