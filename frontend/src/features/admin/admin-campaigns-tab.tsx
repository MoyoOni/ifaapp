import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Mail, Plus, Send, Trash2, Clock, CheckCircle } from 'lucide-react';

const fmt = new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' });

const SEGMENTS = [
  { value: 'ALL', label: 'All Users' },
  { value: 'CLIENTS', label: 'Clients only' },
  { value: 'BABALAWOS', label: 'Practitioners only' },
  { value: 'DEVOTED', label: 'Devoted subscribers' },
  { value: 'FREE_TIER', label: 'Free tier (conversion targets)' },
  { value: 'NEW_30D', label: 'New users (last 30 days)' },
  { value: 'INACTIVE_30D', label: 'Inactive 30+ days (re-engagement)' },
  { value: 'COUNTRY_NG', label: 'Nigeria' },
  { value: 'COUNTRY_UK', label: 'United Kingdom' },
  { value: 'COUNTRY_US', label: 'United States' },
];

interface Campaign {
  id: string;
  subject: string;
  body: string;
  segment: string;
  status: string;
  scheduledAt?: string;
  sentAt?: string;
  recipientCount: number;
  openCount: number;
  clickCount: number;
  createdAt: string;
  creator: { id: string; name: string };
}

interface CampaignsResponse {
  items: Campaign[];
  total: number;
  page: number;
  pages: number;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: 'bg-muted text-muted-foreground',
    SCHEDULED: 'bg-amber-100 text-amber-800',
    SENT: 'bg-green-100 text-green-800',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status}
    </span>
  );
}

function CreateModal({ onClose, onCreate, isPending }: {
  onClose: () => void;
  onCreate: (d: { subject: string; body: string; segment: string; scheduledAt?: string }) => void;
  isPending: boolean;
}) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [segment, setSegment] = useState('ALL');
  const [scheduledAt, setScheduledAt] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg p-6 space-y-4 shadow-xl">
        <h3 className="font-semibold text-lg flex items-center gap-2"><Mail className="w-5 h-5" /> New Campaign</h3>

        <div className="space-y-1">
          <label className="text-sm font-medium">Segment</label>
          <select value={segment} onChange={(e) => setSegment(e.target.value)}
            className="w-full border border-border rounded px-3 py-2 text-sm bg-card text-foreground">
            {SEGMENTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Subject line</label>
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. A new practitioner has joined Ìlú Àṣẹ"
            className="w-full border border-border rounded px-3 py-2 text-sm bg-card text-foreground" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Body</label>
          <p className="text-xs text-muted-foreground">Use {'{{name}}'} and {'{{yorubaName}}'} as template variables.</p>
          <textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)}
            placeholder="Hello {{name}}, …"
            className="w-full border border-border rounded px-3 py-2 text-sm bg-card text-foreground resize-none" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Schedule (optional — leave blank to save as draft)</label>
          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full border border-border rounded px-3 py-2 text-sm bg-card text-foreground" />
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded hover:bg-highlight">Cancel</button>
          <button
            type="button"
            onClick={() => onCreate({ subject, body, segment, scheduledAt: scheduledAt || undefined })}
            disabled={isPending || !subject.trim() || !body.trim()}
            className="px-4 py-2 text-sm bg-foreground text-background rounded hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save Campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminCampaignsTab() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery<CampaignsResponse>({
    queryKey: ['admin', 'campaigns', page],
    queryFn: () => api.get('/admin/campaigns', { params: { page } }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: { subject: string; body: string; segment: string; scheduledAt?: string }) =>
      api.post('/admin/campaigns', d).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'campaigns'] }); setShowCreate(false); },
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/campaigns/${id}/send`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'campaigns'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/campaigns/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'campaigns'] }),
  });

  return (
    <div className="space-y-6">
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={(d) => createMutation.mutate(d)}
          isPending={createMutation.isPending}
        />
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Mail className="w-5 h-5" /> Email Campaigns</h2>
          <p className="text-sm text-muted-foreground mt-1">Create and send segmented email campaigns to your community.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-foreground text-background rounded hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {isLoading ? (
        <p className="text-center text-sm text-muted-foreground py-12">Loading…</p>
      ) : !data?.items.length ? (
        <div className="border border-border rounded-lg px-4 py-12 text-center">
          <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="font-medium">No campaigns yet</p>
          <p className="text-sm text-muted-foreground">Create your first email campaign above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((c) => (
            <div key={c.id} className="border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">{c.subject}</p>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {SEGMENTS.find((s) => s.value === c.segment)?.label ?? c.segment}
                    {' · '}by {c.creator.name}
                    {' · '}{fmt.format(new Date(c.createdAt))}
                  </p>
                  {c.status === 'SENT' && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-600" /> {c.recipientCount.toLocaleString()} sent</span>
                      {c.openCount > 0 && <span>{c.openCount} opens</span>}
                      {c.clickCount > 0 && <span>{c.clickCount} clicks</span>}
                    </p>
                  )}
                  {c.status === 'SCHEDULED' && c.scheduledAt && (
                    <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Scheduled: {fmt.format(new Date(c.scheduledAt))}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {c.status !== 'SENT' && (
                    <button
                      type="button"
                      onClick={() => sendMutation.mutate(c.id)}
                      disabled={sendMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-foreground text-background rounded hover:opacity-90 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" /> Send now
                    </button>
                  )}
                  {c.status !== 'SENT' && (
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(c.id)}
                      disabled={deleteMutation.isPending}
                      className="text-muted-foreground hover:text-red-600 transition-colors p-1.5"
                      aria-label="Delete campaign"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {(data.pages ?? 1) > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 text-sm border border-border rounded disabled:opacity-40 hover:bg-highlight">← Prev</button>
              <span className="text-sm text-muted-foreground">Page {page} of {data.pages}</span>
              <button type="button" onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages}
                className="px-3 py-1 text-sm border border-border rounded disabled:opacity-40 hover:bg-highlight">Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
