import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, ExternalLink, HandHeart, History, Loader2, User } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';
import { useAuth } from '@/shared/hooks/use-auth';
import { parseApiError } from '@/shared/utils/api-error';

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
  followUp: { status: 'CLAIMED' | 'RESOLVED'; claimedAt?: string; claimedBy?: { id: string; name: string } } | null;
}

// Z1-803: a flag used to only notify admins -- nobody could say "I'm on
// this", and "Mark as Reviewed" kept no record of what was done.
const OUTCOMES = [
  { value: 'REACHED_OUT', label: 'Reached out to them' },
  { value: 'REFERRED', label: 'Referred to support services' },
  { value: 'NO_RESPONSE', label: 'Tried to reach them, no response' },
  { value: 'FALSE_ALARM', label: 'Not a crisis (false alarm)' },
] as const;
type Outcome = (typeof OUTCOMES)[number]['value'];
const outcomeLabel = (v: string) => OUTCOMES.find((o) => o.value === v)?.label ?? v;

interface HistoryItem {
  id: string;
  source: 'forum' | 'circle';
  outcome: Outcome;
  note?: string | null;
  resolvedAt: string;
  claimedAt?: string | null;
  author: { id: string; name: string };
  claimedBy?: { id: string; name: string } | null;
  resolvedBy?: { id: string; name: string } | null;
}

const ResolveForm: React.FC<{ post: CrisisPost; onDone: () => void; onCancel: () => void }> = ({ post, onDone, onCancel }) => {
  const [outcome, setOutcome] = useState<Outcome | ''>('');
  const [note, setNote] = useState('');
  const { success: toastSuccess, error: toastError } = useToast();
  const resolve = useMutation({
    mutationFn: () => api.patch(`/forum/admin/crisis-signals/${post.id}/resolve?source=${post.source}`, { outcome, note: note.trim() || undefined }),
    onSuccess: () => { toastSuccess('Follow-up recorded and flag closed'); onDone(); },
    onError: (err) => toastError(parseApiError(err).userMessage),
  });
  return (
    <form
      className="border-t border-border pt-3 space-y-3"
      onSubmit={(e) => { e.preventDefault(); if (outcome) resolve.mutate(); }}
    >
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-semibold text-foreground mb-1">What happened?</legend>
        {OUTCOMES.map((o) => (
          <label key={o.value} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input type="radio" name={`outcome-${post.id}`} value={o.value} checked={outcome === o.value} onChange={() => setOutcome(o.value)} />
            {o.label}
          </label>
        ))}
      </fieldset>
      <label className="block text-sm text-foreground">
        Note for other admins <span className="text-muted-foreground">(optional)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={2000}
          rows={2}
          className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
        />
      </label>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
        <button
          type="submit"
          disabled={!outcome || resolve.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          {resolve.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
          Close Flag
        </button>
      </div>
    </form>
  );
};

const FollowUpHistory: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-crisis-history', page],
    queryFn: () => api.get(`/forum/admin/crisis-signals/history?page=${page}&limit=20`).then((r) => r.data),
  });
  const items: HistoryItem[] = data?.items ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / 20);
  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-highlight" /></div>;
  if (items.length === 0) return <p className="text-center py-12 text-sm text-muted-foreground">No follow-ups recorded yet.</p>;
  return (
    <div className="space-y-3">
      {items.map((i) => (
        <div key={i.id} className="bg-card border border-border rounded-2xl p-4 text-sm space-y-1">
          <div className="flex items-start justify-between gap-3">
            <span className="font-semibold text-foreground">{i.author.name}</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(i.resolvedAt).toLocaleString()}</span>
          </div>
          <p className="text-foreground">{outcomeLabel(i.outcome)}</p>
          {i.note && <p className="text-muted-foreground whitespace-pre-wrap break-words">"{i.note}"</p>}
          <p className="text-xs text-muted-foreground">
            {i.claimedBy ? `Followed up by ${i.claimedBy.name} · ` : ''}Closed by {i.resolvedBy?.name ?? 'a former admin'} · {i.source}
          </p>
        </div>
      ))}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 text-sm bg-muted/60 rounded-xl disabled:opacity-40">Previous</button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 text-sm bg-muted/60 rounded-xl disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
};

const AdminCrisisAlertsTab: React.FC = () => {
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'open' | 'history'>('open');
  const [resolving, setResolving] = useState<string | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-crisis-signals', page],
    queryFn: () => api.get(`/forum/admin/crisis-signals?page=${page}&limit=20`).then(r => r.data),
  });

  const claimMutation = useMutation({
    mutationFn: ({ postId, source }: { postId: string; source: 'forum' | 'circle' }) =>
      api.patch(`/forum/admin/crisis-signals/${postId}/claim?source=${source}`),
    onSuccess: () => toastSuccess("You're following this up — other admins can see that"),
    // 409 when someone else got there first: refresh so their name shows.
    onError: (err) => toastError(parseApiError(err).userMessage),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-crisis-signals'] }),
  });

  const onResolved = () => {
    setResolving(null);
    queryClient.invalidateQueries({ queryKey: ['admin-crisis-signals'] });
    queryClient.invalidateQueries({ queryKey: ['admin-crisis-history'] });
  };

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
          Forum and Circle posts flagged by the automated welfare detection system. Claim one before reaching out, so no one is contacted twice, then record what happened.
        </p>
      </div>

      <div className="flex gap-2" role="tablist">
        {([['open', 'Open flags', AlertTriangle], ['history', 'Follow-up history', History]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${view === id ? 'bg-foreground text-background' : 'bg-muted/60 text-muted-foreground hover:bg-muted'}`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-sm text-amber-800 dark:text-amber-300">
        <strong>Reminder:</strong> Always follow your platform's welfare protocol before clearing a flag. If a user appears to be in crisis, contact them directly or refer to relevant support services.
      </div>

      {view === 'history' ? (
        <FollowUpHistory />
      ) : isLoading ? (
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

                {post.followUp?.claimedBy && (
                  <p className="text-sm text-foreground flex items-center gap-2">
                    <HandHeart size={14} className="text-highlight" />
                    {post.followUp.claimedBy.id === user?.id ? 'You are' : `${post.followUp.claimedBy.name} is`} following this up
                    {post.followUp.claimedAt && <span className="text-xs text-muted-foreground">since {new Date(post.followUp.claimedAt).toLocaleString()}</span>}
                  </p>
                )}

                {resolving === post.id ? (
                  <ResolveForm post={post} onDone={onResolved} onCancel={() => setResolving(null)} />
                ) : (
                  <div className="flex justify-end gap-2">
                    {!post.followUp && (
                      <button
                        onClick={() => claimMutation.mutate({ postId: post.id, source: post.source })}
                        disabled={claimMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-highlight text-foreground text-sm font-semibold rounded-xl hover:bg-secondary transition-colors disabled:opacity-50"
                      >
                        <HandHeart size={14} /> I'll Follow Up
                      </button>
                    )}
                    <button
                      onClick={() => setResolving(post.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      <CheckCircle size={14} /> Record Outcome
                    </button>
                  </div>
                )}
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
