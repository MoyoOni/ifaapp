import React from 'react';
import { MapPin, Star, Building2 } from 'lucide-react';
import VerificationBadge from '@/shared/components/verification-badge';
import { VerificationTier } from '@common';

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

interface BabalawoProfileCardProps {
  babalawo: Babalawo;
  onClick?: () => void;
  onBookSession?: (babalawoId: string) => void;
  onRequestPersonalAwo?: (babalawoId: string) => void;
  showActions?: boolean; // Show action buttons (for detail view)
}

/**
 * Babalawo Profile Card Component
 * Displays Babalawo information in directory view
 * NOTE: Preserves Yoruba diacritics and cultural terminology
 */
const BabalawoProfileCard: React.FC<BabalawoProfileCardProps> = ({
  babalawo,
  onClick,
  onBookSession,
  onRequestPersonalAwo: _onRequestPersonalAwo,
  showActions: _showActions = false,
}) => {
  const tier = babalawo.verificationApps?.[0]?.tier || babalawo.certificates?.[0]?.tier || null;

  return (
    <div
      onClick={onClick}
      className={`bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-highlight transition-all cursor-pointer ${onClick ? 'hover:scale-[1.01]' : ''
        }`}
    >
      {/* Header: Avatar, Name & Badge */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-highlight/20 flex items-center justify-center text-xl font-bold brand-font text-highlight flex-shrink-0">
          {babalawo.avatar ? (
            <img src={babalawo.avatar} alt={babalawo.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            (babalawo.name[0] || '').toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-bold brand-font text-white truncate pr-2">{babalawo.name}</h3>
            <div className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded text-xs text-highlight">
              <Star size={10} fill="currentColor" />
              <span className="font-bold">{babalawo.rating || '5.0'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <VerificationBadge verified={babalawo.verified} tier={tier || undefined} />
            {babalawo.yorubaName && (
              <span className="text-muted text-xs truncate">• {babalawo.yorubaName}</span>
            )}
          </div>
        </div>
      </div>

      {/* Specialties (Compact) */}
      {(babalawo.specialties && babalawo.specialties.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {babalawo.specialties.slice(0, 3).map((spec, idx) => (
            <span key={idx} className="bg-white/5 text-muted hover:text-white border border-white/5 text-[10px] px-2 py-0.5 rounded-full transition-colors">
              {spec}
            </span>
          ))}
        </div>
      )}

      {/* Temple & Location (One Line) */}
      <div className="flex items-center gap-3 text-xs text-muted mb-3 overflow-hidden">
        {babalawo.temple && (
          <div className="flex items-center gap-1.5 truncate">
            <Building2 size={12} className="text-highlight/70" />
            <span className="truncate">{babalawo.temple.name}</span>
          </div>
        )}
        {babalawo.location && (
          <div className="flex items-center gap-1.5 truncate">
            <MapPin size={12} className="text-highlight/70" />
            <span className="truncate">{babalawo.location}</span>
          </div>
        )}
      </div>

      {/* Bio (Truncated) */}
      {babalawo.bio && (
        <p className="text-muted text-xs mb-3 line-clamp-1 opacity-70">{babalawo.bio}</p>
      )}

      {/* Action Buttons (Compact Grid) */}
      <div className="grid grid-cols-2 gap-2 mt-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBookSession?.(babalawo.id);
          }}
          className="px-3 py-1.5 bg-highlight hover:bg-highlight/80 text-white rounded-lg font-bold text-xs transition-colors shadow-sm"
        >
          Request Consultation
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg font-semibold text-xs transition-colors border border-white/10"
        >
          View Profile
        </button>
      </div>
    </div>
  );
};

export default BabalawoProfileCard;
