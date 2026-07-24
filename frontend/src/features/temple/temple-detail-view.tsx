import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Phone, Mail, Globe, Users, Calendar, CheckCircle, Building2, ArrowLeft, Settings, Heart, HeartOff, CalendarDays, Instagram, Youtube, Facebook, Award } from 'lucide-react';
import { VerificationTier } from '@common';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import BabalawoProfileCard from '../babalawo/profile/babalawo-profile-card';
import BabalawoProfileModal from '@/shared/components/babalawo-profile-modal';
import { seededRandomInt } from '@/shared/utils/seeded-random';
import { isDevModeActive } from '@/shared/utils/dev-mode';
// import { DEMO_TEMPLES, getDemoUsersByRole } from '@/demo';

interface TempleDetailViewProps {
  templeSlug: string;
  onBack?: () => void;
  onSelectBabalawo?: (babalawoId: string) => void;
  onViewBabalawoProfile?: (babalawoId: string) => void;
  onManage?: () => void;
  showManageButton?: boolean;
  onSelectEvent?: (eventSlug: string) => void;
}

/**
 * Temple Detail View
 * Comprehensive temple information page
 * NOTE: Shows all babalawos, temple info, and contact details
 */
const TempleDetailView: React.FC<TempleDetailViewProps> = ({
  templeSlug,
  onBack,
  onSelectBabalawo,
  onViewBabalawoProfile,
  onManage,
  showManageButton = false,
  onSelectEvent,
}) => {
  const [selectedTier, setSelectedTier] = useState<VerificationTier | 'ALL'>('ALL');
  const [selectedBabalawoId, setSelectedBabalawoId] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch temple by slug
  const { data: temple, isLoading } = useQuery<any>({
    queryKey: ['temple', templeSlug],
    queryFn: async () => {
      const response = await api.get(`/temples/slug/${templeSlug}`);
      const data = response.data;

      // Enrich API data with mock ratings if missing
      if (data.babalawos) {
        data.babalawos = data.babalawos.map((b: any) => ({
          ...b,
          rating: b.rating || 5.0,
          reviewCount: b.reviewCount || seededRandomInt(`${b.id}-reviews`, 10, 59),
          specialties: b.interests || b.specialization || ['Ifa Divination', 'Counseling'],
        }));
      }
      return data;
    },
  });

  // Follow/Unfollow mutations
  const followMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/temples/${temple?.id}/follow`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temple', templeSlug] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/temples/${temple?.id}/unfollow`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temple', templeSlug] });
    },
  });

  // Filter babalawos by tier
  const filteredBabalawos = React.useMemo(() => {
    if (!temple?.babalawos) return [];
    if (selectedTier === 'ALL') return temple.babalawos;
    return temple.babalawos.filter((babalawo: any) => {
      const tier = babalawo.verificationApps?.[0]?.tier || babalawo.certificates?.[0]?.tier;
      return tier === selectedTier;
    });
  }, [temple?.babalawos, selectedTier]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!temple) {
    return (
      <div className="min-h-screen bg-background p-6">
        <button onClick={onBack} type="button" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 font-semibold">
          <ArrowLeft size={20} /> Back to Temples
        </button>
        <p className="text-muted-foreground">Temple not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ── */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        {temple.bannerImage ? (
          <img src={temple.bannerImage} alt={temple.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-stone-900 via-stone-800 to-primary/80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/50 to-transparent" />

        {/* Top nav */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button onClick={onBack} type="button"
            className="flex items-center gap-2 text-white/90 hover:text-white bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-semibold transition-all">
            <ArrowLeft size={16} /> Back to Temples
          </button>
          {(showManageButton || (user && (user.role === 'ADMIN' || temple?.founderId === user.id))) && onManage && (
            <button onClick={onManage} type="button"
              className="flex items-center gap-2 text-white/90 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-semibold hover:bg-black/40 transition-all">
              <Settings size={16} /> Manage
            </button>
          )}
        </div>

        {/* Temple identity */}
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-10 pb-6">
          <div className="max-w-7xl mx-auto flex items-end gap-5">
            {temple.logo ? (
              <img src={temple.logo} alt={temple.name}
                className="w-20 h-20 md:w-28 md:h-28 rounded-2xl object-cover border-4 border-white/20 shadow-2xl flex-shrink-0" />
            ) : (
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-primary/30 backdrop-blur-sm flex items-center justify-center border-4 border-white/20 shadow-2xl flex-shrink-0">
                <Building2 size={40} className="text-highlight" />
              </div>
            )}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {temple.verified && (
                  <span className="inline-flex items-center gap-1.5 bg-highlight text-stone-900 dark:text-stone-100 text-xs font-bold px-3 py-1 rounded-full">
                    <CheckCircle size={11} /> Verified
                  </span>
                )}
                <span className="text-xs font-bold uppercase tracking-wider bg-card/10 text-white/80 px-3 py-1 rounded-full">
                  {temple.type?.replace(/_/g, ' ')}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold brand-font text-white leading-tight">{temple.name}</h1>
              {temple.yorubaName && <p className="text-highlight text-lg font-semibold mt-1">{temple.yorubaName}</p>}
            </div>
            {user && (
              <button type="button"
                onClick={() => temple.isFollowing ? unfollowMutation.mutate() : followMutation.mutate()}
                disabled={followMutation.isPending || unfollowMutation.isPending}
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg disabled:opacity-50 ${
                  temple.isFollowing ? 'bg-highlight text-stone-900 dark:text-stone-100 hover:bg-yellow-400' : 'bg-card text-stone-900 dark:text-stone-100 hover:bg-muted/60'
                }`}>
                {temple.isFollowing ? <HeartOff size={18} /> : <Heart size={18} />}
                {temple.isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Stats Bar ── */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-3 flex flex-wrap gap-5 items-center">
          {temple.city && temple.state && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin size={15} className="text-primary" />
              <span className="text-sm font-semibold">{temple.city}, {temple.state}</span>
            </div>
          )}
          {temple.foundedYear && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar size={15} className="text-primary" />
              <span className="text-sm font-semibold">Est. {temple.foundedYear}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users size={15} className="text-primary" />
            <span className="text-sm font-semibold">{temple.babalawoCount || temple._count?.babalawos || 0} Babalawos</span>
          </div>
          {temple._count?.followers !== undefined && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Heart size={15} className="text-primary" />
              <span className="text-sm font-semibold">{temple._count.followers} Followers</span>
            </div>
          )}
          {temple.worshipDay && (
            <span className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-sm font-bold px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
              <CalendarDays size={14} /> {temple.worshipDay}s
            </span>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8 space-y-6">

        {/* About */}
        {(temple.description || temple.history || temple.mission) && (
          <div className="bg-card rounded-3xl border border-border shadow-sm p-8">
            <h2 className="text-2xl font-bold brand-font text-foreground mb-5 flex items-center gap-3">
              <span className="w-1 h-7 rounded-full bg-highlight inline-block" />
              About
            </h2>
            <div className="space-y-4">
              {temple.description && <p className="text-muted-foreground leading-relaxed text-base">{temple.description}</p>}
              {temple.history && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">History</p>
                  <p className="text-muted-foreground leading-relaxed">{temple.history}</p>
                </div>
              )}
              {temple.mission && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Mission</p>
                  <p className="text-muted-foreground leading-relaxed">{temple.mission}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cultural Information */}
        {(temple.lineage || temple.tradition || temple.specialties?.length > 0) && (
          <div className="bg-card rounded-3xl border border-border shadow-sm p-8">
            <h2 className="text-2xl font-bold brand-font text-foreground mb-5 flex items-center gap-3">
              <span className="w-1 h-7 rounded-full bg-primary inline-block" />
              Cultural Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {temple.lineage && (
                <div className="bg-muted/50 rounded-2xl p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Lineage</p>
                  <p className="text-foreground font-semibold">{temple.lineage}</p>
                </div>
              )}
              {temple.tradition && (
                <div className="bg-muted/50 rounded-2xl p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Tradition</p>
                  <p className="text-foreground font-semibold">{temple.tradition}</p>
                </div>
              )}
              {temple.specialties?.length > 0 && (
                <div className="md:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Specialties</p>
                  <div className="flex flex-wrap gap-2">
                    {temple.specialties.map((s: string, i: number) => (
                      <span key={i} className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-semibold">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Babalawos */}
        <div className="bg-card rounded-3xl border border-border shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold brand-font text-foreground flex items-center gap-3">
              <span className="w-1 h-7 rounded-full bg-primary inline-block" />
              Babalawos ({filteredBabalawos.length})
            </h2>
            <select value={selectedTier} onChange={(e) => setSelectedTier(e.target.value as VerificationTier | 'ALL')}
              className="border border-border rounded-xl px-4 py-2 text-foreground bg-background text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
              aria-label="Filter babalawos by verification tier">
              <option value="ALL">All Tiers</option>
              <option value={VerificationTier.JUNIOR}>Junior</option>
              <option value={VerificationTier.SENIOR}>Senior</option>
              <option value={VerificationTier.MASTER}>Master</option>
            </select>
          </div>
          {filteredBabalawos.length === 0 ? (
            <div className="text-center py-12">
              <Users size={40} className="mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground font-semibold">No babalawos registered yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBabalawos.map((babalawo: any) => (
                <BabalawoProfileCard key={babalawo.id} babalawo={babalawo}
                  onClick={() => setSelectedBabalawoId(babalawo.id)}
                  onBookSession={(id) => setSelectedBabalawoId(id)} />
              ))}
            </div>
          )}
          <BabalawoProfileModal babalawoId={selectedBabalawoId || ''} isOpen={!!selectedBabalawoId}
            onClose={() => setSelectedBabalawoId(null)}
            onRequestConsultation={(id) => { setSelectedBabalawoId(null); onSelectBabalawo?.(id); }}
            onViewProfile={(id) => { setSelectedBabalawoId(null); onViewBabalawoProfile?.(id); }} />
        </div>

        {/* Contact & Links */}
        {(temple.address || temple.phone || temple.email || temple.website || temple.socialLinks) && (
          <div className="bg-card rounded-3xl border border-border shadow-sm p-8">
            <h2 className="text-2xl font-bold brand-font text-foreground mb-6 flex items-center gap-3">
              <span className="w-1 h-7 rounded-full bg-amber-400 inline-block" />
              Contact & Links
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {temple.address && (
                <div className="flex items-start gap-3 bg-muted/50 rounded-2xl p-4">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin size={17} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Address</p>
                    <p className="text-foreground font-semibold text-sm">{temple.address}</p>
                    {temple.country && <p className="text-muted-foreground text-xs mt-0.5">{temple.country}</p>}
                  </div>
                </div>
              )}
              {temple.phone && (
                <div className="flex items-start gap-3 bg-muted/50 rounded-2xl p-4">
                  <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Phone size={17} className="text-green-700 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Phone</p>
                    <a href={`tel:${temple.phone}`} className="text-green-700 dark:text-green-400 font-bold text-sm hover:underline">{temple.phone}</a>
                  </div>
                </div>
              )}
              {temple.email && (
                <div className="flex items-start gap-3 bg-muted/50 rounded-2xl p-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail size={17} className="text-blue-700 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Email</p>
                    <a href={`mailto:${temple.email}`} className="text-blue-700 dark:text-blue-400 font-bold text-sm hover:underline break-all">{temple.email}</a>
                  </div>
                </div>
              )}
              {temple.website && (
                <div className="flex items-start gap-3 bg-muted/50 rounded-2xl p-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Globe size={17} className="text-amber-700 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Website</p>
                    <a href={temple.website} target="_blank" rel="noopener noreferrer"
                      className="text-amber-700 dark:text-amber-400 font-bold text-sm hover:underline break-all">
                      {temple.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
              )}
              {temple.socialLinks?.leadPriest && (
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 border border-amber-100">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users size={17} className="text-amber-700 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Lead Priest</p>
                    <p className="text-foreground font-bold text-sm">{temple.socialLinks.leadPriest}</p>
                  </div>
                </div>
              )}
              {temple.socialLinks?.registrationNumber && (
                <div className="flex items-start gap-3 bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Award size={17} className="text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Official Registration</p>
                    <p className="text-emerald-800 dark:text-emerald-200 font-bold text-sm">{temple.socialLinks.registrationNumber}</p>
                  </div>
                </div>
              )}
            </div>
            {(temple.socialLinks?.instagram || temple.socialLinks?.facebook || temple.socialLinks?.youtube || temple.socialLinks?.eventbrite) && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Social Media</p>
                <div className="flex flex-wrap gap-3">
                  {temple.socialLinks?.instagram && (
                    <a href={`https://instagram.com/${temple.socialLinks.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all">
                      <Instagram size={15} /> {temple.socialLinks.instagram}
                    </a>
                  )}
                  {temple.socialLinks?.facebook && (
                    <a href={`https://facebook.com/search/pages?q=${encodeURIComponent(temple.socialLinks.facebook)}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all">
                      <Facebook size={15} /> {temple.socialLinks.facebook}
                    </a>
                  )}
                  {temple.socialLinks?.youtube && (
                    <a href={`https://youtube.com/results?search_query=${encodeURIComponent(temple.socialLinks.youtube)}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all">
                      <Youtube size={15} /> {temple.socialLinks.youtube}
                    </a>
                  )}
                  {temple.socialLinks?.eventbrite && (
                    <a href={`https://eventbrite.com/o/${encodeURIComponent(temple.socialLinks.eventbrite)}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all">
                      <Calendar size={15} /> {temple.socialLinks.eventbrite}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Events */}
        <div className="bg-card rounded-3xl border border-border shadow-sm p-8">
          <h2 className="text-2xl font-bold brand-font text-foreground mb-6 flex items-center gap-3">
            <span className="w-1 h-7 rounded-full bg-highlight inline-block" />
            Upcoming Events
          </h2>
          <TempleEventsList templeId={temple.id} onSelectEvent={onSelectEvent} />
        </div>

        {/* Gallery */}
        {temple.images?.length > 0 && (
          <div className="bg-card rounded-3xl border border-border shadow-sm p-8">
            <h2 className="text-2xl font-bold brand-font text-foreground mb-6 flex items-center gap-3">
              <span className="w-1 h-7 rounded-full bg-primary inline-block" />
              Gallery
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {temple.images.map((image: string, index: number) => (
                <img key={index} src={image} alt={`${temple.name} - ${index + 1}`}
                  className="w-full h-48 object-cover rounded-2xl hover:scale-105 transition-transform cursor-pointer shadow-sm" />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// Helper Component for Events List to keep main component clean
type TempleEvent = {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  startDate: string;
  location: string;
  image?: string;
};

const TempleEventsList: React.FC<{ templeId: string; onSelectEvent?: (eventId: string) => void }> = ({ templeId, onSelectEvent }) => {
  const { data: events = [], isLoading } = useQuery<TempleEvent[]>({
    queryKey: ['events', 'temple', templeId],
    queryFn: async () => {
      const response = await api.get('/events', {
        params: {
          templeId,
          status: 'UPCOMING',
          limit: 3,
        },
      });
      return response.data as TempleEvent[];
    },
    enabled: !!templeId && !isDevModeActive(),
  });

  if (isLoading) {
    return <div className="h-20 animate-pulse bg-muted rounded-2xl"></div>;
  }

  if (events.length === 0) {
    return (
      <div className="bg-muted/50 rounded-2xl p-8 text-center border border-border/60">
        <Calendar size={32} className="mx-auto text-muted-foreground/40 mb-2" />
        <p className="text-muted-foreground font-semibold">No upcoming events scheduled.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event: any) => (
        <div
          key={event.id}
          onClick={() => onSelectEvent?.(event.slug)}
          className="bg-muted/50 hover:bg-amber-50 dark:bg-amber-950/30 border border-border/60 hover:border-amber-200 dark:border-amber-800 transition-all rounded-2xl overflow-hidden cursor-pointer group shadow-sm"
        >
          {event.image ? (
            <img src={event.image} alt={event.title} className="w-full h-40 object-cover" />
          ) : (
            <div className="w-full h-40 bg-gradient-to-br from-amber-100 to-stone-100 flex items-center justify-center">
              <Calendar size={40} className="text-amber-300" />
            </div>
          )}
          <div className="p-5">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs uppercase tracking-wider font-bold mb-2">
              <span className="bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-lg">{event.type}</span>
              <span>•</span>
              <span>{new Date(event.startDate).toLocaleDateString()}</span>
            </div>
            <h3 className="text-lg font-bold brand-font text-foreground mb-1.5 group-hover:text-primary transition-colors">
              {event.title}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
              {event.description}
            </p>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
              <MapPin size={13} />
              <span>{event.location}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TempleDetailView;
