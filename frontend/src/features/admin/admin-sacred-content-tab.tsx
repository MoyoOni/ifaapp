import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, Unlock, Search, RefreshCw, Shield } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';

interface ForumThread {
  id: string;
  title: string;
  isSacred: boolean;
  category?: { name: string; slug: string };
  createdAt: string;
  postCount: number;
  user?: { name: string };
}

interface ThreadsResponse {
  threads: ForumThread[];
  total: number;
}

const SACRED_REASONS = [
  'Odù Teaching',
  'Initiation Ritual',
  'Elder-Only Guidance',
  'Restricted Knowledge',
  'Other',
];

const AdminSacredContentTab: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [confirmThread, setConfirmThread] = useState<{ thread: ForumThread; sacred: boolean } | null>(null);
  const [reason, setReason] = useState(SACRED_REASONS[0]);

  const { data, isLoading, isError, refetch } = useQuery<ThreadsResponse>({
    queryKey: ['admin-forum-threads-sacred', search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100' });
      if (search) params.append('search', search);
      const response = await api.get(`/forum/threads?${params}`);
      const raw = response.data;
      if (Array.isArray(raw)) return { threads: raw, total: raw.length };
      return raw;
    },
    staleTime: 30 * 1000,
  });

  const threads: ForumThread[] = data?.threads ?? (Array.isArray(data) ? (data as ForumThread[]) : []);

  const sacredMutation = useMutation({
    mutationFn: async ({ id, isSacred, reason }: { id: string; isSacred: boolean; reason: string }) => {
      const response = await api.patch(`/forum/threads/${id}/sacred`, { isSacred, reason });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-forum-threads-sacred'] });
      toast.success(
        variables.isSacred
          ? 'Thread marked as sacred — content gated for initiated practitioners'
          : 'Sacred designation removed'
      );
      setConfirmThread(null);
      setReason(SACRED_REASONS[0]);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update thread');
    },
  });

  const handleToggleClick = (thread: ForumThread) => {
    setConfirmThread({ thread, sacred: !thread.isSacred });
    setReason(SACRED_REASONS[0]);
  };

  const handleConfirm = () => {
    if (!confirmThread) return;
    sacredMutation.mutate({
      id: confirmThread.thread.id,
      isSacred: confirmThread.sacred,
      reason,
    });
  };

  const filteredThreads = search
    ? threads.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.category?.name.toLowerCase().includes(search.toLowerCase())
      )
    : threads;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="text-amber-500" size={24} />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Sacred Content</h2>
            <p className="text-muted-foreground text-sm">
              Designate forum threads as sacred — gates content to initiated practitioners only
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-muted-foreground hover:bg-muted text-sm transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Sacred content explanation */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 flex gap-3">
        <Lock size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 dark:text-amber-300">
          <strong>What happens when a thread is marked sacred:</strong> Unauthenticated visitors cannot see it. Users who are not BABALAWO or ADMIN see a disclaimer screen instead of the thread content. The thread title still appears in listings with a lock icon.
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input
          type="text"
          placeholder="Search threads by title or category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary outline-none text-sm"
        />
      </div>

      {/* Thread list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading threads...</div>
        ) : isError ? (
          <div className="p-12 text-center text-destructive">Failed to load threads.</div>
        ) : filteredThreads.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No threads found.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider text-xs">Thread</th>
                <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider text-xs">Category</th>
                <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider text-xs">Posts</th>
                <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider text-xs">Status</th>
                <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider text-xs">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredThreads.map(thread => (
                <tr key={thread.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {thread.isSacred && <Lock size={14} className="text-amber-500 shrink-0" />}
                      <span className="font-medium text-foreground line-clamp-1">{thread.title}</span>
                    </div>
                    {thread.user && (
                      <p className="text-xs text-muted-foreground mt-0.5">by {thread.user.name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {thread.category?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{thread.postCount}</td>
                  <td className="px-4 py-3">
                    {thread.isSacred ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1 w-fit">
                        <Lock size={10} /> Sacred
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground w-fit block">
                        Public
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleClick(thread)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        thread.isSacred
                          ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200'
                      }`}
                    >
                      {thread.isSacred ? <Unlock size={12} /> : <Lock size={12} />}
                      {thread.isSacred ? 'Remove Sacred' : 'Mark Sacred'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmThread && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-start gap-3">
              {confirmThread.sacred
                ? <Lock size={22} className="text-amber-500 shrink-0 mt-0.5" />
                : <Unlock size={22} className="text-muted-foreground shrink-0 mt-0.5" />}
              <div>
                <h3 className="font-bold text-foreground text-lg">
                  {confirmThread.sacred ? 'Mark as Sacred Content' : 'Remove Sacred Designation'}
                </h3>
                <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                  "{confirmThread.thread.title}"
                </p>
              </div>
            </div>

            {confirmThread.sacred && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground uppercase tracking-wide">Reason</label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:border-primary outline-none text-sm"
                >
                  {SACRED_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <p className="text-xs text-muted-foreground">
                  This action is logged in the audit trail.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmThread(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-bold hover:bg-muted transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={sacredMutation.isPending}
                className={`flex-1 py-2.5 rounded-xl font-bold transition-colors text-sm disabled:opacity-50 ${
                  confirmThread.sacred
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                {sacredMutation.isPending
                  ? 'Saving...'
                  : confirmThread.sacred
                    ? 'Confirm — Mark Sacred'
                    : 'Remove Designation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSacredContentTab;
