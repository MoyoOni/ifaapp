import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Award, TrendingUp, Flame, Star, Trash2, X } from 'lucide-react';

const fmt = new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' });

const PRESET_BADGES = [
  { name: 'Elder Voice', slug: 'elder-voice', description: 'Recognised for wisdom and guidance in the community' },
  { name: 'Community Pillar', slug: 'community-pillar', description: 'Consistently supports and uplifts other members' },
  { name: 'Culture Keeper', slug: 'culture-keeper', description: 'Champion of Yoruba cultural authenticity' },
  { name: 'Oral Historian', slug: 'oral-historian', description: 'Contributor to the oral history archive' },
  { name: 'Forum Guide', slug: 'forum-guide', description: 'Helps newcomers navigate the platform' },
];

type View = 'stars' | 'badges';

interface CommunityUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  postCount?: number;
  contributionStreak?: number;
  longestStreak?: number;
  isCommunityBuilder?: boolean;
}

interface UserBadge {
  id: string;
  badgeName: string;
  badgeSlug: string;
  description?: string;
  awardedAt: string;
  message?: string;
  user?: CommunityUser;
  awarder?: { id: string; name: string };
}

interface CommunityStars {
  topPosters: CommunityUser[];
  topStreaks: CommunityUser[];
  recentBadges: UserBadge[];
}

function Avatar({ user }: { user: { name?: string; avatar?: string } }) {
  const initials = (user.name ?? '?').slice(0, 2).toUpperCase();
  return user.avatar ? (
    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
  ) : (
    <div className="w-8 h-8 rounded-full bg-highlight flex items-center justify-center text-xs font-medium text-foreground">
      {initials}
    </div>
  );
}

function AwardModal({
  user,
  onClose,
  onAward,
  isPending,
}: {
  user: CommunityUser;
  onClose: () => void;
  onAward: (data: { badgeName: string; badgeSlug: string; description?: string; message?: string; promoteToBuilder?: boolean }) => void;
  isPending: boolean;
}) {
  const [preset, setPreset] = useState(PRESET_BADGES[0]);
  const [customName, setCustomName] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [message, setMessage] = useState('');
  const [promote, setPromote] = useState(false);

  function submit() {
    const b = useCustom
      ? { badgeName: customName.trim(), badgeSlug: customName.trim().toLowerCase().replace(/\s+/g, '-') }
      : { badgeName: preset.name, badgeSlug: preset.slug, description: preset.description };
    onAward({ ...b, message: message.trim() || undefined, promoteToBuilder: promote || undefined });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Award Badge — {user.name}</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Badge</label>
          <div className="flex gap-2 mb-2">
            <button type="button" onClick={() => setUseCustom(false)} className={`text-xs px-2 py-1 rounded border ${!useCustom ? 'border-foreground bg-highlight' : 'border-border'}`}>Preset</button>
            <button type="button" onClick={() => setUseCustom(true)} className={`text-xs px-2 py-1 rounded border ${useCustom ? 'border-foreground bg-highlight' : 'border-border'}`}>Custom</button>
          </div>
          {useCustom ? (
            <input
              type="text"
              placeholder="Badge name…"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full border border-border rounded px-3 py-2 text-sm bg-card text-foreground"
            />
          ) : (
            <select
              value={preset.slug}
              onChange={(e) => setPreset(PRESET_BADGES.find((b) => b.slug === e.target.value) ?? PRESET_BADGES[0])}
              className="w-full border border-border rounded px-3 py-2 text-sm bg-card text-foreground"
            >
              {PRESET_BADGES.map((b) => (
                <option key={b.slug} value={b.slug}>{b.name}</option>
              ))}
            </select>
          )}
          {!useCustom && <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Personal message (optional)</label>
          <textarea
            rows={3}
            placeholder="A personal note sent to the user…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border border-border rounded px-3 py-2 text-sm bg-card text-foreground resize-none"
          />
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={promote} onChange={(e) => setPromote(e.target.checked)} className="rounded" />
          Promote to Community Builder status
        </label>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded hover:bg-highlight">Cancel</button>
          <button
            type="button"
            onClick={submit}
            disabled={isPending || (useCustom && !customName.trim())}
            className="px-4 py-2 text-sm bg-foreground text-background rounded hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? 'Awarding…' : 'Award Badge'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminCommunityTab() {
  const qc = useQueryClient();
  const [view, setView] = useState<View>('stars');
  const [awardTarget, setAwardTarget] = useState<CommunityUser | null>(null);

  const { data, isLoading } = useQuery<CommunityStars>({
    queryKey: ['admin', 'community', 'stars'],
    queryFn: () => api.get('/admin/community/stars').then((r) => r.data),
  });

  type BadgePayload = { badgeName: string; badgeSlug: string; description?: string; message?: string; promoteToBuilder?: boolean };
  const awardMutation = useMutation({
    mutationFn: ({ userId, badge }: { userId: string; badge: BadgePayload }) =>
      api.post(`/admin/community/badges/${userId}`, badge).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'community'] });
      setAwardTarget(null);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (badgeId: string) => api.delete(`/admin/community/badges/${badgeId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'community'] }),
  });

  return (
    <div className="space-y-6">
      {awardTarget && (
        <AwardModal
          user={awardTarget}
          onClose={() => setAwardTarget(null)}
          onAward={(badge) => awardMutation.mutate({ userId: awardTarget.id, badge })}
          isPending={awardMutation.isPending}
        />
      )}

      <div>
        <h2 className="text-xl font-semibold">Community Recognition</h2>
        <p className="text-sm text-muted-foreground mt-1">Recognise your most engaged members and award custom badges.</p>
      </div>

      {/* View tabs */}
      <div className="flex gap-2 border-b border-border">
        {(['stars', 'badges'] as View[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
              view === v ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {v === 'stars' ? 'Community Stars' : 'Recent Badges'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-center text-sm text-muted-foreground py-12">Loading…</p>
      ) : view === 'stars' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Posters */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-highlight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">Most Active (30 days)</span>
            </div>
            {!data?.topPosters?.length ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No data yet</p>
            ) : (
              data.topPosters.map((u, i) => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                  <span className="text-xs font-bold text-muted-foreground w-4">#{i + 1}</span>
                  <Avatar user={u} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.postCount} posts</p>
                  </div>
                  {u.isCommunityBuilder && (
                    <Star className="w-3.5 h-3.5 text-amber-500" aria-label="Community Builder" />
                  )}
                  <button
                    type="button"
                    onClick={() => setAwardTarget(u)}
                    className="flex items-center gap-1 px-2 py-1 text-xs border border-border rounded hover:bg-highlight"
                  >
                    <Award className="w-3 h-3" /> Award
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Top Streaks */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-highlight flex items-center gap-2">
              <Flame className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">Longest Streaks</span>
            </div>
            {!data?.topStreaks?.length ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No data yet</p>
            ) : (
              data.topStreaks.map((u, i) => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                  <span className="text-xs font-bold text-muted-foreground w-4">#{i + 1}</span>
                  <Avatar user={u} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.contributionStreak}d current · {u.longestStreak}d best
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAwardTarget(u)}
                    className="flex items-center gap-1 px-2 py-1 text-xs border border-border rounded hover:bg-highlight"
                  >
                    <Award className="w-3 h-3" /> Award
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Recent Badges */
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-highlight flex items-center justify-between">
            <span className="font-medium text-sm">Recently Awarded Badges</span>
            <span className="text-xs text-muted-foreground">{data?.recentBadges?.length ?? 0} recent</span>
          </div>
          {!data?.recentBadges?.length ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No badges awarded yet</p>
          ) : (
            data.recentBadges.map((badge) => (
              <div key={badge.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                <Award className="w-5 h-5 text-amber-500 shrink-0" />
                <Avatar user={badge.user ?? {}} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{badge.user?.name} — <span className="text-amber-700">{badge.badgeName}</span></p>
                  {badge.message && <p className="text-xs text-muted-foreground truncate">"{badge.message}"</p>}
                  <p className="text-xs text-muted-foreground">
                    Awarded by {badge.awarder?.name} · {fmt.format(new Date(badge.awardedAt))}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => revokeMutation.mutate(badge.id)}
                  disabled={revokeMutation.isPending}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Revoke badge"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
