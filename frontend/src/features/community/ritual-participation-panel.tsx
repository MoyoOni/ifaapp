import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Check, X } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';
import { isDevModeActive } from '@/shared/utils/dev-mode';

// COMMUNITY_BACKLOG.md FOR-013: RSVP + optional public/private intention
// for a SacredCalendarEvent, hung off the existing calendar model.
interface ParticipationResponse {
  count: number;
  publicIntentions: Array<{
    intention: string;
    createdAt: string;
    user: { id: string; name: string; yorubaName?: string };
  }>;
  myParticipation: { intention?: string; isPublic: boolean } | null;
}

interface RitualParticipationPanelProps {
  eventId: string;
}

const RitualParticipationPanel: React.FC<RitualParticipationPanelProps> = ({ eventId }) => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [intention, setIntention] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const queryKey = ['ritual-participation', eventId];

  const { data } = useQuery<ParticipationResponse>({
    queryKey,
    queryFn: async () => (await api.get(`/cultural/sacred-events/${eventId}/participation`)).data,
    enabled: !isDevModeActive(),
  });

  const rsvp = useMutation({
    mutationFn: async () =>
      api.post(`/cultural/sacred-events/${eventId}/rsvp`, { intention: intention || undefined, isPublic }),
    onSuccess: () => {
      success("You're marked as participating");
      queryClient.invalidateQueries({ queryKey });
      setShowForm(false);
    },
    onError: () => error('Could not RSVP — please try again'),
  });

  const cancel = useMutation({
    mutationFn: async () => api.delete(`/cultural/sacred-events/${eventId}/rsvp`),
    onSuccess: () => {
      success('RSVP cancelled');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => error('Could not cancel RSVP'),
  });

  const isParticipating = !!data?.myParticipation;

  return (
    <div className="mt-3 pt-3 border-t border-highlight/20">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <p className="text-xs text-muted-foreground">
          {data?.count ?? 0} {data?.count === 1 ? 'person' : 'people'} joining this ritual
        </p>
        {isParticipating ? (
          <button
            type="button"
            onClick={() => cancel.mutate()}
            disabled={cancel.isPending}
            className="flex items-center gap-1 text-xs font-bold text-primary"
          >
            <Check size={14} /> You're participating &middot; <span className="underline">Cancel</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-highlight text-foreground rounded-lg text-xs font-bold hover:bg-secondary transition-colors"
          >
            <Sparkles size={14} /> I'm Participating
          </button>
        )}
      </div>

      {showForm && !isParticipating && (
        <div className="bg-card border border-border rounded-xl p-3 space-y-2 mb-2">
          <textarea
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="Share a prayer or offering intention (optional)"
            rows={2}
            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-xs resize-none"
          />
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
            Share this intention publicly with the community
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => rsvp.mutate()}
              disabled={rsvp.isPending}
              className="px-3 py-1.5 bg-highlight text-foreground rounded-lg text-xs font-bold hover:bg-secondary transition-colors disabled:opacity-50"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-muted-foreground text-xs hover:text-foreground"
            >
              <X size={12} className="inline" /> Cancel
            </button>
          </div>
        </div>
      )}

      {data && data.publicIntentions.length > 0 && (
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {data.publicIntentions.map((entry, idx) => (
            <p key={idx} className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-2 py-1.5">
              <span className="font-semibold text-foreground">{entry.user.yorubaName || entry.user.name}:</span>{' '}
              {entry.intention}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default RitualParticipationPanel;
