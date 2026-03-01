import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
// motion import removed - not currently used
import api from '@/lib/api';
import { Button } from '@/shared/components/ui';
import { isDemoMode } from '@/shared/config/demo-mode';
import { DEMO_USERS, DEMO_TEMPLES } from '@/demo';
import { logger } from '@/shared/utils/logger';
// cn import removed - not currently used
import { seededRandomInt } from '@/shared/utils/seeded-random';
import { BabalawoDirectorySkeleton } from '@/shared/components/skeleton';
import { FeatureHeader } from '@/shared/components/feature-header';
import { Search as SearchIcon } from 'lucide-react';

interface Babalawo {
  id: string;
  name: string;
  yorubaName?: string;
  avatar?: string;
  verified: boolean;
  bio?: string;
  location?: string;
  culturalLevel?: string;
  rating?: number;
  reviewCount?: number;
  specialties?: string[];
  temple?: {
    id: string;
    name: string;
    yorubaName?: string;
    verified: boolean;
  };
  services?: Array<{ title: string }>;
  responseTime?: string;
  yearsOfExperience?: number;
}

interface DiscoveryFilters {
  search: string;
  specialty: string;
  location: string;
  verifiedOnly: boolean;
  minRating: number;
}

const BabalawoDiscoveryView: React.FC = () => {
  const navigate = useNavigate();
  const [filters] = useState<DiscoveryFilters>({
    search: '',
    specialty: 'all',
    location: '',
    verifiedOnly: true,
    minRating: 0
  });

  // Add activeFilter state
  const [activeFilter, setActiveFilter] = useState('all');

  // Fetch all Babalawos
  const { data: babalawos = [], isLoading } = useQuery<Babalawo[]>({
    queryKey: ['babalawos-discovery', filters],
    queryFn: async () => {
      try {
        const response = await api.get('/users', {
          params: {
            role: 'BABALAWO',
            verified: filters.verifiedOnly ? 'true' : undefined,
            search: filters.search || undefined,
          },
        });
        return response.data || [];
      } catch (error) {
        if (!isDemoMode) throw error;

        logger.warn('Using demo data for Babalawo discovery');
        return Object.values(DEMO_USERS)
          .filter(user => user.role === 'BABALAWO')
          .map(user => {
            const temples = Object.values(DEMO_TEMPLES);
            const temple = temples.find(t => t.babalawos?.includes(user.id)) || temples[0];

            return {
              id: user.id,
              name: user.name,
              yorubaName: (user as any).yorubaName,
              avatar: user.avatar,
              verified: (user as any).verified !== undefined ? (user as any).verified : true,
              bio: user.bio,
              location: user.location,
              culturalLevel: (user as any).culturalLevel || 'Babalawo',
              rating: (user as any).rating || seededRandomInt(`${user.id}-rating`, 4, 5),
              reviewCount: (user as any).reviews || (user as any).reviewCount || seededRandomInt(`${user.id}-reviews`, 10, 59),
              specialties: (user as any).services?.map((s: any) => s.title) || ['Spiritual Guidance'],
              services: (user as any).services || [{ title: 'Spiritual Consultation' }],
              responseTime: (user as any).responseTime || 'Within a day',
              yearsOfExperience: (user as any).yearsOfExperience || seededRandomInt(`${user.id}-exp`, 5, 30),
              temple: {
                id: temple?.id || 'temple-1',
                name: temple?.name || 'Sacred Temple',
                yorubaName: temple?.yorubaName,
                verified: temple?.verified || true
              }
            } as Babalawo;
          });
      }
    },
  });

  // Filter Babalawos based on criteria
  const filteredBabalawos = useMemo(() => {
    return babalawos.filter(babalawo => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matches =
          babalawo.name.toLowerCase().includes(searchTerm) ||
          (babalawo.yorubaName && babalawo.yorubaName.toLowerCase().includes(searchTerm)) ||
          (babalawo.bio && babalawo.bio.toLowerCase().includes(searchTerm)) ||
          (babalawo.specialties && babalawo.specialties.some(spec => spec.toLowerCase().includes(searchTerm)));
        if (!matches) return false;
      }

      // Location filter
      if (filters.location && babalawo.location) {
        if (!babalawo.location.toLowerCase().includes(filters.location.toLowerCase())) {
          return false;
        }
      }

      // Verified only filter
      if (filters.verifiedOnly && !babalawo.verified) {
        return false;
      }

      // Rating filter
      if (babalawo.rating && babalawo.rating < filters.minRating) {
        return false;
      }

      // Specialty filter
      if (filters.specialty !== 'all' && babalawo.specialties) {
        if (!babalawo.specialties.includes(filters.specialty)) {
          return false;
        }
      }

      return true;
    });
  }, [babalawos, filters]);

  // Define filter tabs array after filteredBabalawos is available
  const filterTabs = [
    { id: 'all', label: 'All', count: filteredBabalawos.length },
    { id: 'verified', label: 'Verified', count: filteredBabalawos.filter(b => b.verified).length },
    { id: 'nearby', label: 'Nearby', count: filteredBabalawos.length }, // Could implement distance logic
    { id: 'top-rated', label: 'Top Rated', count: filteredBabalawos.filter(b => b.rating && b.rating >= 4.5).length },
  ];

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <BabalawoDirectorySkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted to-muted/50">
      <div className="max-w-6xl mx-auto">
        <FeatureHeader feature="find-guide" title="Find My Spiritual Guide" subtitle="Connect with experienced babalawo for personalized guidance" icon={SearchIcon} />

        <div className="bg-card rounded-2xl border border-input p-1 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
            {filterTabs.map((filter) => (
              <button
                key={filter.id}
                className={`py-3 px-4 rounded-xl text-center transition-colors ${activeFilter === filter.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
                  }`}
                onClick={() => setActiveFilter(filter.id)}
              >
                <div className="font-[700] text-[1rem]">{filter.count}</div>
                <div className="text-[0.875rem]">{filter.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBabalawos.map((babalawo) => (
            <div key={babalawo.id} className="bg-card border border-input rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={babalawo.avatar}
                    alt={babalawo.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="text-[1.125rem] font-[700] text-foreground">{babalawo.name}</h2>
                    <p className="text-[0.875rem] text-muted-foreground">{babalawo.culturalLevel}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {babalawo.specialties?.slice(0, 3).map((specialty, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-muted text-foreground rounded-full text-[0.75rem] font-[500]"
                    >
                      {specialty}
                    </span>
                  ))}
                  {babalawo.specialties && babalawo.specialties.length > 3 && (
                    <span className="px-3 py-1 bg-muted text-foreground rounded-full text-[0.75rem] font-[500]">
                      +{babalawo.specialties.length - 3} more
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-[0.875rem] text-foreground mb-1">
                    <span>Response Time</span>
                    <span>{babalawo.responseTime || 'Varies'}</span>
                  </div>
                  <div className="flex justify-between text-[0.875rem] text-foreground">
                    <span>Experience</span>
                    <span>{babalawo.yearsOfExperience || 'Not specified'} years</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => navigate(`/booking/${babalawo.id}`)}
                >
                  Book Consultation
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BabalawoDiscoveryView;