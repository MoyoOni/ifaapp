import React, { useState, useMemo } from 'react';
import { Search, MapPin, Users, CheckCircle, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Temple, TempleType, TempleStatus } from '@common';
import api from '@/lib/api';
import { DEMO_TEMPLES } from '@/demo';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';

interface TempleCardProps {
  temple: Temple;
  onClick?: () => void;
}

/**
 * Temple Card Component
 * Displays temple information in directory view
 */
const TempleCard: React.FC<TempleCardProps> = ({ temple, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`group bg-white rounded-2xl border border-emerald-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full ${onClick ? 'cursor-pointer' : ''
        }`}
    >
      {/* Cover Image / Map Placeholder */}
      <div className="h-40 bg-emerald-100 relative overflow-hidden">
        {/* Pattern overlay or actual image if available */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1599583236384-9343729f2712?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 group-hover:scale-110 transition-transform duration-700"></div>

        <div className="absolute top-4 left-4">
          {temple.logo ? (
            <img
              src={temple.logo}
              alt={temple.name}
              className="w-16 h-16 rounded-xl object-cover border-4 border-white shadow-md bg-white"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-2xl font-bold brand-font border-4 border-white shadow-md">
              <Building2 size={32} />
            </div>
          )}
        </div>

        {temple.verified && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-emerald-700 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
            <CheckCircle size={12} className="fill-current" />
            Verified
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            {temple.type.replace('_', ' ')}
          </span>
        </div>
        <h3 className="text-xl font-bold brand-font text-emerald-900 group-hover:text-emerald-700 transition-colors mb-2">
          {temple.name}
        </h3>

        {temple.yorubaName && (
          <p className="text-sm text-emerald-600 font-medium mb-3 italic">
            "{temple.yorubaName}"
          </p>
        )}

        {/* Location */}
        {(temple.city || temple.state) && (
          <div className="flex items-center gap-2 text-emerald-600 text-sm mb-4">
            <MapPin size={16} className="text-emerald-300 shrink-0" />
            <span className="truncate">
              {temple.city}{temple.city && temple.state && ', '}{temple.state}
            </span>
          </div>
        )}

        <p className="text-emerald-600 text-sm line-clamp-2 mb-6 flex-1">
          {temple.description || 'A sacred space for community worship and spiritual guidance.'}
        </p>

        <div className="pt-4 border-t border-emerald-100 flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Users size={14} />
            {temple.babalawoCount} Priests
          </div>
          <span className="group-hover:translate-x-1 transition-transform text-emerald-600">
            Visit Temple →
          </span>
        </div>
      </div>
    </div>
  );
};

interface TempleDirectoryProps {
  onSelectTemple?: (slug: string) => void;
}

const TempleDirectory: React.FC<TempleDirectoryProps> = ({ onSelectTemple }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TempleType | 'ALL'>('ALL');
  const [selectedStatus] = useState<TempleStatus | 'ALL'>('ALL');
  const [locationFilter, setLocationFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | 'ALL'>('ALL');

  // Fetch temples
  const { data: temples = [], isLoading } = useQuery<Temple[]>({
    queryKey: ['temples', { search: searchQuery, type: selectedType, status: selectedStatus, verified: verifiedFilter }],
    queryFn: async () => {
      try {
        const response = await api.get('/temples', {
          params: {
            search: searchQuery || undefined,
            type: selectedType !== 'ALL' ? selectedType : undefined,
            status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
            verified: verifiedFilter !== 'ALL' ? verifiedFilter : undefined,
            city: locationFilter || undefined,
          },
        });
        return response.data || [];
      } catch (error) {
        if (!isDemoMode) throw error;

        logger.error('Failed to fetch temples, using demo data', error);
        return Object.values(DEMO_TEMPLES).map((temple) => {
          const [city, state] = (temple.location || '').split(',').map((part) => part.trim());
          const demoTemple = {
            id: temple.id,
            name: temple.name,
            yorubaName: temple.yorubaName,
            slug: temple.slug,
            type: 'IFA',
            status: 'ACTIVE',
            verified: temple.verified,
            city: city || '',
            state: state || '',
            logo: temple.logo,
            description: temple.description,
            babalawoCount: temple.babalawos?.length || 0,
          } as unknown as Temple;
          return demoTemple;
        });
      }
    },
  });

  // Filter temples by location client-side if needed (mostly redundant if API handles it, but good for quick feel)
  const filteredTemples = useMemo(() => {
    return temples.filter((temple) => {
      if (locationFilter) {
        const location = `${temple.city || ''} ${temple.state || ''}`.toLowerCase();
        if (!location.includes(locationFilter.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [temples, locationFilter]);

  const handleTempleClick = (temple: Temple) => {
    if (onSelectTemple) {
      onSelectTemple(temple.slug || temple.id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* 1. Header Hero */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
        {/* Minimal pattern */}
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
          <Building2 size={400} />
        </div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-widest text-white">
            <MapPin size={12} /> Sacred Spaces
          </div>
          <h1 className="text-4xl md:text-5xl font-bold brand-font leading-tight text-white">
            Ilé Ifá Directory
          </h1>
          <p className="text-emerald-100 text-lg">
            Find a vetted temple, study circle, or spiritual center near you. Connect with your local community.
          </p>
        </div>
      </div>

      {/* 2. Search & Filters Bar */}
      <div className="sticky top-0 z-30 bg-emerald-50/95 backdrop-blur-md py-4 border-b border-emerald-100 lg:static lg:bg-transparent lg:border-none lg:p-0">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Main Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search temples, cities, or lineages..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-emerald-200 shadow-sm focus:ring-2 focus:ring-emerald-300/20 focus:border-emerald-500 outline-none text-emerald-700"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as TempleType | 'ALL')}
              className="px-4 py-3 rounded-xl bg-white border border-emerald-200 text-sm font-bold text-emerald-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-300/20 outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value={TempleType.ILE_IFA}>Ilé Ifá (Full Temple)</option>
              <option value={TempleType.BRANCH}>Branch / Extension</option>
              <option value={TempleType.STUDY_CIRCLE}>Study Circle</option>
            </select>

            <div className="h-8 w-px bg-emerald-200 mx-1 hidden lg:block"></div>

            <button
              onClick={() => setVerifiedFilter(verifiedFilter === true ? 'ALL' : true)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-bold whitespace-nowrap ${verifiedFilter === true
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                : 'bg-white text-emerald-700 border-emerald-200 hover:border-emerald-300'
                }`}
            >
              <CheckCircle size={16} />
              Verified Only
            </button>
          </div>
        </div>
      </div>

      {/* 3. Results Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-80 rounded-2xl bg-emerald-100 animate-pulse"></div>
          ))}
        </div>
      ) : filteredTemples.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-emerald-50 rounded-3xl border border-emerald-100 text-center p-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <MapPin size={40} className="text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-emerald-600 mb-2">No temples found</h3>
          <p className="text-emerald-500 max-w-md">
            We couldn't find any temples matching "{searchQuery}" in this location.
            Try widening your search or check back later as our directory grows.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setLocationFilter(''); setSelectedType('ALL'); setVerifiedFilter('ALL'); }}
            className="mt-6 font-bold text-emerald-700 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemples.map((temple) => (
              <TempleCard
                key={temple.id}
                temple={temple}
                onClick={() => handleTempleClick(temple)}
              />
            ))}
          </div>

          <div className="pt-8 text-center border-t border-emerald-200/50">
            <p className="text-sm font-bold text-emerald-400 uppercase tracking-widest">
              Showing {filteredTemples.length} verified location{filteredTemples.length !== 1 ? 's' : ''}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default TempleDirectory;
