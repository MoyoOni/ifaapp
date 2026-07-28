import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flower2, Plus } from 'lucide-react';
import { FeatureHeader } from '@/shared/components/feature-header';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { useToast } from '@/shared/components/toast';
import { isDevModeActive } from '@/shared/utils/dev-mode';

// COMMUNITY_BACKLOG.md FOR-015: Ancestral Remembrance Wall
interface MemorialEntry {
  id: string;
  name: string;
  relationship?: string;
  message: string;
  createdAt: string;
  author: { id: string; name: string; yorubaName?: string };
}

const RemembranceWallView: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [message, setMessage] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const { data, isLoading } = useQuery<{ entries: MemorialEntry[]; total: number }>({
    queryKey: ['remembrance-wall'],
    queryFn: async () => (await api.get('/memorials?limit=50')).data,
    enabled: !isDevModeActive(),
  });

  const createEntry = useMutation({
    mutationFn: async () => api.post('/memorials', { name, relationship: relationship || undefined, message, isPublic }),
    onSuccess: () => {
      success('Your remembrance has been added');
      queryClient.invalidateQueries({ queryKey: ['remembrance-wall'] });
      setShowForm(false);
      setName('');
      setRelationship('');
      setMessage('');
    },
    onError: () => error('Could not add your remembrance — please try again'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && message.trim()) {
      createEntry.mutate();
    }
  };

  return (
    <div className="py-6 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <FeatureHeader
        feature="community"
        title="Ancestral Remembrance Wall"
        subtitle="A shared space to honor those who came before us. Light a candle, share a name, offer a memory."
        icon={Flower2}
      />

      {isAuthenticated && (
        <div className="mb-6">
          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors"
            >
              <Plus size={16} /> Add a Remembrance
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name of the person you're remembering"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              />
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="Relationship (optional — e.g. Grandmother, Mentor)"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share a memory, prayer, or what they meant to you"
                required
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
              />
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                Share on the public wall (uncheck to keep this remembrance private)
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createEntry.isPending}
                  className="px-4 py-2 bg-highlight text-foreground rounded-lg font-bold text-sm hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  {createEntry.isPending ? 'Adding…' : 'Add Remembrance'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-muted-foreground text-sm hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading the wall...</p>
      ) : !data || data.entries.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-2xl border border-border">
          <Flower2 size={48} className="mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">The wall is quiet for now</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Be the first to light a candle and share a remembrance.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.entries.map((entry) => (
            <div key={entry.id} className="bg-card border border-border rounded-2xl p-5">
              <p className="font-bold text-foreground">{entry.name}</p>
              {entry.relationship && <p className="text-xs text-muted-foreground mb-2">{entry.relationship}</p>}
              <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">{entry.message}</p>
              <p className="text-xs text-muted-foreground/70 mt-3">
                Shared by {entry.author.yorubaName || entry.author.name} &middot;{' '}
                {new Date(entry.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RemembranceWallView;
