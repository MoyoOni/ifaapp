import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  ChevronDown,
  Verified
} from 'lucide-react';
import api from '@/lib/api';
import { isDemoMode } from '@/shared/config/demo-mode';
import { DEMO_USERS, DEMO_TEMPLES } from '@/demo';
import { logger } from '@/shared/utils/logger';
import { cn } from '@/lib/utils';

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
  const [filters, setFilters] = useState<DiscoveryFilters>({
    search: '',
    specialty: 'all',
    location: '',
    verifiedOnly: true,
    minRating: 0
  });
  
  const [showFilters, setShowFilters] = useState(false);

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
              rating: (user as any).rating || Math.floor(Math.random() * 2) + 4,
              reviewCount: (user as any).reviews || Math.floor(Math.random() * 50) + 10,
              specialties: (user as any).services?.map((s: any) => s.title) || ['Spiritual Guidance'],
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

  // Get unique specialties for filter dropdown
  const specialties = useMemo(() => {
    const allSpecialties = new Set<string>();
    babalawos.forEach(babalawo => {
      if (babalawo.specialties) {
        babalawo.specialties.forEach(spec => allSpecialties.add(spec));
      }
    });
    return ['all', ...Array.from(allSpecialties)].sort();
  }, [babalawos]);

  const handleFilterChange = (key: keyof DiscoveryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Find Your Spiritual Guide</h1>
            <p className="text-emerald-100 text-lg">
              Connect with verified Babalawos who can guide your spiritual journey
            </p>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 mb-8 border border-emerald-100 shadow-sm"
        >
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, specialty, or location..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
          >
            <Filter size={18} />
            Advanced Filters
            <ChevronDown 
              size={16} 
              className={cn("transition-transform", showFilters && "rotate-180")} 
            />
          </button>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-emerald-100"
            >
              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-2">Specialty</label>
                <select
                  value={filters.specialty}
                  onChange={(e) => handleFilterChange('specialty', e.target.value)}
                  className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {specialties.map(spec => (
                    <option key={spec} value={spec}>
                      {spec === 'all' ? 'All Specialties' : spec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-2">Location</label>
                <input
                  type="text"
                  placeholder="City or region"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-2">Minimum Rating</label>
                <select
                  value={filters.minRating}
                  onChange={(e) => handleFilterChange('minRating', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value={0}>Any Rating</option>
                  <option value={4}>4+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                  <option value={5}>5 Stars</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.verifiedOnly}
                    onChange={(e) => handleFilterChange('verifiedOnly', e.target.checked)}
                    className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-emerald-700">Verified Only</span>
                </label>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-emerald-600">
            Showing <span className="font-bold text-emerald-900">{filteredBabalawos.length}</span> verified Babalawos
            {filters.search && (
              <span> matching "<span className="text-emerald-600">{filters.search}</span>"</span>
            )}
          </p>
        </div>

        {/* Babalawo Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          layout
        >
          {filteredBabalawos.map((babalawo, index) => (
            <motion.div
              key={babalawo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl border border-emerald-100 overflow-hidden hover:shadow-lg transition-all group cursor-pointer"
              onClick={() => navigate(`/profile/${babalawo.id}`)}
            >
              {/* Profile Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <img
                      src={babalawo.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(babalawo.name)}&background=emerald-100&color=emerald-800`}
                      alt={babalawo.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    {babalawo.verified && (
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1">
                        <Verified size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-emerald-900 truncate">
                      {babalawo.name}
                    </h3>
                    {babalawo.yorubaName && (
                      <p className="text-emerald-600 text-sm">{babalawo.yorubaName}</p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <Star size={16} className="text-amber-500 fill-current" />
                        <span className="text-sm font-medium text-emerald-700">
                          {babalawo.rating?.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-emerald-300">•</span>
                      <span className="text-sm text-emerald-500">
                        {babalawo.reviewCount} reviews
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {babalawo.bio && (
                <div className="px-6 pb-4">
                  <p className="text-emerald-600 text-sm line-clamp-2">
                    {babalawo.bio}
                  </p>
                </div>
              )}

              {/* Specialties */}
              {babalawo.specialties && babalawo.specialties.length > 0 && (
                <div className="px-6 pb-4">
                  <div className="flex flex-wrap gap-2">
                    {babalawo.specialties.slice(0, 3).map((spec, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full"
                      >
                        {spec}
                      </span>
                    ))}
                    {babalawo.specialties.length > 3 && (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-600 text-xs font-medium rounded-full">
                        +{babalawo.specialties.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Temple Info */}
              {babalawo.temple && (
                <div className="px-6 pb-4">
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <MapPin size={16} />
                    <span>{babalawo.temple.name}</span>
                    {babalawo.temple.verified && (
                      <Verified size={14} className="text-emerald-500" />
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="px-6 pb-6">
                <div className="flex gap-3">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/booking/${babalawo.id}`);
                    }}
                    className="flex-1 py-2 px-4 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Book Session
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${babalawo.id}`);
                    }}
                    className="py-2 px-4 border border-emerald-300 text-emerald-700 font-medium rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredBabalawos.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Search size={48} className="mx-auto text-emerald-300 mb-4" />
            <h3 className="text-xl font-bold text-emerald-900 mb-2">No Babalawos Found</h3>
            <p className="text-emerald-600 mb-6">
              Try adjusting your search criteria or filters
            </p>
            <button
              onClick={() => setFilters({
                search: '',
                specialty: 'all',
                location: '',
                verifiedOnly: true,
                minRating: 0
              })}
              className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Clear All Filters
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BabalawoDiscoveryView;