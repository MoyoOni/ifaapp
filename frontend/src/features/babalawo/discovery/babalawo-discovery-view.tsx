import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Button } from '@/shared/components/ui';

import { logger } from '@/shared/utils/logger';
import { BabalawoDirectorySkeleton } from '@/shared/components/skeleton';
import { FeatureHeader } from '@/shared/components/feature-header';
import { Search as SearchIcon, Users, AlertCircle, Star, MessageSquare, User, CheckCircle } from 'lucide-react';
import { OptimizedImage } from '@/components/common/optimized-image';
import { isDevModeActive } from '@/shared/utils/dev-mode';

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
  completenessScore?: number;
  specialties?: string[];
  distance?: number;
  sessionCount?: number;
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

// Memoized Babalawo Card Component
const MemoizedBabalawoCard = React.memo(({ babalawo, onSelect }: { babalawo: Babalawo, onSelect: (id: string) => void }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full"
    >
      <div className="p-1 bg-gradient-to-r from-primary/20 via-highlight/10 to-primary/20">
        <div className="bg-card rounded-xl p-5 h-full flex flex-col">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden shadow-inner border border-border/60">
                {babalawo.avatar ? (
                  <OptimizedImage 
                    src={babalawo.avatar} 
                    alt={babalawo.name} 
                    width={64} 
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground/60" />
                )}
              </div>
              {babalawo.verified && (
                <div className="absolute -top-1 -right-1 bg-background rounded-full p-0.5 border border-border">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-foreground line-clamp-1">{babalawo.name}</h3>
                  {babalawo.yorubaName && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{babalawo.yorubaName}</p>
                  )}
                </div>
                {babalawo.distance && (
                  <span className="text-xs font-medium bg-secondary/60 text-secondary-foreground px-2 py-1 rounded-full">
                    {babalawo.distance} km
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(babalawo.specialties ?? []).slice(0, 3).map((specialty, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full"
                  >
                    {specialty}
                  </span>
                ))}
                {(babalawo.specialties?.length ?? 0) > 3 && (
                  <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    +{(babalawo.specialties?.length ?? 0) - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{babalawo.rating?.toFixed(1) || 'New'}</span>
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
                <span>{babalawo.sessionCount || 0} sessions</span>
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onSelect(babalawo.id)}
              className="h-8"
            >
              Book Consultation
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

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
  const { data: babalawos = [], isLoading, error, refetch } = useQuery<Babalawo[]>({
    queryKey: ['babalawos-discovery', filters],
    queryFn: async () => {
      const response = await api.get('/users', {
        params: {
          role: 'BABALAWO',
          verified: filters.verifiedOnly ? 'true' : undefined,
          search: filters.search || undefined,
        },
      });
      const data = response.data || [];
      // Normalise avgRating → rating for display
      return data.map((b: any) => ({
        ...b,
        rating: b.avgRating ?? b.rating,
        reviewCount: b.reviewCount,
      }));
    },
    retry: 1,
    enabled: !isDevModeActive(),
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

  // Sort Babalawos based on active filter and completeness
  const sortedBabalawos = useMemo(() => {
    const sorted = [...filteredBabalawos];
    if (activeFilter === 'top-rated') {
      sorted.sort((a, b) => {
        const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (b.completenessScore ?? 0) - (a.completenessScore ?? 0);
      });
    } else {
      // Default sort: completenessScore DESC, then rating DESC
      sorted.sort((a, b) => {
        const completeDiff = (b.completenessScore ?? 0) - (a.completenessScore ?? 0);
        if (completeDiff !== 0) return completeDiff;
        return (b.rating ?? 0) - (a.rating ?? 0);
      });
    }
    return sorted;
  }, [filteredBabalawos, activeFilter]);

  // Handle selecting a babalawo
  const handleSelectBabalawo = (id: string) => {
    navigate(`/booking/${id}`);
  };

  // Paginate Babalawos
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const paginatedBabalawos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedBabalawos.slice(start, end);
  }, [sortedBabalawos, currentPage]);

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="max-w-6xl mx-auto p-6">
        <FeatureHeader feature="find-guide" title="Find My Spiritual Guide" subtitle="Connect with experienced babalawo for personalized guidance" icon={SearchIcon} />

        <div className="bg-card rounded-2xl border border-input p-1 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
            {filterTabs.map((filter) => (
              <button
                type="button"
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

        <div className="mt-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div 
                  key={idx} 
                  className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm animate-pulse"
                >
                  <div className="p-1 bg-gradient-to-r from-muted/40 to-muted/40">
                    <div className="bg-card rounded-xl p-5 h-full">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-muted"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 flex justify-between">
                        <div className="flex gap-4">
                          <div className="h-3 bg-muted rounded w-16"></div>
                          <div className="h-3 bg-muted rounded w-16"></div>
                        </div>
                        <div className="h-8 w-32 bg-muted rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-destructive inline-flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>Failed to load babalawos: {error.message}</span>
              </div>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </div>
          ) : filteredBabalawos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No babalawos found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                We couldn't find any babalawos matching your search. Try adjusting your filters.
              </p>
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {paginatedBabalawos.map(babalawo => (
                <MemoizedBabalawoCard 
                  key={babalawo.id} 
                  babalawo={babalawo} 
                  onSelect={handleSelectBabalawo} 
                />
              ))}
            </motion.div>
          )}
        </div>
        
        {Math.ceil(sortedBabalawos.length / itemsPerPage) > 1 && (
          <div className="mt-8 flex justify-center items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {Math.ceil(sortedBabalawos.length / itemsPerPage)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= Math.ceil(sortedBabalawos.length / itemsPerPage)}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BabalawoDiscoveryView;
