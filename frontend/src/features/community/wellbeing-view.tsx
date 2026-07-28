import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HeartHandshake, Check, Sparkles } from 'lucide-react';
import { FeatureHeader } from '@/shared/components/feature-header';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { useToast } from '@/shared/components/toast';
import { isDevModeActive } from '@/shared/utils/dev-mode';

// COMMUNITY_BACKLOG.md FOR-017: consent-based wellbeing check-ins
interface CheckIn {
  id: string;
  message?: string;
  status: string;
  createdAt: string;
  claimedBy?: { id: string; name: string };
}

interface QueueCheckIn extends CheckIn {
  requester: { id: string; name: string; yorubaName?: string; email: string };
}

const WellbeingView: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => (await api.get(`/users/${user!.id}`)).data,
    enabled: !!user?.id && !isDevModeActive(),
  });
  const isCarer = profile?.isCommunityCarer || profile?.role === 'ADMIN';

  const { data: myCheckIns = [] } = useQuery<CheckIn[]>({
    queryKey: ['my-checkins'],
    queryFn: async () => (await api.get('/wellbeing/check-ins/mine')).data,
    enabled: !isDevModeActive(),
  });

  const { data: queue = [] } = useQuery<QueueCheckIn[]>({
    queryKey: ['wellbeing-queue'],
    queryFn: async () => (await api.get('/wellbeing/check-ins')).data,
    enabled: isCarer && !isDevModeActive(),
  });

  const requestCheckIn = useMutation({
    mutationFn: async () => api.post('/wellbeing/check-in', { message: message || undefined }),
    onSuccess: () => {
      success("Your check-in request has been sent — a community carer will reach out.");
      queryClient.invalidateQueries({ queryKey: ['my-checkins'] });
      setMessage('');
      setShowForm(false);
    },
    onError: () => error('Could not send your request — please try again'),
  });

  const claim = useMutation({
    mutationFn: async (id: string) => api.patch(`/wellbeing/check-ins/${id}/claim`),
    onSuccess: () => {
      success('Claimed — reach out to them directly');
      queryClient.invalidateQueries({ queryKey: ['wellbeing-queue'] });
    },
    onError: () => error('Could not claim this request'),
  });

  const resolve = useMutation({
    mutationFn: async (id: string) => api.patch(`/wellbeing/check-ins/${id}/resolve`),
    onSuccess: () => {
      success('Marked as resolved');
      queryClient.invalidateQueries({ queryKey: ['wellbeing-queue'] });
    },
    onError: () => error('Could not resolve this request'),
  });

  return (
    <div className="py-6 animate-in fade-in duration-500 max-w-3xl mx-auto space-y-8">
      <FeatureHeader
        feature="community"
        title="Wellbeing Care"
        subtitle="Proactive care through invitation, not surveillance. Request a check-in whenever you need one."
        icon={HeartHandshake}
      />

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-sm text-amber-800 dark:text-amber-300">
        <strong>If you're in crisis or immediate danger</strong>, please contact your local emergency services or a
        crisis hotline. For non-emergency support, reach out to <strong>hello@iluase.com</strong>.
      </div>

      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">Request a Check-In</h2>
        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors"
          >
            <Sparkles size={16} /> I could use a check-in
          </button>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Anything you'd like a carer to know? (optional)"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => requestCheckIn.mutate()}
                disabled={requestCheckIn.isPending}
                className="px-4 py-2 bg-highlight text-foreground rounded-lg font-bold text-sm hover:bg-secondary transition-colors disabled:opacity-50"
              >
                {requestCheckIn.isPending ? 'Sending…' : 'Send Request'}
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

        {myCheckIns.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Your Requests</p>
            {myCheckIns.map((c) => (
              <div key={c.id} className="bg-muted/40 rounded-xl p-3 text-sm flex items-center justify-between">
                <span className="text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    c.status === 'RESOLVED'
                      ? 'bg-green-500/10 text-green-600'
                      : c.status === 'CLAIMED'
                        ? 'bg-blue-500/10 text-blue-600'
                        : 'bg-highlight/10 text-highlight'
                  }`}
                >
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {isCarer && (
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">Care Queue</h2>
          {queue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open requests right now.</p>
          ) : (
            <div className="space-y-3">
              {queue.map((c) => (
                <div key={c.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">
                      {c.requester.yorubaName || c.requester.name}
                      <span className="text-xs text-muted-foreground ml-2">{c.requester.email}</span>
                    </p>
                    <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  {c.message && <p className="text-sm text-muted-foreground mb-3">"{c.message}"</p>}
                  <div className="flex gap-2">
                    {c.status === 'OPEN' && (
                      <button
                        type="button"
                        onClick={() => claim.mutate(c.id)}
                        disabled={claim.isPending}
                        className="px-3 py-1.5 bg-highlight text-foreground rounded-lg text-xs font-bold hover:bg-secondary transition-colors disabled:opacity-50"
                      >
                        Claim
                      </button>
                    )}
                    {c.status === 'CLAIMED' && (
                      <button
                        type="button"
                        onClick={() => resolve.mutate(c.id)}
                        disabled={resolve.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        <Check size={12} /> Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WellbeingView;
