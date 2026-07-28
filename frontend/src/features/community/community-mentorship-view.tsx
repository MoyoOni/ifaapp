import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, HandHeart } from 'lucide-react';
import { FeatureHeader } from '@/shared/components/feature-header';
import { useToast } from '@/shared/components/toast';
import api from '@/lib/api';
import { isDevModeActive } from '@/shared/utils/dev-mode';

// COMMUNITY_BACKLOG.md FOR-004: "Mentorship matching for new members" --
// self-service request against the "Ask an Elder" opt-in pool
// (answersElderQuestions), same shape as VendorCommunityService's mentorship.
interface AvailableMentor {
  id: string;
  name: string;
  yorubaName?: string;
  avatar?: string;
  specialization: string[];
  availabilityNote?: string;
  activeMenteeCount: number;
}

interface MentorshipSummary {
  id: string;
  status: string;
  startedAt: string;
  endsAt: string;
  mentor?: { id: string; name: string; yorubaName?: string; avatar?: string };
  mentee?: { id: string; name: string; yorubaName?: string; avatar?: string };
}

interface MyMentorship {
  asMentee: MentorshipSummary | null;
  asMentor: MentorshipSummary[];
}

const CommunityMentorshipView: React.FC = () => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const { data: mine } = useQuery<MyMentorship>({
    queryKey: ['community-mentorship-mine'],
    queryFn: async () => (await api.get('/community-mentorship/mine')).data,
    enabled: !isDevModeActive(),
  });

  const { data: mentors = [], isLoading } = useQuery<AvailableMentor[]>({
    queryKey: ['community-mentorship-available'],
    queryFn: async () => (await api.get('/community-mentorship/mentors/available')).data,
    enabled: !mine?.asMentee && !isDevModeActive(),
  });

  const requestMentorship = useMutation({
    mutationFn: async (mentorUserId: string) =>
      api.post('/community-mentorship/request', { mentorUserId }),
    onSuccess: () => {
      success('Mentorship requested! Your mentor has been notified.');
      queryClient.invalidateQueries({ queryKey: ['community-mentorship-mine'] });
    },
    onError: () => error('Could not send that request — please try again'),
  });

  return (
    <div className="max-w-3xl mx-auto p-6">
      <FeatureHeader
        feature="community"
        title="Community Mentorship"
        subtitle="New to Ìlú Àṣẹ? Ask an elder who's opted in to guide you through your first month."
        icon={HandHeart}
      />

      {mine?.asMentee && (
        <div className="p-5 bg-card rounded-xl border border-border/50 mb-6">
          <p className="text-sm text-muted-foreground mb-1">Your mentor</p>
          <p className="font-bold text-foreground">
            {mine.asMentee.mentor?.name}
            {mine.asMentee.mentor?.yorubaName ? ` (${mine.asMentee.mentor.yorubaName})` : ''}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Mentorship period ends {new Date(mine.asMentee.endsAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {!mine?.asMentee && (
        isLoading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(2)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl" />)}
          </div>
        ) : mentors.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
            <Users className="mx-auto text-muted-foreground mb-3" size={32} />
            <p className="text-muted-foreground">No mentors are currently available. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mentors.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-5 bg-card rounded-xl border border-border/50">
                <div>
                  <p className="font-bold text-foreground">
                    {m.name}{m.yorubaName ? ` (${m.yorubaName})` : ''}
                  </p>
                  {m.specialization.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">{m.specialization.join(', ')}</p>
                  )}
                  {m.availabilityNote && (
                    <p className="text-xs text-muted-foreground mt-1">{m.availabilityNote}</p>
                  )}
                </div>
                <button
                  onClick={() => requestMentorship.mutate(m.id)}
                  disabled={requestMentorship.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
                >
                  Request Mentorship
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {mine && mine.asMentor.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold text-foreground mb-3">Your mentees</h2>
          <div className="space-y-2">
            {mine.asMentor.map((m) => (
              <div key={m.id} className="p-4 bg-card rounded-xl border border-border/50">
                <p className="font-medium text-foreground">
                  {m.mentee?.name}{m.mentee?.yorubaName ? ` (${m.mentee.yorubaName})` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityMentorshipView;
