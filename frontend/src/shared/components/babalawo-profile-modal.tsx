import React from 'react';
import { X, MapPin, Star, Building2, Calendar, MessageSquare } from 'lucide-react';
import { getDemoUser } from '@/demo';
import { UserRole, VerificationTier } from '@common';
import VerificationBadge from './verification-badge';

interface BabalawoProfileModalProps {
  babalawoId: string;
  isOpen: boolean;
  onClose: () => void;
  onRequestConsultation?: (babalawoId: string) => void;
  onMessage?: (babalawoId: string) => void;
  onViewProfile?: (babalawoId: string) => void;
}

/**
 * Babalawo Profile Modal
 * Shows a Babalawo's profile in a modal overlay without navigating away.
 * Used primarily in temple detail view to keep temple context visible.
 */
const BabalawoProfileModal: React.FC<BabalawoProfileModalProps> = ({
  babalawoId,
  isOpen,
  onClose,
  onRequestConsultation,
  onMessage,
  onViewProfile,
}) => {
  if (!isOpen) return null;

  // Get babalawo data (from demo or would come from API)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const babalawo = getDemoUser(babalawoId) as any;

  if (!babalawo || babalawo.role !== UserRole.BABALAWO) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <p className="text-stone-500">Practitioner not found.</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 px-6 py-2 bg-stone-200 rounded-lg font-bold text-stone-700 hover:bg-stone-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const tier = babalawo.certificates?.[0]?.tier || VerificationTier.JUNIOR;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Backdrop click to close */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 z-10 transition-colors"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Header with Avatar */}
        <div className="relative p-8 pb-4">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-highlight/20 flex items-center justify-center text-3xl font-bold text-highlight overflow-hidden flex-shrink-0 shadow-lg">
              {babalawo.avatar ? (
                <img
                  src={babalawo.avatar}
                  alt={babalawo.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                babalawo.name[0].toUpperCase()
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <VerificationBadge verified={babalawo.verified || false} tier={tier} />
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  {babalawo.experienceYears || 20}+ years
                </span>
              </div>
              <h2 className="text-2xl font-bold brand-font text-stone-900 truncate">
                {babalawo.name}
              </h2>
              {babalawo.yorubaName && (
                <p className="text-highlight font-bold italic">{babalawo.yorubaName}</p>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-stone-500">
                {babalawo.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} className="text-highlight/70" />
                    {babalawo.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                  {babalawo.rating || 5.0} ({babalawo.reviewCount || 0} reviews)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="px-8 py-4">
          <p className="text-stone-600 leading-relaxed">
            {babalawo.bio || 'A dedicated practitioner of the Ifa tradition.'}
          </p>
        </div>

        {/* Specializations */}
        {babalawo.specialization && babalawo.specialization.length > 0 && (
          <div className="px-8 py-4">
            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3">
              Specializations
            </h3>
            <div className="flex flex-wrap gap-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {babalawo.specialization.map((spec: any, idx: any) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-sm font-medium"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        {babalawo.services && babalawo.services.length > 0 && (
          <div className="px-8 py-4">
            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3">
              Services Offered
            </h3>
            <div className="space-y-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {babalawo.services.slice(0, 3).map((service: any) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-4 bg-stone-50 rounded-xl"
                >
                  <div>
                    <span className="font-bold text-stone-800">{service.title}</span>
                    <span className="text-stone-500 text-sm ml-2">• {service.duration}</span>
                  </div>
                  <span className="font-bold text-secondary">
                    ₦{service.price.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lineage */}
        {babalawo.lineage && (
          <div className="px-8 py-4">
            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-2">
              Lineage
            </h3>
            <p className="text-stone-600 flex items-center gap-2">
              <Building2 size={16} className="text-highlight" />
              {babalawo.lineage}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-8 py-6 bg-stone-50 rounded-b-3xl flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => onRequestConsultation?.(babalawoId)}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-4 bg-highlight text-white rounded-xl font-bold hover:bg-yellow-600 transition-colors shadow-lg"
          >
            <Calendar size={20} />
            Request Consultation
          </button>
          <button
            type="button"
            onClick={() => onMessage?.(babalawoId)}
            className="px-6 py-4 bg-white border-2 border-stone-200 text-stone-700 rounded-xl font-bold hover:bg-stone-100 transition-colors"
            aria-label="Message this practitioner"
          >
            <MessageSquare size={20} />
          </button>
          {onViewProfile && (
            <button
              type="button"
              onClick={() => {
                onViewProfile(babalawoId);
                onClose();
              }}
              className="px-6 py-4 bg-white border-2 border-stone-200 text-stone-700 rounded-xl font-bold hover:bg-stone-100 transition-colors"
            >
              View full profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BabalawoProfileModal;
