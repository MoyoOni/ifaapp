import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Moon, Plus, Sparkles } from 'lucide-react';
import { FeatureHeader } from '@/shared/components/feature-header';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { useToast } from '@/shared/components/toast';
import { isDevModeActive } from '@/shared/utils/dev-mode';

// COMMUNITY_BACKLOG.md FOR-021: Dream Sharing & Interpretation
interface DreamEntry {
  id: string;
  content: string;
  isPublic: boolean;
  interpretationRequested: boolean;
  interpretation?: string;
  createdAt: string;
  author?: { id: string; name: string; yorubaName?: string };
  interpretedBy?: { id: string; name: string; yorubaName?: string };
}

const DreamJournalView: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'mine' | 'shared' | 'requests'>('mine');
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [interpretationRequested, setInterpretationRequested] = useState(false);
  const [interpretationDrafts, setInterpretationDrafts] = useState<Record<string, string>>({});

  const isBabalawo = user?.role === 'BABALAWO' || user?.role === 'ADMIN';

  const { data: myDreams = [] } = useQuery<DreamEntry[]>({
    queryKey: ['dreams-mine'],
    queryFn: async () => (await api.get('/dreams/mine')).data,
    enabled: tab === 'mine' && !isDevModeActive(),
  });

  const { data: sharedData } = useQuery<{ entries: DreamEntry[] }>({
    queryKey: ['dreams-shared'],
    queryFn: async () => (await api.get('/dreams/shared?limit=50')).data,
    enabled: tab === 'shared' && !isDevModeActive(),
  });

  const { data: requests = [] } = useQuery<DreamEntry[]>({
    queryKey: ['dreams-requests'],
    queryFn: async () => (await api.get('/dreams/interpretation-requests')).data,
    enabled: tab === 'requests' && isBabalawo && !isDevModeActive(),
  });

  const createDream = useMutation({
    mutationFn: async () => api.post('/dreams', { content, isPublic, interpretationRequested }),
    onSuccess: () => {
      success('Dream added to your journal');
      queryClient.invalidateQueries({ queryKey: ['dreams-mine'] });
      setContent('');
      setIsPublic(false);
      setInterpretationRequested(false);
      setShowForm(false);
    },
    onError: () => error('Could not save your dream — please try again'),
  });

  const interpret = useMutation({
    mutationFn: async (id: string) =>
      api.post(`/dreams/${id}/interpret`, { interpretation: interpretationDrafts[id] }),
    onSuccess: () => {
      success('Interpretation shared');
      queryClient.invalidateQueries({ queryKey: ['dreams-requests'] });
    },
    onError: () => error('Could not share your interpretation'),
  });

  return (
    <div className="py-6 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <FeatureHeader
        feature="community"
        title="Dream Journal"
        subtitle="Dreaming is sacred in Yoruba tradition. Record, share, and — when you wish — invite a Babalawo's interpretation."
        icon={Moon}
      />

      <div className="mb-6 flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
        <button type="button" onClick={() => setTab('mine')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'mine' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          My Journal
        </button>
        <button type="button" onClick={() => setTab('shared')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'shared' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          Shared Dreams
        </button>
        {isBabalawo && (
          <button type="button" onClick={() => setTab('requests')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'requests' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            Interpretation Requests
          </button>
        )}
      </div>

      {tab === 'mine' && (
        <>
          <div className="mb-6">
            {!showForm ? (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors"
              >
                <Plus size={16} /> Record a Dream
              </button>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe your dream..."
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
                />
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                  Share on the community dream-pattern feed
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={interpretationRequested}
                    onChange={(e) => setInterpretationRequested(e.target.checked)}
                  />
                  Request a Babalawo's interpretation
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => createDream.mutate()}
                    disabled={!content.trim() || createDream.isPending}
                    className="px-4 py-2 bg-highlight text-foreground rounded-lg font-bold text-sm hover:bg-secondary transition-colors disabled:opacity-50"
                  >
                    {createDream.isPending ? 'Saving…' : 'Save Dream'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-muted-foreground text-sm hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {myDreams.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your journal is empty. Dreams you record stay private unless you choose to share them.</p>
          ) : (
            <div className="space-y-3">
              {myDreams.map((d) => (
                <div key={d.id} className="bg-card border border-border rounded-2xl p-5">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{d.content}</p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</span>
                    {d.isPublic && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">Shared</span>}
                    {d.interpretationRequested && !d.interpretation && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-highlight/10 text-highlight">Awaiting Interpretation</span>
                    )}
                  </div>
                  {d.interpretation && (
                    <div className="mt-3 bg-muted/40 rounded-xl p-3">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                        Interpretation by {d.interpretedBy?.yorubaName || d.interpretedBy?.name}
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{d.interpretation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'shared' && (
        <div className="space-y-3">
          {!sharedData || sharedData.entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No shared dreams yet.</p>
          ) : (
            sharedData.entries.map((d) => (
              <div key={d.id} className="bg-card border border-border rounded-2xl p-5">
                <p className="text-sm font-semibold text-foreground mb-1">{d.author?.yorubaName || d.author?.name}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{d.content}</p>
                <p className="text-xs text-muted-foreground/70 mt-2">{new Date(d.createdAt).toLocaleDateString()}</p>
                {d.interpretation && (
                  <div className="mt-3 bg-muted/40 rounded-xl p-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                      Interpretation by {d.interpretedBy?.yorubaName || d.interpretedBy?.name}
                    </p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{d.interpretation}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'requests' && isBabalawo && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open interpretation requests.</p>
          ) : (
            requests.map((d) => (
              <div key={d.id} className="bg-card border border-border rounded-2xl p-5">
                <p className="text-sm font-semibold text-foreground mb-1">{d.author?.yorubaName || d.author?.name}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3">{d.content}</p>
                <textarea
                  value={interpretationDrafts[d.id] || ''}
                  onChange={(e) => setInterpretationDrafts((prev) => ({ ...prev, [d.id]: e.target.value }))}
                  placeholder="Share your interpretation..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none mb-2"
                />
                <button
                  type="button"
                  onClick={() => interpret.mutate(d.id)}
                  disabled={!interpretationDrafts[d.id]?.trim() || interpret.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-highlight text-foreground rounded-lg text-xs font-bold hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  <Sparkles size={12} /> Share Interpretation
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DreamJournalView;
