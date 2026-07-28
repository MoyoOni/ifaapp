import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HandHeart, Check } from 'lucide-react';
import { FeatureHeader } from '@/shared/components/feature-header';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { useToast } from '@/shared/components/toast';
import { isDevModeActive } from '@/shared/utils/dev-mode';

// COMMUNITY_BACKLOG.md FOR-018: Community Healing & Reconciliation
const CATEGORIES = [
  { value: 'INTERPERSONAL_CONFLICT', label: 'Conflict with another member' },
  { value: 'SPIRITUAL_HARM_CONCERN', label: 'Spiritual harm concern' },
  { value: 'COMMUNITY_TENSION', label: 'Community tension' },
  { value: 'OTHER', label: 'Other' },
];

interface HealingCase {
  id: string;
  category: string;
  description: string;
  status: string;
  createdAt: string;
  resolutionNotes?: string;
  assignedElder?: { id: string; name: string; yorubaName?: string };
}

interface QueueCase extends HealingCase {
  reporter: { id: string; name: string; yorubaName?: string };
  respondent?: { id: string; name: string; yorubaName?: string };
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-highlight/10 text-highlight',
  IN_MEDIATION: 'bg-blue-500/10 text-blue-600',
  RESOLVED: 'bg-green-500/10 text-green-600',
  CLOSED: 'bg-muted text-muted-foreground',
};

const HealingView: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [description, setDescription] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [resolutionDrafts, setResolutionDrafts] = useState<Record<string, string>>({});

  const isElder = user?.role === 'BABALAWO' || user?.role === 'ADMIN';

  const { data: myCases = [] } = useQuery<HealingCase[]>({
    queryKey: ['healing-cases-mine'],
    queryFn: async () => (await api.get('/healing/cases/mine')).data,
    enabled: !isDevModeActive(),
  });

  const { data: queue = [] } = useQuery<QueueCase[]>({
    queryKey: ['healing-cases-queue'],
    queryFn: async () => (await api.get('/healing/cases/queue')).data,
    enabled: isElder && !isDevModeActive(),
  });

  const report = useMutation({
    mutationFn: async () =>
      api.post('/healing/cases', { category, description, respondentEmail: respondentEmail || undefined }),
    onSuccess: () => {
      success('Your case has been shared with our elders — someone will reach out.');
      queryClient.invalidateQueries({ queryKey: ['healing-cases-mine'] });
      setDescription('');
      setRespondentEmail('');
      setShowForm(false);
    },
    onError: () => error('Could not submit your case — please try again'),
  });

  const assign = useMutation({
    mutationFn: async (id: string) => api.patch(`/healing/cases/${id}/assign`),
    onSuccess: () => {
      success("You've taken this case — reach out to those involved");
      queryClient.invalidateQueries({ queryKey: ['healing-cases-queue'] });
    },
    onError: () => error('Could not claim this case — it may already be taken'),
  });

  const resolve = useMutation({
    mutationFn: async (id: string) =>
      api.patch(`/healing/cases/${id}/resolve`, { resolutionNotes: resolutionDrafts[id] }),
    onSuccess: () => {
      success('Case marked as resolved');
      queryClient.invalidateQueries({ queryKey: ['healing-cases-queue'] });
    },
    onError: () => error('Could not resolve this case'),
  });

  return (
    <div className="py-6 animate-in fade-in duration-500 max-w-3xl mx-auto space-y-8">
      <FeatureHeader
        feature="community"
        title="Healing & Reconciliation"
        subtitle="Healing is a practice, not a one-time event. Bring a conflict or concern to our elders for restorative mediation."
        icon={HandHeart}
      />

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-sm text-amber-800 dark:text-amber-300">
        This space is private — visible only to you, anyone you name, and the elder who takes your case. For urgent
        safety concerns, contact <strong>hello@iluase.com</strong> or your local emergency services.
      </div>

      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">Bring a Concern</h2>
        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors"
          >
            <HandHeart size={16} /> Bring a Concern to an Elder
          </button>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Concern category"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Share what happened, in your own words..."
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
            />
            <input
              type="email"
              value={respondentEmail}
              onChange={(e) => setRespondentEmail(e.target.value)}
              placeholder="Other person's email (optional)"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => report.mutate()}
                disabled={!description.trim() || report.isPending}
                className="px-4 py-2 bg-highlight text-foreground rounded-lg font-bold text-sm hover:bg-secondary transition-colors disabled:opacity-50"
              >
                {report.isPending ? 'Sending…' : 'Share With Our Elders'}
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

        {myCases.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Your Cases</p>
            {myCases.map((c) => (
              <div key={c.id} className="bg-muted/40 rounded-xl p-3 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[c.status] || STATUS_STYLES.CLOSED}`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </div>
                {c.assignedElder && (
                  <p className="text-xs text-muted-foreground">
                    With {c.assignedElder.yorubaName || c.assignedElder.name}
                  </p>
                )}
                {c.resolutionNotes && (
                  <p className="text-xs text-foreground bg-card rounded-lg p-2 mt-1">{c.resolutionNotes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isElder && (
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">Healing Case Queue</h2>
          {queue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open cases right now.</p>
          ) : (
            <div className="space-y-3">
              {queue.map((c) => (
                <div key={c.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">
                      {c.reporter.yorubaName || c.reporter.name}
                      {c.respondent && (
                        <span className="text-muted-foreground"> &amp; {c.respondent.yorubaName || c.respondent.name}</span>
                      )}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[c.status]}`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{c.category.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-muted-foreground mb-3">{c.description}</p>
                  {c.status === 'OPEN' && (
                    <button
                      type="button"
                      onClick={() => assign.mutate(c.id)}
                      disabled={assign.isPending}
                      className="px-3 py-1.5 bg-highlight text-foreground rounded-lg text-xs font-bold hover:bg-secondary transition-colors disabled:opacity-50"
                    >
                      Take This Case
                    </button>
                  )}
                  {c.status === 'IN_MEDIATION' && c.assignedElder?.id === user?.id && (
                    <div className="space-y-2">
                      <textarea
                        value={resolutionDrafts[c.id] || ''}
                        onChange={(e) => setResolutionDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        placeholder="Resolution notes..."
                        rows={2}
                        className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-xs resize-none"
                      />
                      <button
                        type="button"
                        onClick={() => resolve.mutate(c.id)}
                        disabled={!resolutionDrafts[c.id]?.trim() || resolve.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        <Check size={12} /> Mark Resolved
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HealingView;
