import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, Check, X, Users } from 'lucide-react';
import { FeatureHeader } from '@/shared/components/feature-header';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';
import { isDevModeActive } from '@/shared/utils/dev-mode';

// COMMUNITY_BACKLOG.md FOR-Q2: Community Member Directory
interface DirectoryMember {
  id: string;
  name: string;
  yorubaName?: string;
  role: string;
  avatar?: string;
  bio?: string;
  interests: string[];
  dialectPreference?: string;
  culturalLevel: string;
  slug?: string;
}

interface ConnectionPeer {
  id: string;
  name: string;
  yorubaName?: string;
  avatar?: string;
  role: string;
}

interface ConnectionRequestItem {
  id: string;
  status: string;
  message?: string;
  createdAt: string;
  fromUser?: ConnectionPeer;
  toUser?: ConnectionPeer;
}

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'CLIENT', label: 'Seeker' },
  { value: 'BABALAWO', label: 'Babalawo' },
  { value: 'VENDOR', label: 'Vendor' },
];

const MemberDirectoryView: React.FC = () => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'browse' | 'connections'>('browse');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [composingId, setComposingId] = useState<string | null>(null);

  const { data: members = [], isLoading } = useQuery<DirectoryMember[]>({
    queryKey: ['member-directory', search, role],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search.length >= 2) params.append('search', search);
      if (role) params.append('role', role);
      const res = await api.get(`/users/directory?${params.toString()}`);
      return res.data || [];
    },
    enabled: tab === 'browse' && !isDevModeActive(),
  });

  const { data: connections } = useQuery<{ sent: ConnectionRequestItem[]; received: ConnectionRequestItem[] }>({
    queryKey: ['my-connections'],
    queryFn: async () => (await api.get('/users/directory/connections')).data,
    enabled: !isDevModeActive(),
  });

  const pendingReceivedCount = connections?.received.filter((r) => r.status === 'PENDING').length || 0;

  const sendRequest = useMutation({
    mutationFn: async (memberId: string) =>
      api.post(`/users/directory/connect/${memberId}`, { message: messageDrafts[memberId] || undefined }),
    onSuccess: () => {
      success('Connection request sent');
      queryClient.invalidateQueries({ queryKey: ['my-connections'] });
      setComposingId(null);
    },
    onError: (err: any) => {
      error(err?.response?.data?.error?.userMessage || 'Could not send connection request');
    },
  });

  const respond = useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) =>
      api.patch(`/users/directory/connections/${id}`, { accept }),
    onSuccess: (_data, variables) => {
      success(variables.accept ? 'Connection accepted' : 'Request declined');
      queryClient.invalidateQueries({ queryKey: ['my-connections'] });
    },
    onError: () => error('Could not update connection request'),
  });

  return (
    <div className="py-6 animate-in fade-in duration-500">
      <FeatureHeader
        feature="community"
        title="Member Directory"
        subtitle="Find fellow seekers, practitioners, and vendors who've opted in to connect."
        icon={Users}
      />

      <div className="mb-6 flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setTab('browse')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'browse' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Browse
        </button>
        <button
          type="button"
          onClick={() => setTab('connections')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
            tab === 'connections' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          My Connections
          {pendingReceivedCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-highlight text-white rounded-full">
              {pendingReceivedCount}
            </span>
          )}
        </button>
      </div>

      {tab === 'browse' && (
        <>
          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm"
              />
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              aria-label="Filter by role"
              className="px-4 py-2 rounded-xl border border-border bg-background text-sm"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading members...</p>
          ) : members.length === 0 ? (
            <div className="text-center py-16 bg-muted/30 rounded-2xl border border-border">
              <Users size={48} className="mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">No members found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Members appear here once they opt in via Settings → "Show me in the Community Directory."
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <div key={member.id} className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-highlight/20 flex items-center justify-center text-highlight font-bold flex-shrink-0 overflow-hidden">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        (member.yorubaName || member.name)[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground text-sm truncate">{member.yorubaName || member.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {member.role}
                      </span>
                    </div>
                  </div>
                  {member.bio && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{member.bio}</p>}
                  {member.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {member.interests.slice(0, 4).map((interest) => (
                        <span key={interest} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}
                  {composingId === member.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={messageDrafts[member.id] || ''}
                        onChange={(e) => setMessageDrafts((prev) => ({ ...prev, [member.id]: e.target.value }))}
                        placeholder="Add a short note (optional)"
                        rows={2}
                        className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-xs resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => sendRequest.mutate(member.id)}
                          disabled={sendRequest.isPending}
                          className="flex-1 px-3 py-1.5 bg-highlight text-foreground rounded-lg text-xs font-bold hover:bg-secondary transition-colors disabled:opacity-50"
                        >
                          Send Request
                        </button>
                        <button
                          type="button"
                          onClick={() => setComposingId(null)}
                          className="px-3 py-1.5 text-muted-foreground text-xs hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setComposingId(member.id)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-highlight/10 text-highlight rounded-lg text-xs font-bold hover:bg-highlight/20 transition-colors"
                    >
                      <UserPlus size={14} /> Connect
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'connections' && (
        <div className="space-y-8">
          <div>
            <h3 className="font-bold text-foreground mb-3">Received</h3>
            {(connections?.received.length || 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No connection requests received yet.</p>
            ) : (
              <div className="space-y-2">
                {connections?.received.map((req) => (
                  <div key={req.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {req.fromUser?.yorubaName || req.fromUser?.name}
                        <span className="text-xs text-muted-foreground ml-2">({req.fromUser?.role})</span>
                      </p>
                      {req.message && <p className="text-xs text-muted-foreground mt-1">"{req.message}"</p>}
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                        req.status === 'ACCEPTED' ? 'bg-green-500/10 text-green-600' :
                        req.status === 'DECLINED' ? 'bg-muted text-muted-foreground' :
                        'bg-highlight/10 text-highlight'
                      }`}>{req.status}</span>
                    </div>
                    {req.status === 'PENDING' && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => respond.mutate({ id: req.id, accept: true })}
                          className="p-1.5 rounded-lg text-green-600 bg-green-500/10 hover:bg-green-500/20"
                          title="Accept"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => respond.mutate({ id: req.id, accept: false })}
                          className="p-1.5 rounded-lg text-destructive bg-destructive/10 hover:bg-destructive/20"
                          title="Decline"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-bold text-foreground mb-3">Sent</h3>
            {(connections?.sent.length || 0) === 0 ? (
              <p className="text-sm text-muted-foreground">You haven't sent any connection requests yet.</p>
            ) : (
              <div className="space-y-2">
                {connections?.sent.map((req) => (
                  <div key={req.id} className="bg-card border border-border rounded-xl p-4">
                    <p className="text-sm font-medium text-foreground">
                      {req.toUser?.yorubaName || req.toUser?.name}
                      <span className="text-xs text-muted-foreground ml-2">({req.toUser?.role})</span>
                    </p>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                      req.status === 'ACCEPTED' ? 'bg-green-500/10 text-green-600' :
                      req.status === 'DECLINED' ? 'bg-muted text-muted-foreground' :
                      'bg-highlight/10 text-highlight'
                    }`}>{req.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDirectoryView;
