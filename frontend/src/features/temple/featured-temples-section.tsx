import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Users, MapPin, ArrowRight, CheckCircle } from 'lucide-react';
import { Temple } from '@common';
import api from '@/lib/api';

interface FeaturedTemplesSectionProps {
  onSelectTemple?: (slug: string) => void;
  limit?: number;
}

/**
 * Featured Temples Section
 * Displays verified temples on homepage
 * NOTE: Temple-first discovery approach - featured prominently
 */
const FeaturedTemplesSection: React.FC<FeaturedTemplesSectionProps> = ({
  onSelectTemple,
  limit = 3,
}) => {
  // Fetch featured (verified) temples
  const { data: temples = [], isLoading } = useQuery<Temple[]>({
    queryKey: ['temples', 'featured'],
    queryFn: async () => {
      const response = await api.get('/temples', {
        params: {
          verified: 'true',
          status: 'ACTIVE',
        },
      });
      return response.data.slice(0, limit);
    },
  });

  const handleTempleClick = (temple: Temple) => {
    if (onSelectTemple) {
      onSelectTemple(temple.slug);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (temples.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold brand-font text-highlight mb-2">
            Featured Temples
          </h2>
          <p className="text-muted">
            Discover verified Ilé Ifá and connect with tradition
          </p>
        </div>
        {onSelectTemple && (
          <button
            onClick={() => onSelectTemple('')}
            className="flex items-center gap-2 text-highlight hover:text-highlight/80 transition-colors"
          >
            View All
            <ArrowRight size={20} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {temples.map((temple) => (
          <div
            key={temple.id}
            onClick={() => handleTempleClick(temple)}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-highlight transition-all cursor-pointer hover:scale-[1.02] group"
          >
            {/* Logo and Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                {temple.logo ? (
                  <img
                    src={temple.logo}
                    alt={temple.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-highlight/30 group-hover:border-highlight transition-colors"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-highlight/20 flex items-center justify-center text-2xl font-bold brand-font text-highlight group-hover:bg-highlight/30 transition-colors">
                    <Building2 size={32} />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold brand-font text-white group-hover:text-highlight transition-colors">
                    {temple.name}
                  </h3>
                  {temple.yorubaName && (
                    <p className="text-muted text-sm">{temple.yorubaName}</p>
                  )}
                </div>
              </div>
              {temple.verified && (
                <div className="flex items-center gap-1 text-highlight">
                  <CheckCircle size={18} />
                </div>
              )}
            </div>

            {/* Description */}
            {temple.description && (
              <p className="text-muted text-sm mb-4 line-clamp-2">
                {temple.description}
              </p>
            )}

            {/* Location */}
            {(temple.city || temple.state) && (
              <div className="flex items-center gap-2 text-muted text-sm mb-4">
                <MapPin size={14} />
                <span>
                  {temple.city}
                  {temple.city && temple.state && ', '}
                  {temple.state}
                </span>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-muted text-sm">
                <Users size={14} />
                <span>{temple.babalawoCount} Babalawo{temple.babalawoCount !== 1 ? 's' : ''}</span>
              </div>
              <span className="text-xs text-muted uppercase tracking-wider">
                {temple.type.replace('_', ' ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedTemplesSection;
