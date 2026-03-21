import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Calendar, MapPin, Globe, Star, Heart, Search, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';

interface Temple {
  id: string;
  name: string;
  yorubaName?: string;
  description?: string;
  location?: string;
  website?: string;
  rating?: number;
  upcomingEventsCount?: number;
  memberCount?: number;
  practitionerCount?: number;
}

const TempleConnectionView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'affiliated'>('all');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: allTemples = [], isLoading, isError, refetch } = useQuery<Temple[]>({
    queryKey: ['temples', searchTerm],
    queryFn: async () => {
      const res = await api.get('/temples', {
        params: searchTerm ? { search: searchTerm } : undefined,
      });
      const payload = res.data;
      return Array.isArray(payload) ? payload : (payload.temples ?? payload.data ?? []);
    },
    staleTime: 30000,
  });

  const { data: followedTemples = [], refetch: refetchFollowed } = useQuery<Temple[]>({
    queryKey: ['temples-followed'],
    queryFn: async () => {
      const res = await api.get('/temples/followed/all');
      const payload = res.data;
      return Array.isArray(payload) ? payload : (payload.temples ?? payload.data ?? []);
    },
    staleTime: 30000,
  });

  const followedIds = new Set<string>(followedTemples.map(t => t.id));

  const followMutation = useMutation({
    mutationFn: (id: string) => api.post(`/temples/${id}/follow`),
    onSuccess: () => {
      refetchFollowed();
      queryClient.invalidateQueries({ queryKey: ['temples-followed'] });
      toast.success('Temple followed');
    },
    onError: (err: Error) => {
      toast.error(`Failed to follow temple — ${err.message}`);
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: (id: string) => api.post(`/temples/${id}/unfollow`),
    onSuccess: () => {
      refetchFollowed();
      queryClient.invalidateQueries({ queryKey: ['temples-followed'] });
      toast.success('Temple unfollowed');
    },
    onError: (err: Error) => {
      toast.error(`Failed to unfollow temple — ${err.message}`);
    },
  });

  const displayedTemples = filter === 'affiliated'
    ? allTemples.filter(t => followedIds.has(t.id))
    : allTemples;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6 p-6">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-border rounded-xl p-6 bg-card shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-muted rounded-full h-12 w-12" />
                <div>
                  <div className="h-4 bg-muted rounded w-48 mb-2" />
                  <div className="h-3 bg-muted rounded w-32" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-100">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <p className="text-lg font-medium text-foreground mb-1">Connection error</p>
        <p className="text-muted-foreground text-sm mb-6 max-w-sm">
          Could not load temples from the server. Check your connection and try again.
        </p>
        <button type="button" onClick={() => refetch()} className="px-4 py-2 bg-highlight text-white rounded-xl font-medium">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-foreground">Temple Connection</h1>
          <p className="text-muted-foreground text-lg mt-1">Connect with traditional temples and spiritual centers</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search temples..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-border rounded-lg w-full md:w-64 focus:ring-2 focus:ring-highlight focus:border-highlight bg-muted/50 text-foreground"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-highlight text-white' : 'bg-muted text-foreground hover:bg-muted/80'}`}
          >
            All Temples
          </button>
          <button
            type="button"
            onClick={() => setFilter('affiliated')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'affiliated' ? 'bg-highlight text-white' : 'bg-muted text-foreground hover:bg-muted/80'}`}
          >
            Affiliated ({followedIds.size})
          </button>
        </div>
      </div>

      {displayedTemples.length === 0 ? (
        <div className="text-center py-16 bg-muted/50 rounded-xl border border-border">
          <Building2 size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium">
            {filter === 'affiliated' ? 'No affiliated temples yet' : 'No temples found'}
          </p>
          {filter === 'affiliated' && (
            <p className="text-muted-foreground text-sm mt-1">Join a temple from the All Temples list</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedTemples.map(temple => {
            const isAffiliated = followedIds.has(temple.id);
            const isMutating = followMutation.isPending || unfollowMutation.isPending;

            return (
              <div key={temple.id} className="border border-border rounded-xl p-6 bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="text-highlight flex-shrink-0" size={20} />
                      <h3 className="text-xl font-bold text-foreground truncate">{temple.name}</h3>
                    </div>
                    {temple.yorubaName && (
                      <p className="text-muted-foreground text-sm italic mt-1">{temple.yorubaName}</p>
                    )}
                  </div>
                  {temple.rating != null && (
                    <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/30 px-2 py-1 rounded-full flex-shrink-0 ml-2">
                      <Star size={13} className="text-yellow-500 dark:text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">{temple.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {temple.description && (
                  <p className="mt-4 text-muted-foreground text-sm line-clamp-2">{temple.description}</p>
                )}

                <div className="mt-4 space-y-1.5">
                  {temple.location && (
                    <div className="flex items-center text-muted-foreground text-sm">
                      <MapPin size={13} className="mr-2 flex-shrink-0" />
                      <span>{temple.location}</span>
                    </div>
                  )}
                  {temple.website && (
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Globe size={13} className="mr-2 flex-shrink-0" />
                      <span className="truncate">{temple.website}</span>
                    </div>
                  )}
                </div>

                {(temple.upcomingEventsCount != null || temple.practitionerCount != null || temple.memberCount != null) && (
                  <div className="mt-4 pt-4 border-t border-border/60 grid grid-cols-3 gap-2 text-center">
                    {temple.upcomingEventsCount != null && (
                      <div>
                        <p className="text-xs text-muted-foreground">Events</p>
                        <p className="font-semibold text-foreground">{temple.upcomingEventsCount}</p>
                      </div>
                    )}
                    {temple.practitionerCount != null && (
                      <div>
                        <p className="text-xs text-muted-foreground">Practitioners</p>
                        <p className="font-semibold text-foreground">{temple.practitionerCount}</p>
                      </div>
                    )}
                    {temple.memberCount != null && (
                      <div>
                        <p className="text-xs text-muted-foreground">Members</p>
                        <p className="font-semibold text-foreground">{temple.memberCount}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-5 flex gap-2">
                  {isAffiliated ? (
                    <button
                      type="button"
                      onClick={() => unfollowMutation.mutate(temple.id)}
                      disabled={isMutating}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 text-sm font-medium disabled:opacity-60"
                    >
                      {unfollowMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Heart size={15} className="fill-current" />}
                      Connected
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => followMutation.mutate(temple.id)}
                      disabled={isMutating}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-highlight text-white rounded-lg hover:bg-yellow-600 text-sm font-medium disabled:opacity-60"
                    >
                      {followMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Heart size={15} />}
                      Join Temple
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate('/events')}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 text-sm"
                  >
                    <Calendar size={15} /> Events
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TempleConnectionView;
