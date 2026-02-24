import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { BookingForm } from '@/features/consultations/BookingForm';
import { getDemoUserById } from '@/demo/index';

interface BabalawoDetails {
  name: string;
  yorubaName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  rating?: number;
  specialties?: string[];
}

const getBabalawoDetails = async (id: string): Promise<BabalawoDetails> => {
  try {
    const response = await api.get(`/babalawos/${id}`);
    return {
      name: response.data?.name || 'Babalawo',
      yorubaName: response.data?.yorubaName,
      avatar: response.data?.avatar,
      bio: response.data?.bio,
      location: response.data?.location,
      rating: response.data?.rating,
      specialties: response.data?.specialties,
    };
  } catch (error) {
    const demoUser = getDemoUserById(id);
    if (demoUser) {
      return {
        name: demoUser.name,
        yorubaName: demoUser.yorubaName,
        avatar: demoUser.avatar,
        bio: demoUser.bio,
        location: demoUser.location,
        rating: 5.0,
        specialties: demoUser.specialization || ['Ifa Divination'],
      };
    }
    logger.warn('Failed to fetch babalawo details, using fallback');
    return {
      name: 'Babalawo Femi Sowande',
      yorubaName: 'Babaláwo Fẹ́mi Ṣọwándé',
      rating: 5.0,
      specialties: ['Ifa Divination', 'Spiritual Guidance'],
    };
  }
};

export const BookingPage: React.FC = () => {
  const { babalawoId } = useParams<{ babalawoId: string }>();
  const navigate = useNavigate();
  const [babalawo, setBabalawo] = useState<BabalawoDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!babalawoId) {
      setError('No Babalawo ID provided.');
      setLoading(false);
      return;
    }

    const fetchBabalawo = async () => {
      try {
        const details = await getBabalawoDetails(babalawoId);
        setBabalawo(details);
      } catch (err: any) {
        setError('Failed to load Babalawo details.');
      } finally {
        setLoading(false);
      }
    };

    fetchBabalawo();
  }, [babalawoId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-medium">Loading Babalawo details...</p>
        </div>
      </div>
    );
  }

  if (error || !babalawo) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-8 border border-border shadow-elevation-2"
        >
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold brand-font text-foreground">Unable to Load</h2>
            <p className="text-muted-foreground">{error || 'Babalawo not found.'}</p>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back</span>
      </button>

      {/* Babalawo Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-[2.5rem] p-8 md:p-10 shadow-elevation-2 border border-border relative overflow-hidden"
      >
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] bg-primary/10 overflow-hidden shadow-lg ring-4 ring-primary/20">
              {babalawo.avatar ? (
                <img src={babalawo.avatar} alt={babalawo.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl md:text-5xl font-bold text-primary brand-font">
                  {babalawo.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold brand-font text-foreground mb-2">
                {babalawo.name}
              </h1>
              {babalawo.yorubaName && (
                <p className="text-xl text-highlight font-medium italic mb-3">
                  {babalawo.yorubaName}
                </p>
              )}
              {babalawo.bio && (
                <p className="text-muted-foreground leading-relaxed max-w-2xl">
                  {babalawo.bio}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              {babalawo.rating && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-highlight/10 rounded-full">
                  <span className="text-highlight font-bold">⭐</span>
                  <span className="font-bold text-foreground">{babalawo.rating}</span>
                  <span className="text-muted-foreground">Rating</span>
                </div>
              )}
              {babalawo.location && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 rounded-full">
                  <span className="text-secondary font-bold">📍</span>
                  <span className="text-foreground">{babalawo.location}</span>
                </div>
              )}
            </div>

            {babalawo.specialties && babalawo.specialties.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {babalawo.specialties.map((spec, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wide"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Booking Form */}
      {babalawoId && (
        <BookingForm babalawoId={babalawoId} babalawoName={babalawo.name} />
      )}
    </div>
  );
};
