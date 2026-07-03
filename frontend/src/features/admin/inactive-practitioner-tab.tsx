import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, RefreshCw, MessageSquare, PauseCircle, XCircle, PlayCircle, Clock } from 'lucide-react';
import api from '@/lib/api';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { useToast } from '@/shared/components/toast';

interface InactivePractitioner {
  id: string;
  name: string;
  email: string;
  role: string;
  isOnLeave: boolean;
  isDeactivated: boolean;
  trustScore: number;
  createdAt: string;
}

type FilterMode = 'all' | 'on-leave' | 'deactivated' | 'active';

const InactivePractitionerTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [filter, setFilter] = useState<FilterMode>('all');
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [daysThreshold, setDaysThreshold] = useState(14);

  const { data: practitioners = [], isLoading, refetch } = useQuery<InactivePractitioner[]>({
    queryKey: ['admin', 'inactive-practitioners', daysThreshold],
    queryFn: async () => {
      const res = await api.get(`/admin/inactive-practitioners?daysThreshold=${daysThreshold}`);
      return res.data;
    },
  });

  const reengageMutation = useMutation({
    mutationFn: async ({ practitionerId, action, message }: { practitionerId: string; action: string; message?: string }) => {
      const res = await api.post(`/admin/practitioners/${practitionerId}/re-engagement-action`, { action, message });
      return res.data;
    },
    onSuccess: (_, vars) => {
      const label = vars.action === 'send-message' ? 'Message sent' : vars.action === 'mark-on-leave' ? 'Marked on leave' : 'Listing deactivated';
      success(label);
      if (vars.action === 'send-message') {
        setMessages(prev => ({ ...prev, [vars.practitionerId]: '' }));
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'inactive-practitioners'] });
    },
    onError: () => toastError('Action failed — please try again'),
  });

  const reactivateMutation = useMutation({
    mutationFn: async (practitionerId: string) => {
      const res = await api.post(`/admin/practitioners/${practitionerId}/reactivate-listing`);
      return res.data;
    },
    onSuccess: () => {
      success('Listing reactivated');
      queryClient.invalidateQueries({ queryKey: ['admin', 'inactive-practitioners'] });
    },
    onError: () => toastError('Reactivation failed'),
  });

  const filtered = practitioners.filter(p => {
    if (filter === 'on-leave') return p.isOnLeave;
    if (filter === 'deactivated') return p.isDeactivated;
    if (filter === 'active') return !p.isOnLeave && !p.isDeactivated;
    return true;
  });

  const counts = {
    all: practitioners.length,
    active: practitioners.filter(p => !p.isOnLeave && !p.isDeactivated).length,
    'on-leave': practitioners.filter(p => p.isOnLeave).length,
    deactivated: practitioners.filter(p => p.isDeactivated).length,
  };

  const statusBadge = (p: InactivePractitioner) => {
    if (p.isDeactivated) return <Badge variant="destructive">Deactivated</Badge>;
    if (p.isOnLeave) return <Badge variant="secondary">On Leave</Badge>;
    return <Badge variant="outline">Active (Inactive)</Badge>;
  };

  const isPending = (id: string, action: string) =>
    reactivateMutation.isPending && action === 'reactivate'
      ? false
      : reengageMutation.isPending && reengageMutation.variables?.practitionerId === id && reengageMutation.variables?.action === action;

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground">
        <RefreshCw size={24} className="mx-auto mb-2 animate-spin" />
        Loading inactive practitioners…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle size={20} className="text-warning" />
              Inactive Practitioner Re-engagement
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Practitioners with no bookings in the last {daysThreshold} days
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-muted-foreground" />
              <select
                value={daysThreshold}
                onChange={e => setDaysThreshold(Number(e.target.value))}
                aria-label="Inactivity threshold in days"
                className="text-sm border border-border bg-background text-foreground rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
              </select>
            </div>
            <Button variant="outline" onClick={() => refetch()} className="text-sm">
              <RefreshCw size={14} className="mr-1.5" /> Refresh
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {(['all', 'active', 'on-leave', 'deactivated'] as FilterMode[]).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-xl p-3 text-left border transition-colors ${
                filter === f
                  ? 'border-highlight bg-highlight/10'
                  : 'border-border bg-background hover:bg-muted/50'
              }`}
            >
              <div className="text-xl font-bold text-foreground">{counts[f]}</div>
              <div className="text-xs text-muted-foreground capitalize mt-0.5">
                {f === 'all' ? 'Total' : f === 'on-leave' ? 'On Leave' : f === 'active' ? 'Active' : 'Deactivated'}
              </div>
            </button>
          ))}
        </div>

        {/* Practitioner list */}
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <PlayCircle size={32} className="mx-auto mb-2 opacity-40" />
            No practitioners match this filter
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(p => (
              <div key={p.id} className="border border-border rounded-xl p-4 bg-background">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{p.name}</span>
                      {statusBadge(p)}
                      <Badge variant="outline" className="text-xs">
                        Trust {Math.round(p.trustScore * 100)}%
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">{p.email}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Member since {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0 min-w-0 sm:min-w-[320px]">
                    {/* Send message */}
                    <div className="flex gap-2">
                      <Input
                        value={messages[p.id] ?? ''}
                        onChange={e => setMessages(prev => ({ ...prev, [p.id]: e.target.value }))}
                        placeholder="Re-engagement message…"
                        className="text-sm h-8"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && messages[p.id]?.trim()) {
                            reengageMutation.mutate({ practitionerId: p.id, action: 'send-message', message: messages[p.id] });
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => reengageMutation.mutate({ practitionerId: p.id, action: 'send-message', message: messages[p.id] })}
                        disabled={!messages[p.id]?.trim() || isPending(p.id, 'send-message')}
                        className="shrink-0"
                      >
                        <MessageSquare size={14} />
                      </Button>
                    </div>

                    {/* Status actions */}
                    <div className="flex gap-2 flex-wrap">
                      {!p.isOnLeave && !p.isDeactivated && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reengageMutation.mutate({ practitionerId: p.id, action: 'mark-on-leave' })}
                            disabled={isPending(p.id, 'mark-on-leave')}
                            className="text-xs"
                          >
                            <PauseCircle size={13} className="mr-1" />
                            Mark On Leave
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reengageMutation.mutate({ practitionerId: p.id, action: 'deactivate-listing' })}
                            disabled={isPending(p.id, 'deactivate-listing')}
                            className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                          >
                            <XCircle size={13} className="mr-1" />
                            Deactivate
                          </Button>
                        </>
                      )}
                      {(p.isOnLeave || p.isDeactivated) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reactivateMutation.mutate(p.id)}
                          disabled={reactivateMutation.isPending}
                          className="text-xs text-green-600 border-green-600/30 hover:bg-green-500/10"
                        >
                          <PlayCircle size={13} className="mr-1" />
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InactivePractitionerTab;
