import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Flag, Star, CheckCircle, AlertTriangle, Loader2, ChevronRight, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/shared/components/toast';

type Tab = 'flags' | 'reactions';

const ENDORSEMENT_EMOJIS = [
  { emoji: '✅', label: 'Endorsed — Culturally Accurate' },
  { emoji: '📿', label: 'Sacred Knowledge' },
  { emoji: '🌟', label: 'Elder Wisdom' },
  { emoji: '⚠️', label: 'Needs Correction' },
];

const FLAG_REASONS = [
  'Culturally inaccurate teaching',
  'Misrepresents Odù',
  'Disrespects tradition',
  'Potentially harmful spiritual advice',
  'Other',
];

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  REVIEWED: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  DISMISSED: 'bg-muted text-muted-foreground',
};

const ElderOversightPanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success: showSuccess, error: showError } = useToast();
  const [tab, setTab] = useState<Tab>('flags');
  const [flagReason, setFlagReason] = useState('');
  const [flagPostId, setFlagPostId] = useState<string | null>(null);

  const isBabalawo = user?.role === 'BABALAWO';

  const { data: flags = [], isLoading: flagsLoading } = useQuery({
    queryKey: ['elder-flags', 'my'],
    queryFn: () => api.get('/forum/elder-flags').then(r =>
      (r.data as any[]).filter((f: any) => f.flaggedBy === user?.id)
    ),
    enabled: !!user && isBabalawo,
  });

  const { data: reactions = [], isLoading: reactionsLoading } = useQuery({
    queryKey: ['elder-reactions', 'my'],
    queryFn: () => api.get('/forum/elder-reactions/mine').then(r => r.data).catch(() => []),
    enabled: !!user && isBabalawo,
  });

  const flagMutation = useMutation({
    mutationFn: ({ postId, reason }: { postId: string; reason: string }) =>
      api.post(`/forum/posts/${postId}/elder-flag`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elder-flags'] });
      setFlagPostId(null);
      setFlagReason('');
      showSuccess('Moderators will review your concern.', 'Elder flag raised');
    },
    onError: () => showError('Failed to raise flag'),
  });

  if (!isBabalawo) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-6">
        <Shield size={48} className="text-muted-foreground mb-4" />
        <h3 className="text-xl font-bold text-foreground">Elder Access Required</h3>
        <p className="text-muted-foreground mt-2">This panel is available to verified Babalawos only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/40 rounded-2xl flex items-center justify-center">
          <Shield size={24} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Elder Oversight Panel</h2>
          <p className="text-muted-foreground text-sm">Flag inaccurate teachings and endorse wisdom</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex gap-3">
        <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700 dark:text-amber-300">
          As a verified Babalawo, you can flag posts that misrepresent cultural teachings and endorse posts that demonstrate
          authentic wisdom. Your flags are reviewed by platform moderators.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted p-1 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setTab('flags')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'flags' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Flag size={15} /> My Flags
          {flags.filter((f: any) => f.status === 'PENDING').length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {flags.filter((f: any) => f.status === 'PENDING').length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('reactions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'reactions' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Star size={15} /> My Endorsements
        </button>
      </div>

      {/* Flags tab */}
      {tab === 'flags' && (
        <div className="space-y-4">
          {flagsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-highlight" /></div>
          ) : flags.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <Flag size={36} className="text-muted-foreground mx-auto mb-3" />
              <p className="font-bold text-foreground">No flags raised yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Browse the forum and use the Flag button on any post to raise a cultural accuracy concern.
              </p>
              <button
                type="button"
                onClick={() => navigate('/forum')}
                className="mt-4 px-5 py-2 bg-highlight text-white font-bold rounded-xl hover:bg-yellow-600 transition-colors"
              >
                Go to Forum
              </button>
            </div>
          ) : (
            flags.map((flag: any) => (
              <div key={flag.id} className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground line-clamp-2">
                      "{flag.post?.content?.slice(0, 120)}..."
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      by {flag.post?.author?.name || 'Unknown'} · {flag.createdAt ? formatDistanceToNow(new Date(flag.createdAt), { addSuffix: true }) : ''}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_STYLES[flag.status] || STATUS_STYLES.DISMISSED}`}>
                    {flag.status}
                  </span>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">Your Reason</p>
                  <p className="text-sm text-foreground">{flag.reason}</p>
                </div>
                {flag.status === 'REVIEWED' && flag.reviewedBy && (
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle size={14} /> Reviewed by moderator
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => flag.post?.threadId && navigate(`/forum/${flag.post.threadId}`)}
                  className="flex items-center gap-1.5 text-xs text-highlight font-semibold hover:underline"
                >
                  <Eye size={13} /> View post in thread
                </button>
              </div>
            ))
          )}

          {/* Raise new flag inline form */}
          {flagPostId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 space-y-4">
                <h3 className="font-bold text-foreground">Raise Elder Flag</h3>
                <p className="text-sm text-muted-foreground">Select the reason for this cultural concern:</p>
                <div className="space-y-2">
                  {FLAG_REASONS.map(r => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setFlagReason(r)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all ${flagReason === r ? 'border-highlight bg-highlight/10 text-highlight font-semibold' : 'border-border text-foreground hover:bg-muted'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setFlagPostId(null); setFlagReason(''); }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!flagReason || flagMutation.isPending}
                    onClick={() => flagMutation.mutate({ postId: flagPostId, reason: flagReason })}
                    className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 disabled:opacity-50 transition-colors"
                  >
                    {flagMutation.isPending ? 'Raising...' : 'Raise Flag'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reactions / Endorsements tab */}
      {tab === 'reactions' && (
        <div className="space-y-4">
          {reactionsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-highlight" /></div>
          ) : reactions.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <Star size={36} className="text-muted-foreground mx-auto mb-3" />
              <p className="font-bold text-foreground">No endorsements yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Endorse posts in the forum by clicking the ✦ Elder Reaction button on any post.
              </p>
              <button
                type="button"
                onClick={() => navigate('/forum')}
                className="mt-4 px-5 py-2 bg-highlight text-white font-bold rounded-xl hover:bg-yellow-600 transition-colors"
              >
                Go to Forum
              </button>
            </div>
          ) : (
            reactions.map((reaction: any) => (
              <div key={reaction.id} className="bg-card border border-border rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950/40 rounded-2xl flex items-center justify-center text-xl flex-shrink-0">
                  {reaction.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground line-clamp-2">
                    "{reaction.post?.content?.slice(0, 120)}..."
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    by {reaction.post?.author?.name || 'Unknown'} · {reaction.createdAt ? formatDistanceToNow(new Date(reaction.createdAt), { addSuffix: true }) : ''}
                  </p>
                  <button
                    type="button"
                    onClick={() => reaction.post?.threadId && navigate(`/forum/${reaction.post.threadId}`)}
                    className="flex items-center gap-1.5 text-xs text-highlight font-semibold hover:underline mt-2"
                  >
                    <ChevronRight size={13} /> View in thread
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Endorsement emoji guide */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h4 className="font-bold text-foreground mb-3 text-sm">Endorsement Guide</h4>
            <div className="space-y-2">
              {ENDORSEMENT_EMOJIS.map(e => (
                <div key={e.emoji} className="flex items-center gap-3">
                  <span className="text-xl w-8 text-center">{e.emoji}</span>
                  <span className="text-sm text-muted-foreground">{e.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElderOversightPanel;
