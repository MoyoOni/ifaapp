import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Phone, Mail, Globe, Users, Calendar, CheckCircle, Building2, ArrowLeft, Settings, Heart, HeartOff } from 'lucide-react';
import { VerificationTier } from '@common';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { DEMO_EVENTS, DEMO_TEMPLES, DEMO_USERS } from '@/demo';
import BabalawoProfileCard from '../babalawo/profile/babalawo-profile-card';
import BabalawoProfileModal from '@/shared/components/babalawo-profile-modal';
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
      try {
        const response = await api.get(`/temples/slug/${templeSlug}`);
        const data = response.data;

        // Enrich API data with mock ratings if missing
        if (data.babalawos) {
          data.babalawos = data.babalawos.map((b: any) => ({
            ...b,
            rating: b.rating || 5.0,
            reviewCount: b.reviewCount || Math.floor(Math.random() * 50) + 10,
            specialties: b.interests || b.specialization || ['Ifa Divination', 'Counseling'] // Fallback
          }));
        }
        return data;
      } catch (error) {
        if (!isDemoMode) throw error;

        logger.error('Temple API fetch failed, using demo data', error);
        const demoTemple = Object.values(DEMO_TEMPLES).find((temple) => temple.slug === templeSlug);
        if (!demoTemple) {
          return null;
        }

        const [city, state] = (demoTemple.location || '').split(',').map((part) => part.trim());
        const demoBabalawos = (demoTemple.babalawos || [])
          .map((id) => DEMO_USERS[id as keyof typeof DEMO_USERS])
          .filter(Boolean)
          .map((user) => ({
            id: user.id,
            name: user.name,
            yorubaName: user.yorubaName,
            avatar: user.avatar,
            verified: (user as any).verified ?? true,
            rating: (user as any).rating || 5.0,
            reviewCount: (user as any).reviewCount || Math.floor(Math.random() * 50) + 10,
            specialties: (user as any).services?.map((service: any) => service.title) || (user as any).interests || ['Ifa Divination'],
            verificationApps: [{ tier: 'MASTER' }]
          }));

        return {
          id: demoTemple.id,
          name: demoTemple.name,
          yorubaName: demoTemple.yorubaName,
          slug: demoTemple.slug,
          logo: demoTemple.logo,
          verified: demoTemple.verified,
          description: demoTemple.description,
          foundedYear: demoTemple.founded ? parseInt(demoTemple.founded, 10) : undefined,
          type: 'IFA',
          city: city || '',
          state: state || '',
          address: demoTemple.location,
          babalawos: demoBabalawos,
          babalawoCount: demoBabalawos.length,
          _count: {
            babalawos: demoBabalawos.length,
            followers: 0
          },
          isFollowing: false,
          specialties: ['Ifa Divination', 'Community Guidance'],
          socialLinks: {}
        };
      }
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
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!temple) {
    return (
      <div className="min-h-screen bg-background text-white p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted hover:text-white mb-6"
          >
            <ArrowLeft size={20} />
            Back to Temples
          </button>
          <p className="text-muted">Temple not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Hero Section */}
      <div className="relative">
        {temple.bannerImage ? (
          <img
            src={temple.bannerImage}
            alt={temple.name}
            className="w-full h-64 md:h-96 object-cover"
          />
        ) : (
          <div className="w-full h-64 md:h-96 bg-gradient-to-br from-highlight/20 to-muted/20 flex items-center justify-center">
            <Building2 size={64} className="text-highlight/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground to-transparent"></div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-white/80 hover:text-white backdrop-blur-sm bg-black/20 rounded-lg px-4 py-2"
              >
                <ArrowLeft size={20} />
                Back to Temples
              </button>
              {(showManageButton || (user && (user.role === 'ADMIN' || temple?.founderId === user.id))) && onManage && (
                <button
                  onClick={onManage}
                  className="flex items-center gap-2 text-white/80 hover:text-white backdrop-blur-sm bg-highlight/20 border border-highlight/30 rounded-lg px-4 py-2"
                >
                  <Settings size={18} />
                  Manage Temple
                </button>
              )}
            </div>

            <div className="flex items-start gap-6">
              {temple.logo ? (
                <img
                  src={temple.logo}
                  alt={temple.name}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white/20 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-highlight/20 flex items-center justify-center border-4 border-white/20 shadow-lg">
                  <Building2 size={48} className="text-highlight" />
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold brand-font text-white mb-2">
                      {temple.name}
                    </h1>
                    {temple.yorubaName && (
                      <p className="text-highlight text-xl md:text-2xl">{temple.yorubaName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {temple.verified && (
                      <div className="flex items-center gap-2 bg-highlight/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-highlight/30">
                        <CheckCircle size={24} className="text-highlight" />
                        <span className="font-semibold text-highlight">Verified Temple</span>
                      </div>
                    )}
                    {user && (
                      <button
                        onClick={() => {
                          if (temple.isFollowing) {
                            unfollowMutation.mutate();
                          } else {
                            followMutation.mutate();
                          }
                        }}
                        disabled={followMutation.isPending || unfollowMutation.isPending}
                        className={`flex items-center gap-2 backdrop-blur-sm rounded-lg px-4 py-2 border transition-all ${temple.isFollowing
                          ? 'bg-highlight/20 border-highlight/30 text-highlight hover:bg-highlight/30'
                          : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                          } disabled:opacity-50`}
                      >
                        {temple.isFollowing ? (
                          <>
                            <HeartOff size={20} />
                            <span>Unfollow</span>
                          </>
                        ) : (
                          <>
                            <Heart size={20} />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Info */}
                <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm md:text-base">
                  {temple.city && temple.state && (
                    <div className="flex items-center gap-2">
                      <MapPin size={18} />
                      <span>{temple.city}, {temple.state}</span>
                    </div>
                  )}
                  {temple.foundedYear && (
                    <div className="flex items-center gap-2">
                      <Calendar size={18} />
                      <span>Founded {temple.foundedYear}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users size={18} />
                    <span>{temple.babalawoCount || temple._count?.babalawos || 0} Babalawo{temple.babalawoCount !== 1 ? 's' : ''}</span>
                  </div>
                  {temple._count?.followers !== undefined && (
                    <div className="flex items-center gap-2">
                      <Heart size={18} />
                      <span>{temple._count.followers} Follower{temple._count.followers !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  <span className="text-xs uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full">
                    {temple.type.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-12">
        {/* About Section */}
        {(temple.description || temple.history || temple.mission) && (
          <section>
            <h2 className="text-3xl font-bold brand-font text-highlight mb-6">About</h2>
            <div className="space-y-6">
              {temple.description && (
                <div>
                  <h3 className="text-xl font-semibold mb-2">Description</h3>
                  <p className="text-muted leading-relaxed">{temple.description}</p>
                </div>
              )}
              {temple.history && (
                <div>
                  <h3 className="text-xl font-semibold mb-2">History</h3>
                  <p className="text-muted leading-relaxed">{temple.history}</p>
                </div>
              )}
              {temple.mission && (
                <div>
                  <h3 className="text-xl font-semibold mb-2">Mission</h3>
                  <p className="text-muted leading-relaxed">{temple.mission}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Cultural Information */}
        {(temple.lineage || temple.tradition || temple.specialties?.length) && (
          <section>
            <h2 className="text-3xl font-bold brand-font text-highlight mb-6">Cultural Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {temple.lineage && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Lineage</h3>
                  <p className="text-muted">{temple.lineage}</p>
                </div>
              )}
              {temple.tradition && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Tradition</h3>
                  <p className="text-muted">{temple.tradition}</p>
                </div>
              )}
              {temple.specialties && temple.specialties.length > 0 && (
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {temple.specialties.map((specialty: string, index: number) => (
                      <span
                        key={index}
                        className="bg-highlight/20 text-highlight px-4 py-2 rounded-lg text-sm"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Babalawos Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold brand-font text-highlight">
              Babalawos ({filteredBabalawos.length})
            </h2>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value as VerificationTier | 'ALL')}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-highlight"
              aria-label="Filter babalawos by verification tier"
            >
              <option value="ALL">All Tiers</option>
              <option value={VerificationTier.JUNIOR}>Junior</option>
              <option value={VerificationTier.SENIOR}>Senior</option>
              <option value={VerificationTier.MASTER}>Master</option>
            </select>
          </div>

          {filteredBabalawos.length === 0 ? (
            <p className="text-muted">No babalawos found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBabalawos.map((babalawo: any) => (
                <BabalawoProfileCard
                  key={babalawo.id}
                  babalawo={babalawo}
                  onClick={() => setSelectedBabalawoId(babalawo.id)}
                  onBookSession={(id) => setSelectedBabalawoId(id)}
                />
              ))}
            </div>
          )}

          {/* Babalawo Profile Modal - stays within temple context */}
          <BabalawoProfileModal
            babalawoId={selectedBabalawoId || ''}
            isOpen={!!selectedBabalawoId}
            onClose={() => setSelectedBabalawoId(null)}
            onRequestConsultation={(id) => {
              setSelectedBabalawoId(null);
              onSelectBabalawo?.(id);
            }}
            onViewProfile={(id) => {
              setSelectedBabalawoId(null);
              onViewBabalawoProfile?.(id);
            }}
            onMessage={(_id: string) => {
              setSelectedBabalawoId(null);
              // Navigate to messages with this babalawo
              window.location.href = '/messages';
            }}
          />
        </section>

        {/* Contact Section */}
        {(temple.address || temple.phone || temple.email || temple.website || temple.socialLinks) && (
          <section>
            <h2 className="text-3xl font-bold brand-font text-highlight mb-6">Contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {temple.address && (
                <div className="flex items-start gap-3">
                  <MapPin size={20} className="text-highlight mt-1" />
                  <div>
                    <p className="font-semibold mb-1">Address</p>
                    <p className="text-muted">{temple.address}</p>
                    {temple.city && temple.state && (
                      <p className="text-muted">{temple.city}, {temple.state}</p>
                    )}
                    {temple.country && (
                      <p className="text-muted">{temple.country}</p>
                    )}
                  </div>
                </div>
              )}
              {temple.phone && (
                <div className="flex items-start gap-3">
                  <Phone size={20} className="text-highlight mt-1" />
                  <div>
                    <p className="font-semibold mb-1">Phone</p>
                    <a href={`tel:${temple.phone}`} className="text-highlight hover:underline">
                      {temple.phone}
                    </a>
                  </div>
                </div>
              )}
              {temple.email && (
                <div className="flex items-start gap-3">
                  <Mail size={20} className="text-highlight mt-1" />
                  <div>
                    <p className="font-semibold mb-1">Email</p>
                    <a href={`mailto:${temple.email}`} className="text-highlight hover:underline">
                      {temple.email}
                    </a>
                  </div>
                </div>
              )}
              {temple.website && (
                <div className="flex items-start gap-3">
                  <Globe size={20} className="text-highlight mt-1" />
                  <div>
                    <p className="font-semibold mb-1">Website</p>
                    <a
                      href={temple.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-highlight hover:underline"
                    >
                      {temple.website}
                    </a>
                  </div>
                </div>
              )}
              {temple.socialLinks && (
                <div className="md:col-span-2">
                  <p className="font-semibold mb-3">Social Media</p>
                  <div className="flex flex-wrap gap-4">
                    {temple.socialLinks.facebook && (
                      <a
                        href={temple.socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-highlight hover:underline"
                      >
                        Facebook
                      </a>
                    )}
                    {temple.socialLinks.instagram && (
                      <a
                        href={temple.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-highlight hover:underline"
                      >
                        Instagram
                      </a>
                    )}
                    {temple.socialLinks.twitter && (
                      <a
                        href={temple.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-highlight hover:underline"
                      >
                        Twitter
                      </a>
                    )}
                    {temple.socialLinks.youtube && (
                      <a
                        href={temple.socialLinks.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-highlight hover:underline"
                      >
                        YouTube
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Events Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold brand-font text-highlight">
              Upcoming Events
            </h2>
          </div>

          <TempleEventsList templeId={temple.id} onSelectEvent={onSelectEvent} />
        </section>

        {/* Gallery Section */}
        {temple.images && temple.images.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold brand-font text-highlight mb-6">Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {temple.images.map((image: string, index: number) => (
                <img
                  key={index}
                  src={image}
                  alt={`${temple.name} - Image ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer"
                />
              ))}
            </div>
          </section>
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
      try {
        const response = await api.get('/events', {
          params: {
            templeId,
            status: 'UPCOMING',
            limit: 3,
          },
        });
        return response.data as TempleEvent[];
      } catch (error) {
        if (!isDemoMode) throw error;

        logger.warn('Failed to fetch temple events, using demo data');
        const demoEvents = Object.values(DEMO_EVENTS) as Array<{
          id: string;
          slug: string;
          title: string;
          description: string;
          date: string;
          location: string;
          isVirtual: boolean;
        }>;
        return demoEvents.map((event) => ({
          id: event.id,
          slug: event.slug,
          title: event.title,
          description: event.description,
          type: event.isVirtual ? 'VIRTUAL' : 'IN_PERSON',
          startDate: event.date,
          location: event.location,
          image: undefined,
        }));
      }
    },
    enabled: !!templeId,
  });

  if (isLoading) {
    return <div className="h-20 animate-pulse bg-white/5 rounded-lg"></div>;
  }

  if (events.length === 0) {
    return (
      <div className="bg-white/5 rounded-lg p-6 text-center border border-white/10">
        <Calendar size={32} className="mx-auto text-muted mb-2" />
        <p className="text-muted">No upcoming events scheduled.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event: any) => (
        <div
          key={event.id}
          onClick={() => onSelectEvent?.(event.slug)}
          className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-highlight transition-all rounded-xl overflow-hidden cursor-pointer group"
        >
          {event.image ? (
            <img src={event.image} alt={event.title} className="w-full h-48 object-cover" />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-highlight/10 to-muted/10 flex items-center justify-center">
              <Calendar size={48} className="text-highlight/30" />
            </div>
          )}
          <div className="p-5">
            <div className="flex items-center gap-2 text-highlight text-xs uppercase tracking-wider font-semibold mb-2">
              <span className="bg-highlight/10 px-2 py-1 rounded">{event.type}</span>
              <span>•</span>
              <span>{new Date(event.startDate).toLocaleDateString()}</span>
            </div>
            <h3 className="text-xl font-bold brand-font text-white mb-2 group-hover:text-highlight transition-colors">
              {event.title}
            </h3>
            <p className="text-muted text-sm line-clamp-2 mb-4">
              {event.description}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted">
              <MapPin size={14} />
              <span>{event.location}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TempleDetailView;
