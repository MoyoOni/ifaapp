import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, CalendarDays, ExternalLink, Loader2, Users } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { useToast } from '@/shared/components/toast';
import { parseApiError } from '@/shared/utils/api-error';
import { FeatureHeader } from '@/shared/components/feature-header';

interface StorySession {
  id: string;
  title: string;
  description?: string | null;
  scheduledAt: string;
  platform: string;
  externalUrl: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
  oralHistoryId?: string | null;
  _count: { rsvps: number };
}

const PLATFORMS = ['ZOOM', 'MEET', 'YOUTUBE', 'OTHER'] as const;

// COMMUNITY_BACKLOG.md FOR-019 (owner decision November 2, 2026): storytelling
// events are the forum's live sessions of kind STORYTELLING. Members RSVP;
// afterwards an admin can save the story told into the Oral History archive,
// where it is reviewed and published like any community story.
const StorytellingView: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: sessions = [], isLoading } = useQuery<StorySession[]>({
    queryKey: ['storytelling-sessions'],
    queryFn: async () => (await api.get('/forum/live-sessions?kind=STORYTELLING')).data ?? [],
  });
  const { data: myRsvps = [] } = useQuery<string[]>({
    queryKey: ['storytelling-my-rsvps'],
    queryFn: async () => (await api.get('/forum/live-sessions/my-rsvps')).data ?? [],
    enabled: isAuthenticated,
  });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['storytelling-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['storytelling-my-rsvps'] });
  };
  const onError = (err: unknown) => toast.error(parseApiError(err).userMessage);

  const rsvp = useMutation({ mutationFn: (id: string) => api.post(`/forum/live-sessions/${id}/rsvp`), onSuccess: refresh, onError });
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StorySession['status'] }) => api.patch(`/forum/live-sessions/${id}/status`, { status }),
    onSuccess: refresh,
    onError,
  });

  const upcoming = sessions.filter((s) => s.status === 'SCHEDULED' || s.status === 'LIVE');
  const past = sessions.filter((s) => s.status === 'ENDED').reverse();

  return (
    <div className="py-6 animate-in fade-in duration-500 max-w-3xl mx-auto space-y-8">
      <FeatureHeader
        feature="community"
        title="Storytelling Evenings"
        subtitle="Gather to hear the stories of our tradition, told by those who carry them. Stories shared here can be kept in the Oral History archive."
        icon={BookOpen}
      />

      {isAdmin && <ScheduleForm onScheduled={refresh} />}

      <section>
        <h2 className="text-lg font-bold text-foreground mb-3">Coming up</h2>
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No storytelling evenings are scheduled yet. Check back soon.</p>
        ) : (
          <ul className="space-y-4">
            {upcoming.map((s) => {
              const attending = myRsvps.includes(s.id);
              return (
                <li key={s.id} className="bg-card border border-border rounded-2xl p-5 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-bold text-foreground">{s.title}</h3>
                    {s.status === 'LIVE' && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">Live now</span>
                    )}
                  </div>
                  {s.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{s.description}</p>}
                  <p className="text-sm text-foreground flex items-center gap-2">
                    <CalendarDays size={14} /> {new Date(s.scheduledAt).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
                    <span className="text-muted-foreground">(your local time)</span>
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users size={12} /> {s._count.rsvps} {s._count.rsvps === 1 ? 'person' : 'people'} coming
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {isAuthenticated ? (
                      <button
                        type="button"
                        onClick={() => rsvp.mutate(s.id)}
                        disabled={rsvp.isPending}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${attending ? 'border border-border' : 'bg-primary text-primary-foreground'}`}
                      >
                        {attending ? "I can't come after all" : "I'll Be There"}
                      </button>
                    ) : (
                      <Link to="/login" className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-border">
                        Sign in to RSVP
                      </Link>
                    )}
                    <a
                      href={s.externalUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold border border-border"
                    >
                      <ExternalLink size={14} /> Join ({s.platform.charAt(0) + s.platform.slice(1).toLowerCase()})
                    </a>
                    {isAdmin && s.status === 'SCHEDULED' && (
                      <button type="button" onClick={() => setStatus.mutate({ id: s.id, status: 'LIVE' })} className="px-3 py-1.5 rounded-lg text-sm border border-border">
                        Mark Live
                      </button>
                    )}
                    {isAdmin && (
                      <button type="button" onClick={() => setStatus.mutate({ id: s.id, status: 'ENDED' })} className="px-3 py-1.5 rounded-lg text-sm border border-border">
                        End
                      </button>
                    )}
                    {isAdmin && s.status === 'SCHEDULED' && (
                      <button
                        type="button"
                        onClick={() => window.confirm('Cancel this storytelling evening?') && setStatus.mutate({ id: s.id, status: 'CANCELLED' })}
                        className="px-3 py-1.5 rounded-lg text-sm border border-destructive/40 text-destructive"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">Past evenings</h2>
          <ul className="space-y-3">
            {past.map((s) => (
              <li key={s.id} className="bg-card border border-border rounded-2xl p-4 space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold text-foreground">{s.title}</span>
                  <span className="text-xs text-muted-foreground">{new Date(s.scheduledAt).toLocaleDateString()}</span>
                </div>
                {s.oralHistoryId ? (
                  <p className="text-sm text-muted-foreground">
                    The story has been kept in the <Link to="/marketplace/stories" className="underline">Oral History archive</Link>.
                  </p>
                ) : (
                  isAdmin && <SaveStoryForm session={s} onSaved={refresh} />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

const inputClass = 'mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm';

const ScheduleForm: React.FC<{ onScheduled: () => void }> = ({ onScheduled }) => {
  const toast = useToast();
  const [form, setForm] = useState({ title: '', description: '', scheduledAt: '', platform: 'ZOOM', externalUrl: '' });
  const schedule = useMutation({
    mutationFn: () =>
      api.post('/forum/live-sessions', {
        kind: 'STORYTELLING',
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        platform: form.platform,
        externalUrl: form.externalUrl.trim(),
      }),
    onSuccess: () => {
      toast.success('Storytelling evening scheduled');
      setForm({ title: '', description: '', scheduledAt: '', platform: 'ZOOM', externalUrl: '' });
      onScheduled();
    },
    onError: (err) => toast.error(parseApiError(err).userMessage),
  });

  return (
    <form
      aria-label="Schedule a storytelling evening"
      onSubmit={(e) => {
        e.preventDefault();
        schedule.mutate();
      }}
      className="bg-card border border-border rounded-2xl p-5 grid gap-3 sm:grid-cols-2"
    >
      <h2 className="sm:col-span-2 font-bold text-foreground">Schedule a storytelling evening</h2>
      <label className="text-sm sm:col-span-2">
        <span className="font-medium">Title *</span>
        <input required minLength={3} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
      </label>
      <label className="text-sm sm:col-span-2">
        <span className="font-medium">What will be shared</span>
        <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
      </label>
      <label className="text-sm">
        <span className="font-medium">When *</span>
        <input required type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className={inputClass} />
      </label>
      <label className="text-sm">
        <span className="font-medium">Platform</span>
        <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className={inputClass}>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0) + p.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm sm:col-span-2">
        <span className="font-medium">Meeting link *</span>
        <input required type="url" placeholder="https://…" value={form.externalUrl} onChange={(e) => setForm({ ...form, externalUrl: e.target.value })} className={inputClass} />
      </label>
      <div className="sm:col-span-2">
        <button type="submit" disabled={schedule.isPending} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
          Schedule
        </button>
      </div>
    </form>
  );
};

const SaveStoryForm: React.FC<{ session: StorySession; onSaved: () => void }> = ({ session, onSaved }) => {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: session.title, storyteller: '', content: '' });
  const save = useMutation({
    mutationFn: () =>
      api.post(`/forum/live-sessions/${session.id}/story`, {
        title: form.title.trim(),
        content: form.content.trim(),
        storyteller: form.storyteller.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Saved to the archive as a draft. Review and publish it from Cultural Content.');
      onSaved();
    },
    onError: (err) => toast.error(parseApiError(err).userMessage),
  });

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold underline">
        Save the story to the archive
      </button>
    );
  }
  return (
    <form
      aria-label="Save the story to the archive"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="space-y-2"
    >
      <label className="block text-sm">
        <span className="font-medium">Story title *</span>
        <input required minLength={3} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Told by (as they wish to be credited)</span>
        <input value={form.storyteller} onChange={(e) => setForm({ ...form, storyteller: e.target.value })} className={inputClass} />
      </label>
      <label className="block text-sm">
        <span className="font-medium">The story *</span>
        <textarea required minLength={20} rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className={inputClass} />
      </label>
      <button type="submit" disabled={save.isPending} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
        Save as Draft
      </button>
    </form>
  );
};

export default StorytellingView;
