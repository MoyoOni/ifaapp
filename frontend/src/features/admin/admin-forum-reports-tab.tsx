import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flag, CheckCircle, EyeOff, AlertTriangle, Ban, MessageSquare, Hash, Users, ThumbsUp, TrendingUp, Scroll } from 'lucide-react';
import api from '@/lib/api';

interface ForumStats {
  totalThreads: number;
  totalPosts: number;
  totalCategories: number;
  openReports: number;
  totalAcknowledgments: number;
  activeParticipants7d: number;
}

interface ForumReport {
  id: string;
  reason: string;
  note?: string;
  status: string;
  createdAt: string;
  reporter: { id: string; name: string; yorubaName?: string };
  post: {
    id: string;
    content: string;
    authorId: string;
    author: { id: string; name: string; yorubaName?: string };
    thread: { id: string; title: string };
  };
}

const ACTION_OPTIONS = [
  { value: 'dismiss',   label: 'Dismiss',    icon: CheckCircle,    cls: 'text-emerald-600 hover:bg-emerald-50' },
  { value: 'hide_post', label: 'Hide Post',  icon: EyeOff,         cls: 'text-amber-600 hover:bg-amber-50' },
  { value: 'warn_user', label: 'Warn User',  icon: AlertTriangle,  cls: 'text-orange-600 hover:bg-orange-50' },
  { value: 'ban_user',  label: 'Ban User',   icon: Ban,            cls: 'text-red-600 hover:bg-red-50' },
] as const;

interface ElderFlag {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  flagger: { id: string; name: string; yorubaName?: string; verified: boolean };
  post: {
    id: string;
    content: string;
    author: { id: string; name: string; yorubaName?: string };
    thread: { id: string; title: string };
  };
}

const ELDER_FLAG_ACTIONS = [
  { value: 'acknowledge',  label: 'Acknowledge',  icon: CheckCircle,    cls: 'text-emerald-600 hover:bg-emerald-50' },
  { value: 'request_edit',label: 'Request Edit', icon: AlertTriangle,  cls: 'text-amber-600 hover:bg-amber-50' },
  { value: 'remove_post', label: 'Remove Post',  icon: EyeOff,         cls: 'text-orange-600 hover:bg-orange-50' },
  { value: 'dismiss',     label: 'Dismiss',      icon: Ban,            cls: 'text-muted-foreground hover:bg-muted' },
] as const;

const AdminForumReportsTab: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [elderFlagFilter, setElderFlagFilter] = useState('PENDING');
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery<ForumStats>({
    queryKey: ['forum-admin-stats'],
    queryFn: async () => {
      const res = await api.get('/forum/admin/stats');
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const STAT_CARDS = [
    { label: 'Threads', value: stats?.totalThreads ?? 0, icon: Hash, color: 'text-emerald-600' },
    { label: 'Posts', value: stats?.totalPosts ?? 0, icon: MessageSquare, color: 'text-blue-500' },
    { label: 'Active (7d)', value: stats?.activeParticipants7d ?? 0, icon: Users, color: 'text-purple-500' },
    { label: 'Àṣẹ Given', value: stats?.totalAcknowledgments ?? 0, icon: ThumbsUp, color: 'text-amber-500' },
    { label: 'Open Reports', value: stats?.openReports ?? 0, icon: Flag, color: 'text-red-500' },
    { label: 'Categories', value: stats?.totalCategories ?? 0, icon: TrendingUp, color: 'text-teal-500' },
  ];

  const { data: reports = [], isLoading } = useQuery<ForumReport[]>({
    queryKey: ['forum-reports', statusFilter],
    queryFn: async () => {
      const res = await api.get('/forum/reports', { params: { status: statusFilter } });
      return res.data || [];
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) =>
      api.patch(`/forum/reports/${id}`, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-reports'] });
    },
  });

  // F9-604: Elder Flag queries
  const { data: elderFlags = [], isLoading: elderFlagsLoading } = useQuery<ElderFlag[]>({
    queryKey: ['forum-elder-flags', elderFlagFilter],
    queryFn: async () => {
      const res = await api.get('/forum/elder-flags', { params: { status: elderFlagFilter } });
      return res.data || [];
    },
  });

  const reviewElderFlagMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) =>
      api.patch(`/forum/elder-flags/${id}`, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-elder-flags'] });
    },
  });

  return (
    <div className="space-y-6">

      {/* Forum Stats */}
      <div>
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <TrendingUp size={14} /> Forum Health
        </h3>
        {statsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1">
                <div className={`flex items-center gap-1.5 ${color}`}>
                  <Icon size={14} />
                  <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
                </div>
                <span className="text-2xl font-bold text-foreground">{value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Flag size={20} className="text-red-400" /> Forum Reports
        </h2>
        <div className="flex gap-2">
          {(['PENDING', 'REVIEWED'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                statusFilter === s
                  ? 'bg-highlight text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {s === 'PENDING' ? 'Pending' : 'Reviewed'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Flag size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No {statusFilter.toLowerCase()} reports</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-card border border-border rounded-2xl p-5 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">
                    Reported by <span className="font-semibold text-foreground">{report.reporter.yorubaName ?? report.reporter.name}</span>
                    {' · '}{new Date(report.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold">{report.reason}</span>
                    <span className="text-xs text-muted-foreground">in thread: <em>{report.post.thread.title}</em></span>
                  </div>
                </div>
                {report.status === 'REVIEWED' && (
                  <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 font-semibold">Reviewed</span>
                )}
              </div>

              {/* Post excerpt */}
              <div className="bg-muted/50 rounded-xl p-3 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">
                  Post by {report.post.author.yorubaName ?? report.post.author.name}
                </p>
                <p className="text-sm text-foreground line-clamp-3">{report.post.content}</p>
              </div>

              {report.note && (
                <p className="text-xs text-muted-foreground italic">Reporter note: "{report.note}"</p>
              )}

              {/* Actions */}
              {report.status === 'PENDING' && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {ACTION_OPTIONS.map(({ value, label, icon: Icon, cls }) => (
                    <button
                      key={value}
                      type="button"
                      disabled={reviewMutation.isPending}
                      onClick={() => reviewMutation.mutate({ id: report.id, action: value })}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold border border-border transition-colors disabled:opacity-50 ${cls}`}
                    >
                      <Icon size={12} /> {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* F9-604: Elder Flags — Cultural Veto section */}
      <div className="space-y-4 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Scroll size={20} className="text-amber-400" /> 🔱 Elder Flags
            <span className="text-xs font-normal text-muted-foreground ml-1">Cultural accuracy concerns from verified Babalawos</span>
          </h2>
          <div className="flex gap-2">
            {(['PENDING', 'REVIEWED'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setElderFlagFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  elderFlagFilter === s
                    ? 'bg-amber-500 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {s === 'PENDING' ? 'Pending' : 'Reviewed'}
              </button>
            ))}
          </div>
        </div>

        {elderFlagsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : elderFlags.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <span className="text-3xl block mb-2">🔱</span>
            <p className="font-semibold">No {elderFlagFilter.toLowerCase()} elder flags</p>
          </div>
        ) : (
          <div className="space-y-4">
            {elderFlags.map((flag) => (
              <div key={flag.id} className="bg-card border border-amber-500/20 rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">
                      Flagged by{' '}
                      <span className="font-semibold text-amber-400">
                        {flag.flagger.yorubaName ?? flag.flagger.name}
                      </span>
                      {flag.flagger.verified && <span className="text-highlight ml-1">✓</span>}
                      {' · '}{new Date(flag.createdAt).toLocaleDateString()}
                    </p>
                    <span className="text-xs text-muted-foreground">in thread: <em>{flag.post.thread.title}</em></span>
                  </div>
                  {flag.status === 'REVIEWED' && (
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 font-semibold">Reviewed</span>
                  )}
                </div>

                <div className="bg-muted/50 rounded-xl p-3 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Post by {flag.post.author.yorubaName ?? flag.post.author.name}
                  </p>
                  <p className="text-sm text-foreground line-clamp-3">{flag.post.content}</p>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2">
                  <p className="text-xs font-semibold text-amber-400 mb-0.5">Elder's concern:</p>
                  <p className="text-sm text-foreground">{flag.reason}</p>
                </div>

                {flag.status === 'PENDING' && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {ELDER_FLAG_ACTIONS.map(({ value, label, icon: Icon, cls }) => (
                      <button
                        key={value}
                        type="button"
                        disabled={reviewElderFlagMutation.isPending}
                        onClick={() => reviewElderFlagMutation.mutate({ id: flag.id, action: value })}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold border border-border transition-colors disabled:opacity-50 ${cls}`}
                      >
                        <Icon size={12} /> {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminForumReportsTab;
