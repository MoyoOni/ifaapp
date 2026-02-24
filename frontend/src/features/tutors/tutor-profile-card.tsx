import React from 'react';
import { GraduationCap, Clock, DollarSign, Globe } from 'lucide-react';
import VerificationBadge from '@/shared/components/verification-badge';

interface Tutor {
  id: string;
  userId: string;
  businessName?: string;
  teachingStyle?: string;
  languages: string[];
  experience?: number;
  hourlyRate: number;
  currency: string;
  specialization: string[];
  status: string;
  description?: string;
  user: {
    id: string;
    name: string;
    yorubaName?: string;
    verified: boolean;
    avatar?: string;
  };
  _count?: {
    sessions: number;
  };
}

interface TutorProfileCardProps {
  tutor: Tutor;
  onSelect?: () => void;
  showActions?: boolean;
  onBookSession?: () => void;
}

/**
 * Tutor Profile Card Component
 * Displays tutor information in directory view
 */
const TutorProfileCard: React.FC<TutorProfileCardProps> = ({
  tutor,
  onSelect,
  showActions = true,
  onBookSession,
}) => {
  const currencySymbol = tutor.currency === 'NGN' ? '₦' : tutor.currency === 'USD' ? '$' : tutor.currency;

  return (
    <div
      className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4 hover:border-highlight/50 transition-all cursor-pointer"
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        {tutor.user.avatar ? (
          <img
            src={tutor.user.avatar}
            alt={tutor.user.name}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-highlight/20 flex items-center justify-center">
            <GraduationCap size={32} className="text-highlight" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {tutor.businessName || tutor.user.yorubaName || tutor.user.name}
            <VerificationBadge verified={tutor.user.verified} />
          </h3>
          {tutor.user.yorubaName && tutor.businessName && (
            <p className="text-sm text-muted">{tutor.user.yorubaName}</p>
          )}
          {tutor.experience && (
            <p className="text-xs text-muted mt-1">
              {tutor.experience} year{tutor.experience !== 1 ? 's' : ''} experience
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {tutor.description && (
        <p className="text-sm text-muted line-clamp-2">{tutor.description}</p>
      )}

      {/* Specializations */}
      <div className="flex flex-wrap gap-2">
        {tutor.specialization.slice(0, 3).map((spec) => (
          <span
            key={spec}
            className="px-2 py-1 bg-highlight/20 text-highlight rounded-full text-xs font-medium"
          >
            {spec}
          </span>
        ))}
        {tutor.specialization.length > 3 && (
          <span className="px-2 py-1 bg-white/10 text-muted rounded-full text-xs">
            +{tutor.specialization.length - 3} more
          </span>
        )}
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted">
          <Globe size={14} />
          <span>Languages: {tutor.languages.join(', ')}</span>
        </div>
        {tutor.teachingStyle && (
          <div className="flex items-center gap-2 text-muted">
            <GraduationCap size={14} />
            <span>Style: {tutor.teachingStyle}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-highlight font-bold">
          <DollarSign size={14} />
          <span>
            {currencySymbol}
            {tutor.hourlyRate.toLocaleString()}/hour
          </span>
        </div>
        {tutor._count && tutor._count.sessions > 0 && (
          <div className="flex items-center gap-2 text-muted">
            <Clock size={14} />
            <span>{tutor._count.sessions} session{tutor._count.sessions !== 1 ? 's' : ''} completed</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="pt-4 border-t border-white/10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookSession?.();
            }}
            className="w-full py-2 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors"
          >
            Request Consultation
          </button>
        </div>
      )}
    </div>
  );
};

export default TutorProfileCard;
