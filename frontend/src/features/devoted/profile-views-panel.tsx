import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Eye } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { useSubscription } from '@/features/subscription/use-subscription';
import { UpgradePrompt } from '@/features/subscription/feature-gate';

interface ProfileViewer {
  id: string;
  viewedAt: string;
  viewer: {
    id: string;
    name: string;
    yorubaName?: string | null;
    avatar?: string | null;
    role: string;
  };
}

// V8-302: the backend endpoint (GET /users/:id/profile-viewers) and the
// view-logging that feeds it were already built and working -- nothing on
// the frontend ever called it, so this Devoted benefit was completely
// invisible. Static rows for the FREE-tier blurred teaser, matching the
// backlog's mockup exactly.
const TEASER_ROWS = [
  { name: 'Adewale O.', role: 'Babalawo', time: '2 hours ago' },
  { name: 'Funke A.', role: 'Seeker', time: 'Yesterday' },
  { name: 'Emeka T.', role: 'Seeker', time: '3 days ago' },
];

export default function ProfileViewsPanel() {
  const { user } = useAuth();
  const { isDevoted } = useSubscription();
  const navigate = useNavigate();

  const { data: viewers = [], isLoading } = useQuery<ProfileViewer[]>({
    queryKey: ['profile-viewers', user?.id],
    queryFn: () => api.get(`/users/${user!.id}/profile-viewers`).then((r) => r.data),
    enabled: !!user && isDevoted,
    refetchInterval: 5 * 60 * 1000,
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-1">
        <Eye size={18} className="text-amber-500" />
        <h3 className="font-bold text-foreground">Who Visited Your Profile</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Last 30 days</p>

      {!isDevoted ? (
        <div className="relative">
          <div className="space-y-3 blur-sm select-none pointer-events-none" aria-hidden="true">
            {TEASER_ROWS.map((row) => (
              <div key={row.name} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.role}</p>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">{row.time}</span>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-card/40">
            <UpgradePrompt message="See who visited your profile — Devoted only" />
          </div>
        </div>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : viewers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No visitors yet in the last 30 days.</p>
      ) : (
        <div className="space-y-1">
          {viewers.slice(0, 10).map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => navigate(`/profile/${v.viewer.id}`)}
              className="w-full flex items-center gap-3 hover:bg-muted/60 rounded-xl p-2 -mx-2 transition-colors text-left"
            >
              {v.viewer.avatar ? (
                <img src={v.viewer.avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-xs font-bold text-muted-foreground">
                  {(v.viewer.yorubaName || v.viewer.name).charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {v.viewer.yorubaName || v.viewer.name}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{v.viewer.role.toLowerCase()}</p>
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {formatDistanceToNow(new Date(v.viewedAt), { addSuffix: true })}
              </span>
            </button>
          ))}
          {viewers.length > 10 && (
            <p className="text-xs text-muted-foreground pt-2 px-2">+ {viewers.length - 10} more this month</p>
          )}
        </div>
      )}
    </div>
  );
}
