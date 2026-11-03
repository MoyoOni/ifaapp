import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ChevronLeft, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { useToast } from '@/shared/components/toast';
import { parseApiError } from '@/shared/utils/api-error';
import { reasonLabel } from './report-reasons';

interface Person { id: string; name: string; role?: string; email?: string }
interface CaseSummary {
  id: string;
  ref: string;
  source: string;
  category: string;
  summary: string;
  priority: number;
  status: string;
  createdAt: string;
  subject: Person | null;
  reporter: Person | null;
  handler: Person | null;
}
interface Restriction { id: string; type: string; reason: string; expiresAt: string | null; liftedAt: string | null; protectedUserId: string | null; createdAt: string }
interface CaseDetail extends CaseSummary {
  subjectId: string | null;
  reporterId: string | null;
  entries: { id: string; kind: string; text: string; author: string | null; createdAt: string }[];
  restrictions: Restriction[];
}

const PRIORITY: Record<number, { label: string; className: string }> = {
  1: { label: 'P1 Critical', className: 'bg-destructive text-destructive-foreground' },
  2: { label: 'P2 High', className: 'bg-highlight text-foreground' },
  3: { label: 'P3 Standard', className: 'bg-muted text-foreground' },
};
const SOURCE: Record<string, string> = { COMPLAINT: 'Concern about a practitioner', USER_REPORT: 'Member report', EMAIL: 'Email', OTHER: 'Other', CRISIS: 'Crisis flag' };
const RESTRICTIONS: Record<string, string> = {
  PAUSE_BOOKINGS: 'Pause new bookings',
  PAUSE_SELLING: 'Pause selling',
  HIDE_PROFILE: 'Hide profile',
  PAUSE_POSTING: 'Pause posting',
  NO_CONTACT: 'No contact with the reporter',
};
const field = 'mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm';

// docs/safeguarding SAFE-02/05 (November 3, 2026): the case register --
// every safeguarding matter, whatever route it came by -- with the log of
// what was done and the restrictions on the person concerned. Safeguarding
// and Super admins only.
const SafeguardingCasesTab: React.FC = () => {
  const [status, setStatus] = useState<'open' | 'CLOSED'>('open');
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading } = useQuery<{ cases: CaseSummary[]; crisisOpen: number; alertsConfigured: boolean }>({
    queryKey: ['safeguarding-cases', status],
    queryFn: async () => (await api.get(`/safeguarding/cases${status === 'CLOSED' ? '?status=CLOSED' : ''}`)).data,
  });

  if (openId) return <CaseView id={openId} onBack={() => setOpenId(null)} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck size={22} /> Safeguarding Cases
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Every safeguarding concern, whichever way it arrived. Follow the procedure in docs/safeguarding (Part B).
        </p>
      </div>

      {data && data.crisisOpen > 0 && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground flex items-center gap-2">
          <AlertTriangle size={16} /> {data.crisisOpen} crisis flag{data.crisisOpen === 1 ? '' : 's'} waiting in Crisis Alerts.
        </div>
      )}
      {data && !data.alertsConfigured && (
        <p className="text-xs text-muted-foreground">
          Urgent cases alert you only inside Ìlú Àṣẹ. Set up the Telegram alert (docs/safeguarding) to be told on your phone.
        </p>
      )}
      {data?.alertsConfigured && <TestAlertButton />}

      <LogCaseForm />

      <div className="flex gap-2" role="tablist">
        {(['open', 'CLOSED'] as const).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={status === s}
            onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${status === s ? 'bg-foreground text-background' : 'bg-muted/60 text-muted-foreground'}`}
          >
            {s === 'open' ? 'Open' : 'Closed'}
          </button>
        ))}
      </div>

      {isLoading ? null : !data?.cases.length ? (
        <p className="text-sm text-muted-foreground">No {status === 'open' ? 'open' : 'closed'} cases.</p>
      ) : (
        <ul className="space-y-3">
          {data.cases.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => setOpenId(c.id)} className="w-full text-left bg-card border border-border rounded-xl p-4 hover:bg-muted/40">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-foreground">{c.ref}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY[c.priority]?.className}`}>{PRIORITY[c.priority]?.label}</span>
                  <span className="text-xs text-muted-foreground">{reasonLabel(c.category)}</span>
                  <span className="text-xs text-muted-foreground">· {SOURCE[c.source] ?? c.source}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{c.status === 'INVESTIGATING' ? 'Investigating' : c.status === 'CLOSED' ? 'Closed' : 'Open'}</span>
                </div>
                <p className="text-sm text-foreground mt-1 line-clamp-2">{c.summary}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  About {c.subject?.name ?? 'someone not yet identified'} · {c.handler ? `Handled by ${c.handler.name}` : 'No handler yet'} ·{' '}
                  {new Date(c.createdAt).toLocaleDateString()}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const TestAlertButton: React.FC = () => {
  const toast = useToast();
  const test = useMutation({
    mutationFn: async () => (await api.post('/safeguarding/alerts/test')).data as { sent: boolean },
    onSuccess: (r) => (r.sent ? toast.success('Test alert sent — check Telegram') : toast.error('The test alert could not be sent. Check the bot settings.')),
    onError: (err) => toast.error(parseApiError(err).userMessage),
  });
  return (
    <button type="button" onClick={() => test.mutate()} disabled={test.isPending} className="text-xs underline">
      Telegram alerts are on — send a test alert
    </button>
  );
};

const LogCaseForm: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: 'OTHER', summary: '', priority: 2 });
  const create = useMutation({
    mutationFn: () => api.post('/safeguarding/cases', { source: 'EMAIL', ...form }),
    onSuccess: () => {
      toast.success('Case logged');
      setOpen(false);
      setForm({ category: 'OTHER', summary: '', priority: 2 });
      queryClient.invalidateQueries({ queryKey: ['safeguarding-cases'] });
    },
    onError: (err) => toast.error(parseApiError(err).userMessage),
  });
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold underline">
        Log a concern that arrived by email
      </button>
    );
  }
  return (
    <form
      aria-label="Log a case"
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate();
      }}
      className="bg-card border border-border rounded-xl p-4 grid gap-3 sm:grid-cols-2"
    >
      <label className="text-sm">
        <span className="font-medium">Category</span>
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={field}>
          {['SEXUAL_MISCONDUCT', 'HARASSMENT', 'CONTROLLING_BEHAVIOR', 'FEAR_BASED_MANIPULATION', 'FINANCIAL_EXPLOITATION', 'CONFIDENTIALITY_BREACH', 'OTHER'].map((c) => (
            <option key={c} value={c}>{reasonLabel(c)}</option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="font-medium">Priority</span>
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className={field}>
          <option value={1}>P1 Critical — danger now</option>
          <option value={2}>P2 High</option>
          <option value={3}>P3 Standard</option>
        </select>
      </label>
      <label className="text-sm sm:col-span-2">
        <span className="font-medium">What was reported (no more detail than needed)</span>
        <textarea required minLength={10} maxLength={500} rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className={field} />
      </label>
      <div className="sm:col-span-2 flex gap-2">
        <button type="submit" disabled={create.isPending} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">Log Case</button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl border border-border text-sm">Cancel</button>
      </div>
    </form>
  );
};

const CaseView: React.FC<{ id: string; onBack: () => void }> = ({ id, onBack }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: c } = useQuery<CaseDetail>({ queryKey: ['safeguarding-case', id], queryFn: async () => (await api.get(`/safeguarding/cases/${id}`)).data });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['safeguarding-case', id] });
    queryClient.invalidateQueries({ queryKey: ['safeguarding-cases'] });
  };
  const onError = (err: unknown) => toast.error(parseApiError(err).userMessage);
  const update = useMutation({ mutationFn: (body: Record<string, unknown>) => api.patch(`/safeguarding/cases/${id}`, body), onSuccess: refresh, onError });
  const [entry, setEntry] = useState({ kind: 'NOTE', text: '' });
  const addEntry = useMutation({
    mutationFn: () => api.post(`/safeguarding/cases/${id}/entries`, entry),
    onSuccess: () => {
      setEntry({ kind: 'NOTE', text: '' });
      refresh();
    },
    onError,
  });
  const [restriction, setRestriction] = useState({ type: 'PAUSE_BOOKINGS', reason: '', expiresAt: '' });
  const apply = useMutation({
    mutationFn: () =>
      api.post('/safeguarding/restrictions', {
        userId: c!.subjectId,
        caseId: id,
        type: restriction.type,
        reason: restriction.reason,
        ...(restriction.type === 'NO_CONTACT' ? { protectedUserId: c!.reporterId } : {}),
        ...(restriction.expiresAt ? { expiresAt: new Date(restriction.expiresAt).toISOString() } : {}),
      }),
    onSuccess: () => {
      toast.success('Restriction applied');
      setRestriction({ type: 'PAUSE_BOOKINGS', reason: '', expiresAt: '' });
      refresh();
    },
    onError,
  });
  const lift = useMutation({ mutationFn: (rid: string) => api.post(`/safeguarding/restrictions/${rid}/lift`), onSuccess: refresh, onError });

  if (!c) return null;
  const active = c.restrictions.filter((r) => !r.liftedAt && (!r.expiresAt || new Date(r.expiresAt) > new Date()));
  return (
    <div className="space-y-6">
      <button type="button" onClick={onBack} className="text-sm flex items-center gap-1 text-muted-foreground">
        <ChevronLeft size={14} /> All cases
      </button>
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-mono text-xl font-bold text-foreground">{c.ref}</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY[c.priority]?.className}`}>{PRIORITY[c.priority]?.label}</span>
          <span className="text-sm text-muted-foreground">{reasonLabel(c.category)} · {SOURCE[c.source] ?? c.source}</span>
        </div>
        <p className="text-sm text-foreground whitespace-pre-wrap">{c.summary}</p>
        <p className="text-sm text-muted-foreground">
          About: {c.subject ? `${c.subject.name} (${c.subject.role?.toLowerCase()})` : 'not yet identified'} · Reported by: {c.reporter?.name ?? 'email / not recorded'}
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <select aria-label="Status" value={c.status} onChange={(e) => update.mutate({ status: e.target.value })} className="rounded-lg border border-border bg-background px-2 py-1 text-sm">
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select aria-label="Priority" value={c.priority} onChange={(e) => update.mutate({ priority: Number(e.target.value) })} className="rounded-lg border border-border bg-background px-2 py-1 text-sm">
            <option value={1}>P1 Critical</option>
            <option value={2}>P2 High</option>
            <option value={3}>P3 Standard</option>
          </select>
          {c.handler?.id === user?.id ? (
            <span className="text-sm text-muted-foreground">You are handling this case</span>
          ) : (
            <button type="button" onClick={() => update.mutate({ handlerId: user?.id })} className="px-3 py-1 rounded-lg border border-border text-sm">
              {c.handler ? `Take over from ${c.handler.name}` : 'Assign to me'}
            </button>
          )}
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="font-bold text-foreground">Case log</h3>
        <ol className="space-y-2">
          {c.entries.map((e) => (
            <li key={e.id} className="text-sm border-l-2 border-border pl-3">
              <span className="text-xs font-semibold text-muted-foreground">{e.kind} · {e.author ?? 'system'} · {new Date(e.createdAt).toLocaleString()}</span>
              <p className="text-foreground whitespace-pre-wrap">{e.text}</p>
            </li>
          ))}
        </ol>
        <form
          aria-label="Add to the case log"
          onSubmit={(ev) => {
            ev.preventDefault();
            addEntry.mutate();
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <select aria-label="Entry type" value={entry.kind} onChange={(e) => setEntry({ ...entry, kind: e.target.value })} className="rounded-lg border border-border bg-background px-2 py-2 text-sm">
            <option value="NOTE">Note</option>
            <option value="CONTACT">Contact with someone</option>
            <option value="MEASURE">Protective measure</option>
            <option value="DECISION">Decision</option>
          </select>
          <input aria-label="Entry" required minLength={2} value={entry.text} onChange={(e) => setEntry({ ...entry, text: e.target.value })} placeholder="What happened or was decided" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <button type="submit" disabled={addEntry.isPending} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">Add</button>
        </form>
      </section>

      {c.subjectId && (
        <section className="space-y-3">
          <h3 className="font-bold text-foreground">Restrictions on {c.subject?.name ?? 'this person'}</h3>
          <p className="text-xs text-muted-foreground">Precautions while you look into it, not findings. Each is recorded on this case.</p>
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground">None in place.</p>
          ) : (
            <ul className="space-y-2">
              {active.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-sm bg-muted/40 rounded-lg p-3">
                  <span>
                    <strong>{RESTRICTIONS[r.type] ?? r.type}</strong> — {r.reason}
                    {r.expiresAt ? ` (until ${new Date(r.expiresAt).toLocaleDateString()})` : ''}
                  </span>
                  <button type="button" onClick={() => lift.mutate(r.id)} className="px-3 py-1 rounded-lg border border-border text-xs">Lift</button>
                </li>
              ))}
            </ul>
          )}
          <form
            aria-label="Apply a restriction"
            onSubmit={(ev) => {
              ev.preventDefault();
              apply.mutate();
            }}
            className="grid gap-2 sm:grid-cols-3"
          >
            <select aria-label="Restriction" value={restriction.type} onChange={(e) => setRestriction({ ...restriction, type: e.target.value })} className={field}>
              {Object.entries(RESTRICTIONS)
                .filter(([t]) => t !== 'NO_CONTACT' || !!c.reporterId)
                .map(([t, label]) => (
                  <option key={t} value={t}>{label}</option>
                ))}
            </select>
            <input aria-label="Reason" required minLength={5} value={restriction.reason} onChange={(e) => setRestriction({ ...restriction, reason: e.target.value })} placeholder="Reason" className={field} />
            <input aria-label="Until (optional)" type="date" value={restriction.expiresAt} onChange={(e) => setRestriction({ ...restriction, expiresAt: e.target.value })} className={field} />
            <div className="sm:col-span-3">
              <button type="submit" disabled={apply.isPending} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">Apply Restriction</button>
              <span className="text-xs text-muted-foreground ml-2">To suspend the whole account, use Users.</span>
            </div>
          </form>
        </section>
      )}
    </div>
  );
};

export default SafeguardingCasesTab;
