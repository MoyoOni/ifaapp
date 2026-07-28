import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users2, Calendar, MessageSquareText, BookOpen, ArrowRight } from 'lucide-react';
import { FeatureHeader } from '@/shared/components/feature-header';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { useToast } from '@/shared/components/toast';

interface PartnershipMember {
  id: string;
  businessName: string;
}

interface Partnership {
  id: string;
  name: string;
  description?: string;
  members: PartnershipMember[];
  plannedEvent?: { id: string; title: string; date: string } | null;
  coordinationThreadId?: string;
  teachingsTag: string;
}

interface PartnershipDetailViewProps {
  partnershipId: string;
}

// SHOP_BACKLOG.md MSP-005: Vendor Collaboration Spaces
const PartnershipDetailView: React.FC<PartnershipDetailViewProps> = ({ partnershipId }) => {
  const { isAuthenticated, user } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const { data: partnership, isLoading } = useQuery<Partnership>({
    queryKey: ['vendor-partnership', partnershipId],
    queryFn: async () => (await api.get(`/marketplace/partnerships/${partnershipId}`)).data,
    enabled: !!partnershipId,
  });

  // members are keyed by Vendor.id, not User.id -- resolve the caller's own
  // vendor profile to know whether they're already a member.
  const { data: myVendor } = useQuery<{ id: string }>({
    queryKey: ['vendor-profile-me'],
    queryFn: async () => (await api.get('/marketplace/vendors/me')).data,
    enabled: isAuthenticated && !!user && (user.role === 'VENDOR' || user.role === 'ADMIN'),
  });

  const isMember = !!(myVendor && partnership?.members.some((m) => m.id === myVendor.id));

  const joinMutation = useMutation({
    mutationFn: () => api.post(`/marketplace/partnerships/${partnershipId}/join`),
    onSuccess: () => {
      success('Joined the partnership');
      queryClient.invalidateQueries({ queryKey: ['vendor-partnership', partnershipId] });
    },
    onError: (err: any) => error(err?.response?.data?.error?.userMessage || 'Could not join'),
  });

  const leaveMutation = useMutation({
    mutationFn: () => api.delete(`/marketplace/partnerships/${partnershipId}/join`),
    onSuccess: () => {
      success('Left the partnership');
      queryClient.invalidateQueries({ queryKey: ['vendor-partnership', partnershipId] });
    },
    onError: (err: any) => error(err?.response?.data?.error?.userMessage || 'Could not leave'),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground py-6">Loading partnership...</p>;
  if (!partnership) return <p className="text-sm text-muted-foreground py-6">Partnership not found.</p>;

  return (
    <div className="py-6 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <FeatureHeader
        feature="marketplace"
        title={partnership.name}
        subtitle={partnership.description || 'A vendor collaboration'}
        icon={Users2}
      />

      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h3 className="font-bold text-foreground mb-3">Members</h3>
        <div className="flex flex-wrap gap-2">
          {partnership.members.map((m) => (
            <span key={m.id} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
              {m.businessName}
            </span>
          ))}
        </div>
        {isAuthenticated && (user?.role === 'VENDOR' || user?.role === 'ADMIN') && (
          <div className="mt-4 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => (isMember ? leaveMutation.mutate() : joinMutation.mutate())}
              className="text-sm font-medium text-highlight hover:underline"
            >
              {isMember ? 'Leave this partnership' : 'Join this partnership'}
            </button>
          </div>
        )}
      </div>

      {partnership.plannedEvent && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
            <Calendar size={18} className="text-primary" /> Preparing For
          </h3>
          <p className="text-sm text-muted-foreground">
            {partnership.plannedEvent.title} —{' '}
            {new Date(partnership.plannedEvent.date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h3 className="font-bold text-foreground mb-3">Collaborate</h3>
        <div className="flex flex-col gap-2">
          {partnership.coordinationThreadId && (
            <Link
              to={`/forum/${partnership.coordinationThreadId}`}
              className="inline-flex items-center gap-2 text-sm text-highlight hover:underline"
            >
              <MessageSquareText size={16} /> Coordination thread in Vendor Circle <ArrowRight size={12} />
            </Link>
          )}
          <Link
            to={`/marketplace/stories?tag=${partnership.teachingsTag}`}
            className="inline-flex items-center gap-2 text-sm text-highlight hover:underline"
          >
            <BookOpen size={16} /> Shared teachings & stories <ArrowRight size={12} />
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Members: tag any story you submit with <strong>{partnership.teachingsTag}</strong> to have it appear here.
        </p>
      </div>
    </div>
  );
};

export default PartnershipDetailView;
