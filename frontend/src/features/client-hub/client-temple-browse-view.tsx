import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, Search, MapPin, Globe, Star, Heart, Loader2, AlertCircle, Users, CalendarDays
} from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';

const DEMO_TEMPLES_FALLBACK: Temple[] = [
  {
    id: 'demo-1', slug: 'ioa-national-hq-abeokuta-1',
    name: 'Ìjọ Òrúnmìlà Adúláwọ National HQ', yorubaName: 'IOA National HQ',
    description: 'National Headquarters and governing body of Ijo Orunmila Adulawo worldwide. Incorporated Trustees — CAC/IT/NO 446.',
    location: 'Agbeloba, Abẹòkúta, Ogun State', website: 'https://ijoorunmilaadulawo.com',
    worshipDay: 'Sunday', memberCount: 0, practitionerCount: 0,
  },
  {
    id: 'demo-2', slug: 'ifadiwura-temple-uk-london-1',
    name: 'Ifadiwura Temple UK', yorubaName: 'Ilé Ifádíwúrà UK',
    description: 'Officially registered Ifá temple in London. Company No. 14261437.',
    location: '26 Lorn Road, London, SW9 0AD', website: 'https://ifadiwuratempleukituk.org',
    worshipDay: 'Sunday', memberCount: 0, practitionerCount: 0,
  },
  {
    id: 'demo-3', slug: 'the-256-ifa-temple-lagos-1',
    name: 'The 256 Ifá Temple', description: 'Contemporary Ifá temple based in Lagos with a strong digital presence.',
    location: 'Lekki / Ajah, Lagos, Nigeria', website: 'https://the256ifa.com',
    worshipDay: 'Sunday', memberCount: 0, practitionerCount: 0,
  },
  {
    id: 'demo-4', slug: 'ijo-orunmila-adulawo-somolu-1',
    name: 'Ìjọ Òrúnmìlà Adúláwọ (Solution Temple)',
    description: 'IOA Somolu Parish — one of the major hubs in Lagos, over 55 years in operation.',
    location: '96, Apata Street, Ṣómólú, Lagos', website: 'https://ijoorunmilaadulawo.com',
    worshipDay: 'Sunday', memberCount: 0, practitionerCount: 0,
  },
  {
    id: 'demo-5', slug: 'ijo-orunmila-ogbe-alara-abeokuta-1',
    name: 'Ìjọ Òrúnmìlà Ogbè Alárá',
    description: 'Independent Ifá congregation in Abeokuta known for cultural preservation and digital outreach.',
    location: 'Abeokuta, Ogun State',
    worshipDay: 'Sunday', memberCount: 0, practitionerCount: 0,
  },
  {
    id: 'demo-6', slug: 'ile-ifa-agbaye-odogbolu-1',
    name: 'Ile Ifa Agbaye',
    description: 'International Ifá institution with branches in Nigeria and the UK (Croydon, London).',
    location: 'Odogbolu, Ogun State',
    worshipDay: 'Sunday', memberCount: 0, practitionerCount: 0,
  },
  {
    id: 'demo-7', slug: 'ijo-orunmila-adulawo-sagamu-1',
    name: 'Ìjọ Òrúnmìlà Adúláwọ', location: 'Ṣàgámù, Ogun State',
    website: 'https://ijoorunmilaadulawo.com', worshipDay: 'Sunday',
    memberCount: 0, practitionerCount: 0,
  },
  {
    id: 'demo-8', slug: 'ijo-orunmila-adulawo-ibadan-1',
    name: 'Ilé Ifá Ògúndá Méjì (Agbala Ifá)', location: 'Apata, Ìbàdàn, Oyo State',
    worshipDay: 'Saturday', memberCount: 0, practitionerCount: 0,
  },
];

interface Temple {
  id: string;
  name: string;
  yorubaName?: string;
  description?: string;
  location?: string;
  website?: string;
  rating?: number;
  slug?: string;
  worshipDay?: string;
  upcomingEventsCount?: number;
  memberCount?: number;
  practitionerCount?: number;
}

type TempleFilter = 'all' | 'following';
type WorshipDayFilter = 'all' | 'Sunday' | 'Saturday';

const ClientTempleBrowseView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<TempleFilter>('all');
  const [worshipDayFilter, setWorshipDayFilter] = useState<WorshipDayFilter>('all');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: allTemples = [], isLoading, isError, refetch } = useQuery<Temple[]>({
    queryKey: ['client-temples', searchTerm],
    queryFn: async () => {
      try {
        const res = await api.get('/temples', {
          params: searchTerm ? { search: searchTerm } : undefined,
        });
        const payload = res.data;
        return Array.isArray(payload) ? payload : (payload.temples ?? payload.data ?? []);
      } catch {
        // Demo fallback for local development / when backend is unavailable
        return DEMO_TEMPLES_FALLBACK.filter(t =>
          !searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.location?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: followedTemples = [] } = useQuery<Temple[]>({
    queryKey: ['client-temples-followed'],
    queryFn: async () => {
      const res = await api.get('/temples/followed/all');
      const payload = res.data;
      return Array.isArray(payload) ? payload : (payload.temples ?? payload.data ?? []);
    },
    staleTime: 10 * 60 * 1000,
  });

  const followedIds = new Set<string>(followedTemples.map(t => t.id));

  const followMutation = useMutation({
    mutationFn: (id: string) => api.post(`/temples/${id}/follow`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-temples-followed'] });
      toast.success('Temple followed');
    },
    onError: (err: Error) => {
      toast.error(`Failed to follow temple — ${err.message}`);
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: (id: string) => api.post(`/temples/${id}/unfollow`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-temples-followed'] });
      toast.success('Temple unfollowed');
    },
    onError: (err: Error) => {
      toast.error(`Failed to unfollow temple — ${err.message}`);
    },
  });

  const isMutating = followMutation.isPending || unfollowMutation.isPending;

  const displayedTemples = allTemples
    .filter(t => filter === 'following' ? followedIds.has(t.id) : true)
    .filter(t => worshipDayFilter === 'all' ? true : t.worshipDay === worshipDayFilter);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6 p-6">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded-xl p-6 bg-card shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-muted rounded-full h-12 w-12" />
                <div className="flex-1">
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
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold brand-font text-foreground">Temples</h1>
        <p className="text-muted-foreground text-lg mt-1">Discover and connect with traditional Ifá temples and spiritual centers</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search temples by name or location..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-border rounded-lg w-full focus:ring-2 focus:ring-highlight focus:border-highlight"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-highlight text-white' : 'bg-muted text-foreground hover:bg-muted'}`}
          >
            All Temples
          </button>
          <button
            type="button"
            onClick={() => setFilter('following')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'following' ? 'bg-highlight text-white' : 'bg-muted text-foreground hover:bg-muted'}`}
          >
            Following ({followedIds.size})
          </button>
          <button
            type="button"
            onClick={() => setWorshipDayFilter(worshipDayFilter === 'Sunday' ? 'all' : 'Sunday')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${worshipDayFilter === 'Sunday' ? 'bg-amber-500 text-white' : 'bg-muted text-foreground hover:bg-muted'}`}
          >
            <CalendarDays size={14} />
            Sundays
          </button>
          <button
            type="button"
            onClick={() => setWorshipDayFilter(worshipDayFilter === 'Saturday' ? 'all' : 'Saturday')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${worshipDayFilter === 'Saturday' ? 'bg-amber-500 text-white' : 'bg-muted text-foreground hover:bg-muted'}`}
          >
            <CalendarDays size={14} />
            Saturdays
          </button>
        </div>
      </div>

      {/* Temple Grid */}
      {displayedTemples.length === 0 ? (
        <div className="text-center py-16 bg-background rounded-xl border border-border">
          <Building2 size={48} className="mx-auto text-muted-foreground/60 mb-4" />
          <p className="text-muted-foreground font-medium text-lg">
            {filter === 'following'
              ? "You haven't followed any temples yet"
              : searchTerm
                ? `No temples match "${searchTerm}"`
                : 'No temples available yet'}
          </p>
          {filter === 'following' && (
            <p className="text-muted-foreground text-sm mt-2 mb-4">Browse all temples and click Follow to connect</p>
          )}
          {(filter === 'following' || searchTerm) && (
            <button
              type="button"
              onClick={() => { setFilter('all'); setSearchTerm(''); }}
              className="mt-4 px-4 py-2 bg-highlight text-white rounded-xl font-medium text-sm"
            >
              Browse All Temples
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedTemples.map(temple => {
            const isFollowing = followedIds.has(temple.id);
            return (
              <div key={temple.id} className="border border-border rounded-xl p-6 bg-card shadow-sm hover:shadow-md transition-shadow flex flex-col">
                {/* Temple Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="text-highlight flex-shrink-0" size={20} />
                      <h3 className="text-xl font-bold text-foreground truncate">{temple.name}</h3>
                    </div>
                    {temple.yorubaName && (
                      <p className="text-muted-foreground text-sm italic mt-0.5">{temple.yorubaName}</p>
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
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{temple.description}</p>
                )}

                {/* Meta */}
                <div className="space-y-1.5 mb-3">
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

                {/* Worship Day Badge */}
                {temple.worshipDay && (
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-800">
                      <CalendarDays size={11} />
                      {temple.worshipDay}s
                    </span>
                  </div>
                )}

                {/* Stats */}
                {(temple.memberCount != null || temple.practitionerCount != null) && (
                  <div className="flex gap-4 text-center mb-4 pt-3 border-t border-border/60">
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
                    {temple.upcomingEventsCount != null && (
                      <div>
                        <p className="text-xs text-muted-foreground">Events</p>
<p className="font-semibold text-foreground">{temple.upcomingEventsCount}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-auto flex gap-2">
                  {isFollowing ? (
                    <button
                      type="button"
                      onClick={() => unfollowMutation.mutate(temple.id)}
                      disabled={isMutating}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 text-sm font-medium disabled:opacity-60 transition-colors"
                    >
                      {unfollowMutation.isPending
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Heart size={15} className="fill-current" />}
                      Following
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => followMutation.mutate(temple.id)}
                      disabled={isMutating}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-highlight text-white rounded-lg hover:bg-yellow-600 text-sm font-medium disabled:opacity-60 transition-colors"
                    >
                      {followMutation.isPending
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Heart size={15} />}
                      Follow
                    </button>
                  )}
                  {temple.slug && (
                    <button
                      type="button"
                      onClick={() => navigate(`/temples/${temple.slug}`)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-muted text-foreground rounded-lg hover:bg-muted text-sm transition-colors"
                    >
                      <Users size={15} /> View
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientTempleBrowseView;
