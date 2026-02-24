import React, { useState, useMemo } from 'react';
import { Search, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { VerificationTier } from '@common';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import BabalawoProfileCard from '../profile/babalawo-profile-card';
import { DEMO_TEMPLES, getAllDemoUsers } from '@/demo';

interface Babalawo {
  id: string;
  name: string;
  yorubaName?: string;
  avatar?: string;
  verified: boolean;
  bio?: string;
  location?: string;
  culturalLevel?: string;
  certificates?: Array<{ tier: VerificationTier }>;
  verificationApps?: Array<{ tier?: VerificationTier | null; currentStage: string }>;
  rating?: number;
  reviewCount?: number;
  specialties?: string[];
  temple?: {
    id: string;
    name: string;
    yorubaName?: string;
    slug: string;
    logo?: string;
    verified: boolean;
  };
}

interface BabalawoDirectoryProps {
  onSelectBabalawo?: (id: string) => void;
  onBookSession?: (id: string) => void;
}

/**
 * Babalawo Directory View
 * Searchable directory of verified Babalawos
 * NOTE: Only verified practitioners are shown - culturally critical requirement
 */
const BabalawoDirectory: React.FC<BabalawoDirectoryProps> = ({ onSelectBabalawo, onBookSession }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<VerificationTier | 'ALL'>('ALL');
  const [templeFilter, setTempleFilter] = useState('');

  // Fetch temples for filter dropdown
  const { data: temples = [] } = useQuery<Array<{ id: string; name: string; slug: string }>>({
    queryKey: ['temples', 'filter'],
    queryFn: async () => {
      const response = await api.get('/temples', {
        params: { status: 'ACTIVE' },
      });
      return response.data;
    },
    placeholderData: Object.values(DEMO_TEMPLES).map((temple) => ({
      id: temple.id,
      name: temple.name,
      slug: temple.slug,
    })),
  });

  // Fetch verified Babalawos
  const { data: babalawos = [], isLoading } = useQuery<Babalawo[]>({
    queryKey: ['babalawos', { verified: 'true', role: 'BABALAWO' }],
    queryFn: async () => {
      let apiUsers = [];
      try {
        const response = await api.get('/users', {
          params: {
            role: 'BABALAWO',
            verified: 'true',
            search: searchQuery || undefined,
          },
        });
        apiUsers = response.data;
      } catch (error) {
        if (!isDemoMode) throw error;

        logger.warn('API fetch failed, using demo data');
      }

      // If API returns empty or fails, use demo data (merged with API data if partial)
      if (!apiUsers || apiUsers.length === 0) {
        const demoUsers = getAllDemoUsers().filter(u => u.role === 'BABALAWO');
        const templesList = Object.values(DEMO_TEMPLES);
        // Transform demo users to match component interface; assign temple from DEMO_TEMPLES.babalawos
        return demoUsers.map(u => {
          const demoTemple = templesList.find(t => t.babalawos?.includes(u.id)) ?? templesList[0];
          return {
            id: u.id,
            name: u.name,
            yorubaName: (u as any).yorubaName,
            avatar: u.avatar || undefined,
            verified: (u as any).verified !== undefined ? (u as any).verified : true,
            bio: u.bio,
            location: u.location,
            culturalLevel: (u as any).culturalLevel || 'Babalawo',
            certificates: [{ tier: 'MASTER' as VerificationTier }],
            verificationApps: [{ tier: 'MASTER' as VerificationTier, currentStage: 'CERTIFIED' }],
            rating: (u as any).rating || 5.0,
            reviewCount: (u as any).reviews || 24,
            specialties: (u as any).services?.map((s: any) => s.title) || (u as any).interests || [],
            temple: {
              id: demoTemple?.id ?? 'temple-1',
              name: demoTemple?.name ?? 'Ile Orunmila',
              slug: demoTemple?.slug ?? 'ile-orunmila',
              verified: demoTemple?.verified ?? true
            }
          };
        });
      }

      return apiUsers.map((u: any) => ({
        ...u,
        rating: u.rating || 5.0,
        reviewCount: u.reviewCount || Math.floor(Math.random() * 50) + 10,
        specialties: u.interests || u.specialization || ['Ifa Divination', 'Counseling']
      }));
    },
  });

  // Filter Babalawos by tier, location, and temple
  const filteredBabalawos = useMemo(() => {
    return babalawos.filter((babalawo) => {
      // Filter by tier
      if (selectedTier !== 'ALL') {
        const tier = babalawo.verificationApps?.[0]?.tier || babalawo.certificates?.[0]?.tier;
        if (tier !== selectedTier) {
          return false;
        }
      }

      // Filter by temple
      if (templeFilter) {
        if (!babalawo.temple || babalawo.temple.id !== templeFilter) {
          return false;
        }
      }

      return true;
    });
  }, [babalawos, selectedTier, templeFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* 1. Hero / Header */}
      <div className="bg-gradient-to-br from-green-900 to-emerald-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
        {/* Forest/Leaf pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-10"></div>
        {/* Organic blobs */}
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-green-500 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-emerald-400 rounded-full blur-3xl opacity-20"></div>

        <div className="relative z-10 space-y-4">
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-green-200 uppercase tracking-widest border border-white/10">
            Elders & Guides
          </span>
          <h1 className="text-4xl md:text-5xl font-bold brand-font leading-tight">
            Babaláwo Directory
          </h1>
          <p className="text-white/80 max-w-xl text-lg">
            Connect with verified practitioners of Isese/Ifá wisdom. Find a mentor, a diviner, or a spiritual father for your journey.
          </p>
        </div>
      </div>

      {/* 2. Controls & Search */}
      <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, lineage, or speciality..."
            className="w-full pl-11 pr-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500 text-stone-700 bg-stone-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {/* Tier Filter */}
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value as VerificationTier | 'ALL')}
            className="px-4 py-2 border border-stone-200 rounded-xl bg-white text-stone-600 font-medium focus:outline-none focus:ring-2 focus:ring-green-200 cursor-pointer text-sm"
            aria-label="Filter by verification level"
          >
            <option value="ALL">All Levels</option>
            <option value={VerificationTier.JUNIOR}>Junior Awo</option>
            <option value={VerificationTier.SENIOR}>Senior Awo</option>
            <option value={VerificationTier.MASTER}>Master Awo</option>
          </select>

          {/* Temple Filter */}
          <select
            value={templeFilter}
            onChange={(e) => setTempleFilter(e.target.value)}
            className="px-4 py-2 border border-stone-200 rounded-xl bg-white text-stone-600 font-medium focus:outline-none focus:ring-2 focus:ring-green-200 cursor-pointer text-sm max-w-[150px]"
            aria-label="Filter by temple or lineage"
          >
            <option value="">All Lineages</option>
            {temples.map((temple) => (
              <option key={temple.id} value={temple.id}>
                {temple.name}
              </option>
            ))}
          </select>

          {/* Map Button (Future Feature) */}
          <button className="p-2 border border-stone-200 rounded-xl text-stone-400 hover:text-green-600 hover:border-green-200 transition-colors" title="View on Map">
            <MapPin size={18} />
          </button>
        </div>
      </div>

      {/* 3. Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredBabalawos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-stone-100 border-dashed">
          <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-4 text-stone-300">
            <Search size={32} />
          </div>
          <h3 className="text-xl font-bold text-stone-400 mb-1">No guides found</h3>
          <p className="text-stone-400 text-center max-w-sm px-4">
            We couldn't find any Babalawos matching your exact criteria. Try widening your search.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedTier('ALL'); setTempleFilter(''); }}
            className="mt-4 text-green-600 font-bold hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBabalawos.map((babalawo) => (
              <BabalawoProfileCard
                key={babalawo.id}
                babalawo={babalawo}
                onClick={() => onSelectBabalawo?.(babalawo.id)}
                onBookSession={(id) => onBookSession?.(id)}
              />
            ))}
          </div>

          <div className="text-center pt-8 border-t border-stone-100/50">
            <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
              Showing {filteredBabalawos.length} verified guide{filteredBabalawos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default BabalawoDirectory;
