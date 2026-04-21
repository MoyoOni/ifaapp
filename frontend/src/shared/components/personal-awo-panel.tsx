import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Leaf, Star, CheckCircle, MessageCircle, CalendarPlus, X } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';

interface PersonalAwo {
  id: string;
  name: string;
  yorubaName: string | null;
  avatar: string | null;
  slug: string | null;
  trustScore: number;
  verified: boolean;
  sessionCount: number;
}

export function PersonalAwoPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['personal-awo', user?.id],
    queryFn: () => api.get('/users/my/personal-awo').then((r) => r.data as { personalAwo: PersonalAwo | null }),
    enabled: !!user && user.role === 'CLIENT',
  });

  const clearAwo = useMutation({
    mutationFn: () => api.patch(`/users/${user!.id}`, { personalAwoId: null }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personal-awo', user?.id] }),
  });

  if (isLoading || !user || user.role !== 'CLIENT') return null;

  const awo = data?.personalAwo;

  if (!awo) {
    return (
      <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <Leaf size={16} />
          <span className="text-sm font-bold uppercase tracking-wider">Find Your Personal Awo</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your spiritual guide on this platform. The relationship is built over time — after 3 sessions, your Awo is remembered here.
        </p>
        <button type="button"
          onClick={() => navigate('/discovery')}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Browse Practitioners →
        </button>
      </div>
    );
  }

  const trustPercent = Math.round(awo.trustScore * 100);
  const initials = awo.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <Leaf size={16} />
          <span className="text-sm font-bold uppercase tracking-wider">Your Personal Awo</span>
        </div>
        <button type="button"
          onClick={() => clearAwo.mutate()}
          title="Remove Personal Awo"
          className="text-muted-foreground hover:text-destructive transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex items-center gap-4">
        {awo.avatar ? (
          <img src={awo.avatar} alt={awo.name} className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500/30" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-lg">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-foreground truncate">{awo.name}</div>
          {awo.yorubaName && (
            <div className="text-xs text-muted-foreground font-medium">{awo.yorubaName}</div>
          )}
          <div className="flex items-center gap-2 mt-1">
            {awo.verified && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle size={11} /> Verified
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
              <Star size={11} /> {trustPercent}% trust
            </span>
            <span className="text-xs text-muted-foreground">{awo.sessionCount} sessions</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button type="button"
          onClick={() => navigate(`/booking/${awo.id}`)}
          className="flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <CalendarPlus size={14} /> Book Again
        </button>
        <button type="button"
          onClick={() => navigate(`/messages/${awo.id}`)}
          className="flex items-center justify-center gap-2 py-2.5 border border-border hover:bg-muted/50 text-foreground rounded-xl text-sm font-semibold transition-colors"
        >
          <MessageCircle size={14} /> Message
        </button>
      </div>
      <button type="button"
        onClick={() => navigate(awo.slug ? `/${awo.slug}` : `/profile/${awo.id}`)}
        className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        View Full Profile →
      </button>
    </div>
  );
}
