import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, User, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/use-auth';
import { useSubscription } from '@/features/subscription/use-subscription';
import { UpgradePrompt } from '@/features/subscription/feature-gate';
import api from '@/lib/api';
import { isDevModeActive } from '@/shared/utils/dev-mode';

interface ProfileView {
  id: string;
  viewedAt: string;
  viewer: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
    role: string;
  };
}

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const roleLabel = (role: string) => {
  if (role === 'BABALAWO') return 'Babalawo';
  if (role === 'VENDOR') return 'Vendor';
  if (role === 'ADMIN') return 'Admin';
  return 'Seeker';
};

export const ProfileViewsPanel: React.FC = () => {
  const { user } = useAuth();
  const { isDevoted, isLoading: subLoading } = useSubscription();
  const navigate = useNavigate();

  const { data: views = [], isLoading } = useQuery<ProfileView[]>({
    queryKey: ['profile-views-mine', user?.id],
    queryFn: () => api.get('/users/profile-views/mine').then(r => r.data),
    enabled: !!user && isDevoted && !isDevModeActive(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (subLoading || isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 animate-pulse">
        <div className="h-5 w-40 bg-muted rounded mb-4" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
            <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-32 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Eye size={18} className="text-primary" />
        <h3 className="font-bold text-foreground">Who Visited Your Profile</h3>
        <span className="ml-auto text-xs text-muted-foreground">Last 30 days</span>
      </div>

      {!isDevoted ? (
        <>
          {/* Blurred teaser */}
          <div className="relative mb-4">
            <div className="space-y-0 select-none pointer-events-none">
              {['Adewale O.', 'Funke A.', 'Emeka T.'].map((name, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-border last:border-0 blur-sm">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">Seeker · 2 days ago</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center" />
          </div>
          <UpgradePrompt message="See who's been visiting your profile. Devoted members only." compact={false} />
        </>
      ) : views.length === 0 ? (
        <div className="text-center py-8">
          <Eye size={36} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No profile visits in the last 30 days yet.</p>
        </div>
      ) : (
        <>
          <div className="space-y-0">
            {views.slice(0, 10).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => navigate(`/profile/${v.viewer.id}`)}
                className="w-full flex items-center gap-3 py-3 border-b border-border last:border-0 hover:bg-muted/40 transition-colors rounded-lg px-1 text-left"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {v.viewer.avatar ? (
                    <img src={v.viewer.avatar} alt={v.viewer.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} className="text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{v.viewer.name}</p>
                  <p className="text-xs text-muted-foreground">{roleLabel(v.viewer.role)}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                  <Clock size={11} />
                  {timeAgo(v.viewedAt)}
                </div>
              </button>
            ))}
          </div>
          {views.length > 10 && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              + {views.length - 10} more this month
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default ProfileViewsPanel;
