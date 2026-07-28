import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Users2, HeartHandshake, Sparkles, ExternalLink } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/components/toast';

interface VendorCommunityPanelProps {
  activeTab: string;
}

interface AvailableMentor {
  id: string;
  businessName: string;
  apprenticeshipTier: string;
  description?: string;
  activeMenteeCount: number;
}

interface Mentorship {
  id: string;
  status: string;
  startedAt: string;
  endsAt: string;
  mentor?: { id: string; businessName: string; apprenticeshipTier: string };
  mentee?: { id: string; businessName: string };
}

interface MyMentorship {
  asMentee: Mentorship | null;
  asMentor: Mentorship[];
}

interface SpiritualLeave {
  id: string;
  reason: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface ApprenticeshipProgress {
  apprenticeshipTier: string;
  tierUpdatedAt: string | null;
  culturalTrainingCompleted: boolean;
  hasBeenMentored: boolean;
  currentMentorBusinessName: string | null;
  menteesGraduated: number;
  verificationStatus: string;
}

const TIER_LABELS: Record<string, string> = {
  APPRENTICE: 'Apprentice',
  RECOGNIZED_ARTISAN: 'Recognized Artisan',
  MASTER_PRACTITIONER: 'Master Practitioner',
  ELDER_APPROVED: 'Elder-Approved',
};

// VENDOR_BACKLOG.md VND-019 (mentor matching) + SHOP_BACKLOG.md MSP-016
// (apprenticeship progress dashboard) + MSP-018 (spiritual leave). Wellness
// check-ins deliberately link out to /wellbeing (COMMUNITY_BACKLOG.md FOR-017)
// rather than duplicating that flow here -- any vendor can already use it.
const VendorCommunityPanel: React.FC<VendorCommunityPanelProps> = ({ activeTab }) => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [showLeaveForm, setShowLeaveForm] = useState(false);

  const enabled = activeTab === 'community';

  const { data: progress } = useQuery<ApprenticeshipProgress>({
    queryKey: ['vendor-apprenticeship-progress'],
    queryFn: async () => (await api.get('/vendor-community/apprenticeship-progress')).data,
    enabled,
  });

  const { data: mentorship } = useQuery<MyMentorship>({
    queryKey: ['vendor-mentorship-mine'],
    queryFn: async () => (await api.get('/vendor-community/mentorship/mine')).data,
    enabled,
  });

  const { data: availableMentors = [] } = useQuery<AvailableMentor[]>({
    queryKey: ['vendor-mentors-available'],
    queryFn: async () => (await api.get('/vendor-community/mentors/available')).data,
    enabled: enabled && !mentorship?.asMentee,
  });

  const { data: leaves = [] } = useQuery<SpiritualLeave[]>({
    queryKey: ['vendor-spiritual-leave-mine'],
    queryFn: async () => (await api.get('/vendor-community/spiritual-leave/mine')).data,
    enabled,
  });

  const requestMentorMutation = useMutation({
    mutationFn: (mentorVendorId: string) =>
      api.post('/vendor-community/mentorship/request', { mentorVendorId }),
    onSuccess: () => {
      success('Mentorship requested! Your mentor has been notified.');
      queryClient.invalidateQueries({ queryKey: ['vendor-mentorship-mine'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-mentors-available'] });
    },
    onError: (err: any) => error(err?.response?.data?.error?.message || 'Could not request mentorship'),
  });

  const requestLeaveMutation = useMutation({
    mutationFn: () =>
      api.post('/vendor-community/spiritual-leave', {
        reason: leaveReason,
        startDate: leaveStart,
        endDate: leaveEnd,
      }),
    onSuccess: () => {
      success('Spiritual leave logged. No approval needed — this is just so the platform knows.');
      setLeaveReason('');
      setLeaveStart('');
      setLeaveEnd('');
      setShowLeaveForm(false);
      queryClient.invalidateQueries({ queryKey: ['vendor-spiritual-leave-mine'] });
    },
    onError: (err: any) => error(err?.response?.data?.error?.message || 'Could not log spiritual leave'),
  });

  if (!enabled) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Vendor Community</h2>
        <p className="text-muted-foreground">Your apprenticeship pathway, mentorship, and wellbeing as a vendor</p>
      </div>

      {progress && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-sm text-muted-foreground">Your apprenticeship tier</div>
              <div className="text-xl font-bold text-foreground">
                {TIER_LABELS[progress.apprenticeshipTier] ?? progress.apprenticeshipTier}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant={progress.culturalTrainingCompleted ? 'default' : 'secondary'}>
                {progress.culturalTrainingCompleted ? '✓ Cultural training complete' : 'Cultural training pending'}
              </Badge>
              {progress.menteesGraduated > 0 && (
                <Badge variant="default">🧑‍🏫 Mentored {progress.menteesGraduated}</Badge>
              )}
            </div>
          </div>
          {!progress.culturalTrainingCompleted && (
            <p className="text-sm text-muted-foreground mt-3">
              Complete <strong>Ori — The Metaphysics of Consciousness</strong> in the{' '}
              <Link to="/academy" className="underline">
                Academy
              </Link>{' '}
              to become eligible for tier advancement beyond Apprentice.
            </p>
          )}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <HeartHandshake className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Mentorship</h3>
        </div>

        {mentorship?.asMentee ? (
          <div className="text-sm">
            Your mentor is <strong>{mentorship.asMentee.mentor?.businessName}</strong>, through{' '}
            {new Date(mentorship.asMentee.endsAt).toLocaleDateString()}.
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              New here? Ask an experienced vendor to guide you through your first 30 days.
            </p>
            {availableMentors.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No mentors available right now — check back soon.</p>
            ) : (
              <div className="space-y-2">
                {availableMentors.map((m) => (
                  <div key={m.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                    <div>
                      <div className="font-medium text-foreground">{m.businessName}</div>
                      <div className="text-xs text-muted-foreground">
                        {TIER_LABELS[m.apprenticeshipTier] ?? m.apprenticeshipTier} · {m.activeMenteeCount}/3 mentees
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => requestMentorMutation.mutate(m.id)}
                      disabled={requestMentorMutation.isPending}
                    >
                      Request as mentor
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {mentorship && mentorship.asMentor.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-sm font-medium text-foreground mb-2">Vendors you're mentoring</div>
            <div className="space-y-2">
              {mentorship.asMentor.map((m) => (
                <div key={m.id} className="text-sm text-muted-foreground">
                  {m.mentee?.businessName} — through {new Date(m.endsAt).toLocaleDateString()}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border">
          <Link to="/forum" className="text-sm text-primary flex items-center gap-1 hover:underline">
            <Users className="w-4 h-4" /> Visit the Vendor Circle forum <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* SHOP_BACKLOG.md MSP-005: Vendor Collaboration Spaces */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <Users2 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Vendor Partnerships</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Form or join a declared collective with other vendors for joint offerings, shared teachings, and
          coordinated preparation around ceremonies.
        </p>
        <Link to="/marketplace/partnerships" className="text-sm text-primary flex items-center gap-1 hover:underline">
          <Users2 className="w-4 h-4" /> Browse & manage partnerships <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Spiritual Leave</h3>
          </div>
          {!showLeaveForm && (
            <Button size="sm" variant="outline" onClick={() => setShowLeaveForm(true)}>
              Log leave for a ceremony
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Time away for an observance or ceremony, so it's on record and doesn't need explaining after the fact.
          Self-declared — no approval required.
        </p>

        {showLeaveForm && (
          <div className="space-y-2 mb-4 border border-border rounded-lg p-3">
            <input
              className="w-full border border-border rounded px-2 py-1 text-sm bg-background"
              placeholder="Reason (e.g. Isese Day observance)"
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
            />
            <div className="flex gap-2">
              <input
                type="date"
                className="flex-1 border border-border rounded px-2 py-1 text-sm bg-background"
                value={leaveStart}
                onChange={(e) => setLeaveStart(e.target.value)}
              />
              <input
                type="date"
                className="flex-1 border border-border rounded px-2 py-1 text-sm bg-background"
                value={leaveEnd}
                onChange={(e) => setLeaveEnd(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => requestLeaveMutation.mutate()}
                disabled={!leaveReason || !leaveStart || !leaveEnd || requestLeaveMutation.isPending}
              >
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowLeaveForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {leaves.length > 0 && (
          <div className="space-y-1">
            {leaves.map((l) => (
              <div key={l.id} className="text-sm text-muted-foreground">
                {l.reason} — {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-2">Wellbeing & Support</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Running a spiritual business can be demanding. Community wellbeing check-ins are open to every member,
          vendors included.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/wellbeing">
            <Button size="sm" variant="outline">Request a check-in</Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          If you're in crisis or immediate danger, please contact your local emergency services or a crisis
          hotline. For non-emergency support, reach out to <strong>hello@iluase.com</strong>.
        </p>
      </div>
    </div>
  );
};

export default VendorCommunityPanel;
