import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, X } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';
import { isDevModeActive } from '@/shared/utils/dev-mode';

// COMMUNITY_BACKLOG.md FOR-013: "community-generated-ritual approval"
// (platform owner decision, July 29, 2026). Freeform proposal, reviewed by
// an admin -- approval doesn't auto-create a calendar event, same
// judgment-in-the-loop precedent as circle suggestions.
interface RitualProposal {
  id: string;
  title: string;
  description: string;
  suggestedDate?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-highlight/10 text-highlight',
  APPROVED: 'bg-green-500/10 text-green-600',
  REJECTED: 'bg-muted text-muted-foreground',
};

const ProposeRitualPanel: React.FC = () => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [suggestedDate, setSuggestedDate] = useState('');

  const { data: mine = [] } = useQuery<RitualProposal[]>({
    queryKey: ['ritual-proposals-mine'],
    queryFn: async () => (await api.get('/cultural/ritual-proposals/mine')).data,
    enabled: !isDevModeActive(),
  });

  const propose = useMutation({
    mutationFn: async () =>
      api.post('/cultural/ritual-proposals', {
        title,
        description,
        suggestedDate: suggestedDate || undefined,
      }),
    onSuccess: () => {
      success('Thank you — an elder will review your proposal');
      queryClient.invalidateQueries({ queryKey: ['ritual-proposals-mine'] });
      setTitle('');
      setDescription('');
      setSuggestedDate('');
      setShowForm(false);
    },
    onError: () => error('Could not submit your proposal — please try again'),
  });

  return (
    <div className="mb-6">
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm font-bold text-highlight hover:text-secondary transition-colors"
        >
          <Sparkles size={14} /> Propose a Ritual for the Community Calendar
        </button>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground text-sm">Propose a Ritual</h3>
            <button type="button" onClick={() => setShowForm(false)} aria-label="Close">
              <X size={16} className="text-muted-foreground" />
            </button>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ritual name"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this ritual, and why should the community observe it together?"
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
          />
          <label className="text-xs text-muted-foreground">
            Suggested date (optional)
            <input
              type="date"
              value={suggestedDate}
              onChange={(e) => setSuggestedDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => propose.mutate()}
            disabled={!title.trim() || !description.trim() || propose.isPending}
            className="px-4 py-2 bg-highlight text-foreground rounded-lg font-bold text-sm hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {propose.isPending ? 'Sending…' : 'Submit Proposal'}
          </button>
        </div>
      )}

      {mine.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {mine.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-xs bg-muted/40 rounded-lg px-3 py-1.5">
              <span className="text-foreground font-medium">{p.title}</span>
              <span className={`px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status]}`}>{p.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProposeRitualPanel;
