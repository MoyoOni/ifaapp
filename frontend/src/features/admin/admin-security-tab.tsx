import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, AlertTriangle, LogOut, RefreshCw, User, Clock, Monitor } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';

interface SecurityOverview {
  activeSessions: number;
  loginsLast24h: number;
  failedLoginsLastHour: number;
  uniqueActiveIPs: number;
  suspiciousIPs: { ip: string; failCount: number }[];
}

interface SessionRecord {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  loginAt: string;
  lastSeenAt: string;
  isActive: boolean;
  success: boolean;
  failReason: string | null;
  user?: { id: string; name: string; email: string; role: string };
}

function parseUA(ua: string | null) {
  if (!ua) return 'Unknown device';
  if (ua.includes('Mobile')) return 'Mobile browser';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  return 'Browser';
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminSecurityTab() {
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const [userIdSearch, setUserIdSearch] = useState('');
  const [searchedUserId, setSearchedUserId] = useState('');

  const { data: overview, isLoading: overviewLoading } = useQuery<SecurityOverview>({
    queryKey: ['admin', 'security', 'overview'],
    queryFn: () => api.get('/admin/security/overview').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: recentLogins, isLoading: loginsLoading } = useQuery<SessionRecord[]>({
    queryKey: ['admin', 'security', 'logins'],
    queryFn: () => api.get('/admin/security/logins?limit=50').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: userSessions } = useQuery<SessionRecord[]>({
    queryKey: ['admin', 'security', 'user-sessions', searchedUserId],
    queryFn: () => api.get(`/admin/security/users/${searchedUserId}/sessions`).then(r => r.data),
    enabled: !!searchedUserId,
  });

  const forceLogout = useMutation({
    mutationFn: (userId: string) => api.delete(`/admin/security/users/${userId}/sessions`),
    onSuccess: () => {
      success('User sessions invalidated');
      queryClient.invalidateQueries({ queryKey: ['admin', 'security'] });
    },
    onError: () => error('Failed to invalidate sessions'),
  });

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Sessions', value: overview?.activeSessions ?? '—', icon: Monitor, color: 'text-green-500' },
          { label: 'Logins (24h)', value: overview?.loginsLast24h ?? '—', icon: User, color: 'text-blue-500' },
          { label: 'Failed (1h)', value: overview?.failedLoginsLastHour ?? '—', icon: AlertTriangle, color: 'text-yellow-500' },
          { label: 'Unique IPs (1h)', value: overview?.uniqueActiveIPs ?? '—', icon: Shield, color: 'text-purple-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{overviewLoading ? '…' : value}</div>
          </div>
        ))}
      </div>

      {/* Suspicious IPs */}
      {overview?.suspiciousIPs && overview.suspiciousIPs.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-red-500 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Suspicious IPs (&gt;5 failed logins in last hour)
          </h3>
          <div className="space-y-1">
            {overview.suspiciousIPs.map(({ ip, failCount }) => (
              <div key={ip} className="flex justify-between text-sm">
                <span className="font-mono text-foreground">{ip}</span>
                <span className="text-red-400">{failCount} failures</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User session lookup */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <User className="w-4 h-4" /> Look Up User Sessions
        </h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="User ID"
            value={userIdSearch}
            onChange={e => setUserIdSearch(e.target.value)}
            className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={() => setSearchedUserId(userIdSearch.trim())}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            Search
          </button>
          {searchedUserId && (
            <button
              onClick={() => forceLogout.mutate(searchedUserId)}
              disabled={forceLogout.isPending}
              className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" /> Force Logout
            </button>
          )}
        </div>

        {userSessions && userSessions.length > 0 && (
          <div className="space-y-2">
            {userSessions.map(s => (
              <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-background text-sm">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${s.isActive ? 'bg-green-500' : 'bg-muted'}`} />
                  <span className="text-muted-foreground font-mono text-xs">{s.ipAddress ?? 'Unknown IP'}</span>
                  <span className="text-muted-foreground">{parseUA(s.userAgent)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {timeAgo(s.loginAt)}
                  {!s.success && <span className="text-red-400">Failed: {s.failReason}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        {userSessions && userSessions.length === 0 && (
          <p className="text-sm text-muted-foreground">No sessions found for this user.</p>
        )}
      </div>

      {/* Recent logins feed */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" /> Recent Login Activity
          </h3>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'security'] })}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loginsLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {(recentLogins ?? []).map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`shrink-0 w-2 h-2 rounded-full ${s.success ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div className="min-w-0">
                    <span className="font-medium text-foreground truncate block">
                      {s.user?.name ?? s.userId}
                    </span>
                    <span className="text-xs text-muted-foreground truncate block">
                      {s.user?.email} · {s.user?.role}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right text-xs text-muted-foreground">
                  <div className="font-mono">{s.ipAddress ?? '—'}</div>
                  <div>{timeAgo(s.loginAt)}</div>
                </div>
              </div>
            ))}
            {!recentLogins?.length && (
              <p className="text-sm text-muted-foreground">No login activity yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
