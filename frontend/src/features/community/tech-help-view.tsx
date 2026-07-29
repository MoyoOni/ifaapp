import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LifeBuoy, HelpCircle, Check } from 'lucide-react';
import { FeatureHeader } from '@/shared/components/feature-header';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { useToast } from '@/shared/components/toast';
import { isDevModeActive } from '@/shared/utils/dev-mode';

// COMMUNITY_BACKLOG.md FOR-009 (platform owner decision, July 29, 2026):
// low-friction tech-help board -- elders (BABALAWO) ask, any community
// member can answer. Distinct from "Ask an Elder" (spiritual Q&A elders
// answer) and community-mentorship (general newcomer mentorship): this is
// help using the platform itself, not spiritual guidance.
interface TechHelpRequest {
  id: string;
  question: string;
  status: 'OPEN' | 'ANSWERED';
  answer?: string;
  createdAt: string;
  requester?: { id: string; name: string; yorubaName?: string; avatar?: string };
  answeredBy?: { id: string; name: string; yorubaName?: string };
}

const TechHelpView: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState('');
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});

  const isElder = user?.role === 'BABALAWO';

  const { data: myRequests = [] } = useQuery<TechHelpRequest[]>({
    queryKey: ['tech-help-mine'],
    queryFn: async () => (await api.get('/tech-help/requests/mine')).data,
    enabled: isElder && !isDevModeActive(),
  });

  const { data: openRequests = [] } = useQuery<TechHelpRequest[]>({
    queryKey: ['tech-help-open'],
    queryFn: async () => (await api.get('/tech-help/requests')).data,
    enabled: !isDevModeActive(),
  });

  const ask = useMutation({
    mutationFn: async () => api.post('/tech-help/requests', { question }),
    onSuccess: () => {
      success('Your question is up — someone will help soon');
      queryClient.invalidateQueries({ queryKey: ['tech-help-mine'] });
      queryClient.invalidateQueries({ queryKey: ['tech-help-open'] });
      setQuestion('');
    },
    onError: () => error('Could not post your question — please try again'),
  });

  const answer = useMutation({
    mutationFn: async (id: string) =>
      api.patch(`/tech-help/requests/${id}/answer`, { answer: answerDrafts[id] }),
    onSuccess: () => {
      success('Answer sent — thank you for helping');
      queryClient.invalidateQueries({ queryKey: ['tech-help-open'] });
    },
    onError: () => error('Could not send your answer'),
  });

  return (
    <div className="py-6 animate-in fade-in duration-500 max-w-3xl mx-auto space-y-8">
      <FeatureHeader
        feature="community"
        title="Tech Help for Elders"
        subtitle="A low-friction place for our elders to ask about using the platform itself — anyone in the community can help answer."
        icon={LifeBuoy}
      />

      {isElder && (
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">Ask a Question</h2>
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What are you trying to do, and where are you stuck?"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
            />
            <button
              type="button"
              onClick={() => ask.mutate()}
              disabled={question.trim().length < 5 || ask.isPending}
              className="px-4 py-2 bg-highlight text-foreground rounded-lg font-bold text-sm hover:bg-secondary transition-colors disabled:opacity-50"
            >
              {ask.isPending ? 'Sending…' : 'Ask for Help'}
            </button>
          </div>

          {myRequests.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Your Questions</p>
              {myRequests.map((r) => (
                <div key={r.id} className="bg-muted/40 rounded-xl p-3 text-sm space-y-1">
                  <p className="text-foreground">{r.question}</p>
                  {r.answer ? (
                    <div className="mt-2 bg-card rounded-lg p-2">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                        Answered by {r.answeredBy?.yorubaName || r.answeredBy?.name}
                      </p>
                      <p className="text-sm text-foreground">{r.answer}</p>
                    </div>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-highlight/10 text-highlight">Waiting for an answer</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <HelpCircle size={18} /> Help an Elder
        </h2>
        {openRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open questions right now.</p>
        ) : (
          <div className="space-y-3">
            {openRequests
              .filter((r) => r.requester?.id !== user?.id)
              .map((r) => (
                <div key={r.id} className="bg-card border border-border rounded-xl p-4">
                  <p className="text-sm font-medium text-foreground mb-1">
                    {r.requester?.yorubaName || r.requester?.name}
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">{r.question}</p>
                  <textarea
                    value={answerDrafts[r.id] || ''}
                    onChange={(e) => setAnswerDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    placeholder="Share how to do this..."
                    rows={2}
                    className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-xs resize-none mb-2"
                  />
                  <button
                    type="button"
                    onClick={() => answer.mutate(r.id)}
                    disabled={!answerDrafts[r.id]?.trim() || answer.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <Check size={12} /> Send Answer
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TechHelpView;
