import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ShieldAlert, CheckCircle, XCircle, Plus, Trash2, ToggleLeft, ToggleRight, Tag, Settings } from 'lucide-react';

const fmt = new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' });

type View = 'queue' | 'rules';

interface HeldPost {
  id: string;
  content: string;
  reviewReason?: string;
  createdAt: string;
  author: { id: string; name: string; email: string; avatar?: string; culturalLevel: string };
  thread: { id: string; title: string; category: { id: string; name: string } };
}

interface QueueResponse {
  items: HeldPost[];
  total: number;
  page: number;
  pages: number;
}

interface FlagRule {
  id: string;
  type: 'KEYWORD' | 'CATEGORY_MOD';
  value: string;
  reason?: string;
  isActive: boolean;
  createdAt: string;
  creator: { id: string; name: string };
}

function RejectModal({ onClose, onReject, isPending }: { onClose: () => void; onReject: (reason: string) => void; isPending: boolean }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
        <h3 className="font-semibold text-lg">Reject Post</h3>
        <div className="space-y-1">
          <label className="text-sm font-medium">Reason sent to author</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this post doesn't meet cultural integrity guidelines…"
            className="w-full border border-border rounded px-3 py-2 text-sm bg-card text-foreground resize-none"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded hover:bg-highlight">Cancel</button>
          <button
            type="button"
            onClick={() => onReject(reason)}
            disabled={isPending || !reason.trim()}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? 'Rejecting…' : 'Reject & Notify'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddRuleModal({ onClose, onAdd, isPending }: { onClose: () => void; onAdd: (d: { type: 'KEYWORD' | 'CATEGORY_MOD'; value: string; reason?: string }) => void; isPending: boolean }) {
  const [type, setType] = useState<'KEYWORD' | 'CATEGORY_MOD'>('KEYWORD');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
        <h3 className="font-semibold text-lg">Add Flag Rule</h3>
        <div className="flex gap-2">
          {(['KEYWORD', 'CATEGORY_MOD'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={`px-3 py-1.5 text-sm rounded border ${type === t ? 'border-foreground bg-highlight font-medium' : 'border-border text-muted-foreground'}`}>
              {t === 'KEYWORD' ? 'Keyword' : 'Category Moderation'}
            </button>
          ))}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{type === 'KEYWORD' ? 'Keyword or phrase' : 'Category ID'}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={type === 'KEYWORD' ? 'e.g. "fake babalawo"' : 'Category ID from DB'}
            className="w-full border border-border rounded px-3 py-2 text-sm bg-card text-foreground"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Reason (optional)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why this rule exists…"
            className="w-full border border-border rounded px-3 py-2 text-sm bg-card text-foreground"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded hover:bg-highlight">Cancel</button>
          <button
            type="button"
            onClick={() => onAdd({ type, value, reason: reason.trim() || undefined })}
            disabled={isPending || !value.trim()}
            className="px-4 py-2 text-sm bg-foreground text-background rounded hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? 'Adding…' : 'Add Rule'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminIntegrityTab() {
  const qc = useQueryClient();
  const [view, setView] = useState<View>('queue');
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [showAddRule, setShowAddRule] = useState(false);
  const [page, setPage] = useState(1);

  const { data: queue, isLoading: queueLoading } = useQuery<QueueResponse>({
    queryKey: ['admin', 'integrity', 'queue', page],
    queryFn: () => api.get('/admin/integrity/queue', { params: { page } }).then((r) => r.data),
    enabled: view === 'queue',
  });

  const { data: rules, isLoading: rulesLoading } = useQuery<FlagRule[]>({
    queryKey: ['admin', 'integrity', 'rules'],
    queryFn: () => api.get('/admin/integrity/rules').then((r) => r.data),
    enabled: view === 'rules',
  });

  const approveMutation = useMutation({
    mutationFn: (postId: string) => api.post(`/admin/integrity/queue/${postId}/approve`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'integrity', 'queue'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ postId, reason }: { postId: string; reason: string }) =>
      api.post(`/admin/integrity/queue/${postId}/reject`, { reason }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'integrity', 'queue'] });
      setRejectTarget(null);
    },
  });

  const addRuleMutation = useMutation({
    mutationFn: (data: { type: 'KEYWORD' | 'CATEGORY_MOD'; value: string; reason?: string }) =>
      api.post('/admin/integrity/rules', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'integrity', 'rules'] });
      setShowAddRule(false);
    },
  });

  const toggleRuleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/integrity/rules/${id}`, { isActive }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'integrity', 'rules'] }),
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/integrity/rules/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'integrity', 'rules'] }),
  });

  return (
    <div className="space-y-6">
      {rejectTarget && (
        <RejectModal
          onClose={() => setRejectTarget(null)}
          onReject={(reason) => rejectMutation.mutate({ postId: rejectTarget, reason })}
          isPending={rejectMutation.isPending}
        />
      )}
      {showAddRule && (
        <AddRuleModal
          onClose={() => setShowAddRule(false)}
          onAdd={(d) => addRuleMutation.mutate(d)}
          isPending={addRuleMutation.isPending}
        />
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> Cultural Integrity</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review held posts and manage auto-flagging rules.
            {queue && view === 'queue' && queue.total > 0 && (
              <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">{queue.total} awaiting review</span>
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {([['queue', 'Review Queue'], ['rules', 'Flag Rules']] as [View, string][]).map(([v, label]) => (
          <button key={v} type="button" onClick={() => setView(v)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${view === v ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Review Queue */}
      {view === 'queue' && (
        <div className="space-y-4">
          {queueLoading ? (
            <p className="text-center text-sm text-muted-foreground py-12">Loading…</p>
          ) : !queue?.items.length ? (
            <div className="border border-border rounded-lg px-4 py-12 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="font-medium">Queue is clear</p>
              <p className="text-sm text-muted-foreground">No posts held for review.</p>
            </div>
          ) : (
            <>
              {queue.items.map((post) => (
                <div key={post.id} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <span className="font-medium text-foreground">{post.author.name}</span>
                        <span>·</span>
                        <span>{post.author.culturalLevel}</span>
                        <span>·</span>
                        <span>{post.thread.category.name}</span>
                        <span>·</span>
                        <span>{fmt.format(new Date(post.createdAt))}</span>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">in: {post.thread.title}</p>
                      <p className="text-sm text-foreground line-clamp-4 whitespace-pre-wrap">{post.content}</p>
                      {post.reviewReason && (
                        <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">Flagged: {post.reviewReason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setRejectTarget(post.id)}
                      disabled={rejectMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => approveMutation.mutate(post.id)}
                      disabled={approveMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-foreground text-background rounded hover:opacity-90 disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                  </div>
                </div>
              ))}
              {/* Pagination */}
              {queue.pages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1 text-sm border border-border rounded disabled:opacity-40 hover:bg-highlight">← Prev</button>
                  <span className="text-sm text-muted-foreground">Page {page} of {queue.pages}</span>
                  <button type="button" onClick={() => setPage((p) => Math.min(queue.pages, p + 1))} disabled={page === queue.pages}
                    className="px-3 py-1 text-sm border border-border rounded disabled:opacity-40 hover:bg-highlight">Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Flag Rules */}
      {view === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowAddRule(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-foreground text-background rounded hover:opacity-90"
            >
              <Plus className="w-4 h-4" /> Add Rule
            </button>
          </div>

          {rulesLoading ? (
            <p className="text-center text-sm text-muted-foreground py-12">Loading…</p>
          ) : !rules?.length ? (
            <div className="border border-border rounded-lg px-4 py-12 text-center">
              <Settings className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="font-medium">No rules configured</p>
              <p className="text-sm text-muted-foreground">Add keywords or category moderation rules above.</p>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              {rules.map((rule) => (
                <div key={rule.id} className={`flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 ${!rule.isActive ? 'opacity-50' : ''}`}>
                  <div className="shrink-0">
                    {rule.type === 'KEYWORD' ? <Tag className="w-4 h-4 text-muted-foreground" /> : <Settings className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{rule.value}</p>
                    <p className="text-xs text-muted-foreground">
                      {rule.type === 'KEYWORD' ? 'Keyword' : 'Category Moderation'}
                      {rule.reason && ` · ${rule.reason}`}
                      {` · by ${rule.creator.name}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleRuleMutation.mutate({ id: rule.id, isActive: !rule.isActive })}
                    disabled={toggleRuleMutation.isPending}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={rule.isActive ? 'Disable rule' : 'Enable rule'}
                  >
                    {rule.isActive ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRuleMutation.mutate(rule.id)}
                    disabled={deleteRuleMutation.isPending}
                    className="text-muted-foreground hover:text-red-600 transition-colors"
                    aria-label="Delete rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
