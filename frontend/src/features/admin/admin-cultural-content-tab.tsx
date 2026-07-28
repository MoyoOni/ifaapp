import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Mic, Calendar, Plus, Trash2, Edit3, RefreshCw,
  Loader2, CheckCircle, Eye, EyeOff, X, Save,
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/components/toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyWord {
  id: string;
  word: string;
  pronunciation: string;
  definition: string;
  example: string;
  culturalContext: string;
  category: string;
  date: string;
  viewCount: number;
}

interface OralHistory {
  id: string;
  title: string;
  category: string;
  babalawoName?: string;
  recordingDate?: string;
  tags: string[];
  content: string;
  sourceUrl?: string;
  relatedProductIds: string[];
  publishedAt?: string;
  createdAt: string;
  creator?: { id: string; name: string };
}

interface SacredEvent {
  id: string;
  title: string;
  yorubaName?: string;
  description: string;
  date: string;
  endDate?: string;
  type: string;
  bannerColor?: string;
  isActive: boolean;
  createdAt: string;
}

type ContentView = 'daily-words' | 'oral-history' | 'sacred-calendar';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const EVENT_TYPES = ['FESTIVAL', 'CEREMONY', 'OBSERVANCE', 'ANNIVERSARY'];

const BANNER_COLORS = [
  { label: 'Gold', value: '#B45309' },
  { label: 'Green', value: '#15803D' },
  { label: 'Blue', value: '#1D4ED8' },
  { label: 'Purple', value: '#7E22CE' },
  { label: 'Red', value: '#B91C1C' },
];

const ORAL_HISTORY_CATEGORIES = ['Divination', 'Ceremony', 'Proverbs', 'History', 'Elder Teaching', 'Myth & Legend', 'Ritual'];
const WORD_CATEGORIES = ['Spiritual', 'Ethics', 'Knowledge', 'Ritual', 'Role', 'Place', 'Relationship'];

// ─── Blank form helpers ───────────────────────────────────────────────────────

const blankWord = () => ({
  word: '', pronunciation: '', definition: '', example: '',
  culturalContext: '', category: 'Spiritual', date: '',
});

const blankOral = () => ({
  title: '', category: 'Elder Teaching', babalawoName: '', recordingDate: '',
  tags: '', content: '', sourceUrl: '', relatedProductIds: '', publish: false,
});

const blankEvent = () => ({
  title: '', yorubaName: '', description: '',
  date: '', endDate: '', type: 'FESTIVAL', bannerColor: '#B45309',
});

// ─── Section header ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{
  icon: React.ElementType; title: string; description: string;
  onAdd: () => void; addLabel: string;
}> = ({ icon: Icon, title, description, onAdd, addLabel }) => (
  <div className="flex items-start justify-between gap-4">
    <div>
      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
        <Icon size={16} className="text-muted-foreground" />
        {title}
      </h3>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
    <Button size="sm" onClick={onAdd} className="bg-highlight hover:bg-highlight/90 text-white shrink-0">
      <Plus size={14} className="mr-1.5" />
      {addLabel}
    </Button>
  </div>
);

// ─── Modal shell ──────────────────────────────────────────────────────────────

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X size={18} />
        </button>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-xs text-muted-foreground font-medium block mb-1">{label}</label>
    {children}
  </div>
);

// ─── Daily Words Section ──────────────────────────────────────────────────────

const DailyWordsSection: React.FC = () => {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(blankWord());

  const { data: words = [], isLoading, refetch } = useQuery<DailyWord[]>({
    queryKey: ['admin', 'cultural', 'daily-words'],
    queryFn: () => api.get('/admin/cultural/daily-words').then(r => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: () => editId
      ? api.patch(`/admin/cultural/daily-words/${editId}`, form)
      : api.post('/admin/cultural/daily-words', form),
    onSuccess: () => {
      success(editId ? 'Word updated' : 'Word scheduled');
      qc.invalidateQueries({ queryKey: ['admin', 'cultural', 'daily-words'] });
      setShowForm(false);
      setEditId(null);
      setForm(blankWord());
    },
    onError: (err: any) => toastError(err?.response?.data?.message ?? 'Save failed'),
  });

  const { mutate: del } = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/cultural/daily-words/${id}`),
    onSuccess: () => { success('Word deleted'); qc.invalidateQueries({ queryKey: ['admin', 'cultural', 'daily-words'] }); },
    // A word already shown to users is rejected, not deleted (see
    // admin-cultural-content.service.ts), to preserve their word-history list.
    onError: (err: any) => toastError(err?.response?.data?.message ?? 'Delete failed'),
  });

  const openEdit = (w: DailyWord) => {
    setForm({ word: w.word, pronunciation: w.pronunciation, definition: w.definition, example: w.example, culturalContext: w.culturalContext, category: w.category, date: w.date.slice(0, 10) });
    setEditId(w.id);
    setShowForm(true);
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={BookOpen}
        title="Daily Yoruba Word Queue"
        description="Schedule words for specific dates — 30-day queue shown below"
        onAdd={() => { setShowForm(true); setEditId(null); setForm(blankWord()); }}
        addLabel="Schedule Word"
      />

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
      ) : words.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <BookOpen size={28} className="mx-auto mb-2 opacity-20" />
          <p className="text-muted-foreground text-sm">No words scheduled for the next 30 days.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {words.map(w => (
            <div key={w.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">{w.word}</span>
                  <span className="text-xs text-muted-foreground italic">{w.pronunciation}</span>
                  <Badge variant="secondary" className="text-xs">{w.category}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{w.definition}</p>
                <p className="text-xs text-muted-foreground">{fmtDate(w.date)} · {w.viewCount} views</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => openEdit(w)}><Edit3 size={14} /></Button>
                <Button size="sm" variant="ghost" onClick={() => del(w.id)} className="text-destructive hover:text-destructive"><Trash2 size={14} /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw size={13} className="mr-1.5" />Refresh</Button>

      {showForm && (
        <Modal title={editId ? 'Edit Word' : 'Schedule Yoruba Word'} onClose={() => setShowForm(false)}>
          <Field label="Date"><Input type="date" value={form.date} onChange={set('date')} className="text-sm" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Yoruba Word"><Input value={form.word} onChange={set('word')} placeholder="e.g. Àṣẹ" className="text-sm" /></Field>
            <Field label="Pronunciation"><Input value={form.pronunciation} onChange={set('pronunciation')} placeholder="e.g. Ah-sheh" className="text-sm" /></Field>
          </div>
          <Field label="Definition">
            <textarea value={form.definition} onChange={set('definition')} placeholder="Clear English meaning…" rows={2} className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none" />
          </Field>
          <Field label="Example sentence">
            <Input value={form.example} onChange={set('example')} placeholder="Use in a sentence…" className="text-sm" />
          </Field>
          <Field label="Cultural context">
            <textarea value={form.culturalContext} onChange={set('culturalContext')} placeholder="Why this word matters culturally…" rows={2} className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none" />
          </Field>
          <Field label="Category">
            <select value={form.category} onChange={set('category')} className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary">
              {WORD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <div className="flex gap-2 pt-2">
            <Button onClick={() => save()} disabled={saving || !form.word || !form.date} className="flex-1 bg-highlight hover:bg-highlight/90 text-white">
              {saving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
              {editId ? 'Update' : 'Schedule'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── Oral History Section ─────────────────────────────────────────────────────

const OralHistorySection: React.FC = () => {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(blankOral());

  const { data: entries = [], isLoading } = useQuery<OralHistory[]>({
    queryKey: ['admin', 'cultural', 'oral-histories'],
    queryFn: () => api.get('/admin/cultural/oral-histories').then(r => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        relatedProductIds: form.relatedProductIds.split(',').map(t => t.trim()).filter(Boolean),
      };
      return editId
        ? api.patch(`/admin/cultural/oral-histories/${editId}`, payload)
        : api.post('/admin/cultural/oral-histories', payload);
    },
    onSuccess: () => {
      success(editId ? 'Entry updated' : 'Entry saved');
      qc.invalidateQueries({ queryKey: ['admin', 'cultural', 'oral-histories'] });
      setShowForm(false); setEditId(null); setForm(blankOral());
    },
    onError: (err: any) => toastError(err?.response?.data?.message ?? 'Save failed'),
  });

  const { mutate: toggle } = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      api.patch(`/admin/cultural/oral-histories/${id}`, { publish: !published }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'cultural', 'oral-histories'] }),
    onError: () => toastError('Toggle failed'),
  });

  const { mutate: del } = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/cultural/oral-histories/${id}`),
    onSuccess: () => { success('Entry deleted'); qc.invalidateQueries({ queryKey: ['admin', 'cultural', 'oral-histories'] }); },
    onError: () => toastError('Delete failed'),
  });

  const openEdit = (e: OralHistory) => {
    setForm({ title: e.title, category: e.category, babalawoName: e.babalawoName ?? '', recordingDate: e.recordingDate?.slice(0, 10) ?? '', tags: e.tags.join(', '), content: e.content, sourceUrl: e.sourceUrl ?? '', relatedProductIds: (e.relatedProductIds ?? []).join(', '), publish: !!e.publishedAt });
    setEditId(e.id); setShowForm(true);
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Mic}
        title="Oral History Archive"
        description="Transcriptions and recordings of elder teachings, preserved for the community"
        onAdd={() => { setShowForm(true); setEditId(null); setForm(blankOral()); }}
        addLabel="Add Entry"
      />

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
      ) : entries.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Mic size={28} className="mx-auto mb-2 opacity-20" />
          <p className="text-muted-foreground text-sm">No oral history entries yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map(e => (
            <div key={e.id} className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-foreground">{e.title}</span>
                  <Badge variant="secondary" className="text-xs">{e.category}</Badge>
                  {e.publishedAt
                    ? <Badge variant="outline" className="text-xs text-green-600">Published</Badge>
                    : <Badge variant="secondary" className="text-xs text-muted-foreground">Draft</Badge>}
                </div>
                {e.babalawoName && <p className="text-xs text-muted-foreground mt-0.5">By {e.babalawoName}</p>}
                {e.tags.length > 0 && <p className="text-xs text-muted-foreground mt-0.5">{e.tags.join(' · ')}</p>}
                {e.relatedProductIds?.length > 0 && <p className="text-xs text-muted-foreground mt-0.5">Linked to {e.relatedProductIds.length} product{e.relatedProductIds.length === 1 ? '' : 's'}</p>}
                <p className="text-xs text-muted-foreground mt-0.5">Added {fmtDate(e.createdAt)}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" title={e.publishedAt ? 'Unpublish' : 'Publish'} onClick={() => toggle({ id: e.id, published: !!e.publishedAt })}>
                  {e.publishedAt ? <EyeOff size={14} /> : <Eye size={14} />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openEdit(e)}><Edit3 size={14} /></Button>
                <Button size="sm" variant="ghost" onClick={() => del(e.id)} className="text-destructive hover:text-destructive"><Trash2 size={14} /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editId ? 'Edit Oral History Entry' : 'Add Oral History Entry'} onClose={() => setShowForm(false)}>
          <Field label="Title"><Input value={form.title} onChange={set('title')} placeholder="e.g. The Teaching of Ifá and Character" className="text-sm" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select value={form.category} onChange={set('category')} className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary">
                {ORAL_HISTORY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Recording date (optional)"><Input type="date" value={form.recordingDate} onChange={set('recordingDate')} className="text-sm" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Babaláwo name (with consent)"><Input value={form.babalawoName} onChange={set('babalawoName')} placeholder="e.g. Bàbá Adéwálé" className="text-sm" /></Field>
            <Field label="Audio/source URL (optional)"><Input value={form.sourceUrl} onChange={set('sourceUrl')} placeholder="https://…" className="text-sm" /></Field>
          </div>
          <Field label="Tags (comma-separated)"><Input value={form.tags} onChange={set('tags')} placeholder="Ìwà Pẹ̀lẹ́, character, ethics" className="text-sm" /></Field>
          <Field label="Related marketplace product IDs (comma-separated, optional)"><Input value={form.relatedProductIds} onChange={set('relatedProductIds')} placeholder="e.g. product IDs this story relates to" className="text-sm" /></Field>
          <Field label="Transcription / content">
            <textarea value={form.content} onChange={set('content')} placeholder="Full transcription or summary of the teaching…" rows={5} className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none" />
          </Field>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input type="checkbox" checked={form.publish} onChange={e => setForm(f => ({ ...f, publish: e.target.checked }))} />
            Publish immediately
          </label>
          <div className="flex gap-2 pt-2">
            <Button onClick={() => save()} disabled={saving || !form.title || !form.content} className="flex-1 bg-highlight hover:bg-highlight/90 text-white">
              {saving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
              {editId ? 'Update' : 'Save Entry'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── Sacred Calendar Section ──────────────────────────────────────────────────

const SacredCalendarSection: React.FC = () => {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(blankEvent());

  const { data: events = [], isLoading } = useQuery<SacredEvent[]>({
    queryKey: ['admin', 'cultural', 'sacred-events'],
    queryFn: () => api.get('/admin/cultural/sacred-events').then(r => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: () => editId
      ? api.patch(`/admin/cultural/sacred-events/${editId}`, form)
      : api.post('/admin/cultural/sacred-events', form),
    onSuccess: () => {
      success(editId ? 'Event updated' : 'Event created');
      qc.invalidateQueries({ queryKey: ['admin', 'cultural', 'sacred-events'] });
      setShowForm(false); setEditId(null); setForm(blankEvent());
    },
    onError: (err: any) => toastError(err?.response?.data?.message ?? 'Save failed'),
  });

  const { mutate: toggleActive } = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/cultural/sacred-events/${id}`, { isActive: !isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'cultural', 'sacred-events'] }),
    onError: () => toastError('Toggle failed'),
  });

  const { mutate: del } = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/cultural/sacred-events/${id}`).then((r) => r.data),
    onSuccess: (data: { deactivated?: boolean } | undefined) => {
      // An event with RSVPs/vendor feature requests is deactivated, not
      // deleted (see admin-cultural-content.service.ts) -- reflect that
      // instead of always claiming "deleted".
      success(data?.deactivated ? 'Event had RSVPs or vendor requests, so it was deactivated instead' : 'Event deleted');
      qc.invalidateQueries({ queryKey: ['admin', 'cultural', 'sacred-events'] });
    },
    onError: () => toastError('Delete failed'),
  });

  const openEdit = (ev: SacredEvent) => {
    setForm({ title: ev.title, yorubaName: ev.yorubaName ?? '', description: ev.description, date: ev.date.slice(0, 10), endDate: ev.endDate?.slice(0, 10) ?? '', type: ev.type, bannerColor: ev.bannerColor ?? '#B45309' });
    setEditId(ev.id); setShowForm(true);
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const upcoming = events.filter(e => e.isActive && new Date(e.date) >= new Date());
  const past = events.filter(e => !e.isActive || new Date(e.date) < new Date());

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Calendar}
        title="Sacred Content Calendar"
        description="Yoruba festivals and observances — active events surface as banners for all users"
        onAdd={() => { setShowForm(true); setEditId(null); setForm(blankEvent()); }}
        addLabel="Add Event"
      />

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Upcoming & Active</p>
              <div className="space-y-2">
                {upcoming.map(ev => (
                  <div key={ev.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                    <div className="w-3 h-10 rounded-full shrink-0" style={{ backgroundColor: ev.bannerColor ?? '#B45309' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{ev.title}</span>
                        {ev.yorubaName && <span className="text-xs text-muted-foreground italic">{ev.yorubaName}</span>}
                        <Badge variant="secondary" className="text-xs">{ev.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{ev.description}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(ev.date)}{ev.endDate ? ` — ${fmtDate(ev.endDate)}` : ''}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" title="Deactivate" onClick={() => toggleActive({ id: ev.id, isActive: ev.isActive })}><EyeOff size={14} /></Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(ev)}><Edit3 size={14} /></Button>
                      <Button size="sm" variant="ghost" onClick={() => del(ev.id)} className="text-destructive hover:text-destructive"><Trash2 size={14} /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Past / Inactive</p>
              <div className="space-y-2">
                {past.map(ev => (
                  <div key={ev.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 opacity-60">
                    <div className="w-3 h-10 rounded-full shrink-0 bg-muted" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm text-foreground">{ev.title}</span>
                      <p className="text-xs text-muted-foreground">{fmtDate(ev.date)}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" title="Reactivate" onClick={() => toggleActive({ id: ev.id, isActive: ev.isActive })}><Eye size={14} /></Button>
                      <Button size="sm" variant="ghost" onClick={() => del(ev.id)} className="text-destructive hover:text-destructive"><Trash2 size={14} /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {events.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Calendar size={28} className="mx-auto mb-2 opacity-20" />
              <p className="text-muted-foreground text-sm">No sacred events yet. Add Isese Day, Osun Grove Festival, Ifa Day and more.</p>
            </div>
          )}
        </>
      )}

      {showForm && (
        <Modal title={editId ? 'Edit Sacred Event' : 'Add Sacred Event'} onClose={() => setShowForm(false)}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Event title"><Input value={form.title} onChange={set('title')} placeholder="e.g. Isese Day" className="text-sm" /></Field>
            <Field label="Yoruba name (optional)"><Input value={form.yorubaName} onChange={set('yorubaName')} placeholder="e.g. Ọjọ Ìṣẹṣẹ" className="text-sm" /></Field>
          </div>
          <Field label="Description">
            <textarea value={form.description} onChange={set('description')} placeholder="What is this event and why does it matter?" rows={3} className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date"><Input type="date" value={form.date} onChange={set('date')} className="text-sm" /></Field>
            <Field label="End date (optional)"><Input type="date" value={form.endDate} onChange={set('endDate')} className="text-sm" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select value={form.type} onChange={set('type')} className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary">
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Banner colour">
              <select value={form.bannerColor} onChange={set('bannerColor')} className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary">
                {BANNER_COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={() => save()} disabled={saving || !form.title || !form.date} className="flex-1 bg-highlight hover:bg-highlight/90 text-white">
              {saving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
              {editId ? 'Update' : 'Add Event'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── Main Tab ─────────────────────────────────────────────────────────────────

const AdminCulturalContentTab: React.FC = () => {
  const [view, setView] = useState<ContentView>('daily-words');

  const views: { id: ContentView; label: string; icon: React.ElementType }[] = [
    { id: 'daily-words', label: 'Daily Word Queue', icon: BookOpen },
    { id: 'oral-history', label: 'Oral History Archive', icon: Mic },
    { id: 'sacred-calendar', label: 'Sacred Calendar', icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <CheckCircle size={18} className="text-muted-foreground" />
          Cultural Content Calendar
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage the living cultural layer — daily words, oral history, sacred festivals
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {views.map(v => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === v.id
                ? 'bg-highlight text-white'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <v.icon size={14} />
            {v.label}
          </button>
        ))}
      </div>

      {view === 'daily-words' && <DailyWordsSection />}
      {view === 'oral-history' && <OralHistorySection />}
      {view === 'sacred-calendar' && <SacredCalendarSection />}
    </div>
  );
};

export default AdminCulturalContentTab;
