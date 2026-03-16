import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Star, CheckCircle, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';

interface ResolvedProfile {
  type: 'babalawo' | 'client' | 'temple';
  id: string;
  name: string;
  yorubaName?: string;
  slug: string;
  avatar?: string;
  bio?: string;
  verified?: boolean;
  location?: string;
  culturalLevel?: string;
  role?: string;
}

const BabalawoLandingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const { data, isLoading, isError } = useQuery<ResolvedProfile>({
    queryKey: ['public-profile', slug],
    queryFn: async () => {
      const res = await api.get(`/public/resolve/${slug}`);
      return res.data;
    },
    retry: false,
    enabled: !!slug,
  });

  // For non-babalawo profiles, redirect to the appropriate internal page
  useEffect(() => {
    if (!data) return;
    if (data.type === 'temple') {
      navigate(`/temples/${data.slug}`, { replace: true });
    } else if (data.type === 'client') {
      navigate(`/profile/${data.id}`, { replace: true });
    }
  }, [data, navigate]);

  const handleBook = () => {
    if (!data) return;
    const bookingPath = `/booking/${data.id}`;

    if (currentUser) {
      // Already logged in — go straight to booking
      navigate(bookingPath);
    } else {
      // Save redirect target so signup/login can pick it up
      sessionStorage.setItem('postAuthRedirect', bookingPath);
      navigate('/signup');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-amber-800 font-semibold">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-6xl">🔍</div>
          <h1 className="text-2xl font-bold text-stone-800">Profile not found</h1>
          <p className="text-stone-500">This link may be incorrect or the account may no longer exist.</p>
          <a href="https://iluase.com" className="inline-block mt-4 px-6 py-3 bg-amber-700 text-white rounded-xl font-semibold hover:bg-amber-800 transition-colors">
            Visit Ìlú Àṣẹ
          </a>
        </div>
      </div>
    );
  }

  if (data.type !== 'babalawo') return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-100">
      {/* Minimal top bar */}
      <div className="px-6 py-4 flex justify-between items-center max-w-2xl mx-auto">
        <a href="https://iluase.com" className="text-amber-800 font-bold text-sm tracking-wider uppercase opacity-70 hover:opacity-100 transition-opacity">
          Ìlú Àṣẹ
        </a>
        <a href="https://iluase.com/login" className="text-sm text-stone-500 hover:text-stone-700 transition-colors">
          Sign in
        </a>
      </div>

      {/* Hero */}
      <div className="max-w-2xl mx-auto px-6 py-10 text-center space-y-6">
        {/* Avatar */}
        <div className="relative inline-block">
          {data.avatar ? (
            <img
              src={data.avatar}
              alt={data.name}
              className="w-36 h-36 rounded-full object-cover mx-auto border-4 border-white shadow-xl"
            />
          ) : (
            <div className="w-36 h-36 rounded-full bg-amber-200 flex items-center justify-center mx-auto border-4 border-white shadow-xl text-4xl font-bold text-amber-800">
              {data.name.charAt(0).toUpperCase()}
            </div>
          )}
          {data.verified && (
            <div className="absolute bottom-1 right-1 bg-white rounded-full p-0.5 shadow">
              <CheckCircle size={20} className="text-green-500 fill-green-100" />
            </div>
          )}
        </div>

        {/* Name */}
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-stone-900">{data.name}</h1>
          {data.yorubaName && (
            <p className="text-xl text-amber-700 font-semibold italic">{data.yorubaName}</p>
          )}
          <div className="flex items-center justify-center gap-4 text-sm text-stone-500 mt-2 flex-wrap">
            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-semibold text-xs uppercase tracking-wider">
              Babalawo
            </span>
            {data.verified && (
              <span className="flex items-center gap-1 text-green-600 font-semibold text-xs">
                <CheckCircle size={12} /> Verified Practitioner
              </span>
            )}
            {data.location && (
              <span className="flex items-center gap-1 text-stone-400 text-xs">
                <MapPin size={12} /> {data.location}
              </span>
            )}
          </div>
        </div>

        {/* Bio */}
        {data.bio && (
          <p className="text-stone-600 text-lg leading-relaxed max-w-lg mx-auto">{data.bio}</p>
        )}

        {/* CTA */}
        <div className="pt-4 space-y-3">
          <button
            type="button"
            onClick={handleBook}
            className="w-full max-w-sm mx-auto py-5 bg-amber-700 text-white rounded-2xl font-bold text-lg uppercase tracking-wide flex items-center justify-center gap-3 hover:bg-amber-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            <Calendar size={20} />
            Book a Consultation
          </button>
          <p className="text-xs text-stone-400">
            {currentUser ? 'You will be taken to the booking page.' : 'You will need to create a free account to book.'}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-stone-200" />
      </div>

      {/* Trust section */}
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-stone-800">🌿</div>
            <p className="text-xs text-stone-500 font-semibold">Traditional Ifá Practice</p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-stone-800">🤝</div>
            <p className="text-xs text-stone-500 font-semibold">Private Consultations</p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-stone-800">⭐</div>
            <p className="text-xs text-stone-500 font-semibold">Verified by Community</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-10 px-6">
        <p className="text-xs text-stone-400">
          Powered by{' '}
          <a href="https://iluase.com" className="text-amber-700 font-semibold hover:underline">
            Ìlú Àṣẹ
          </a>{' '}
          — Digital Sanctuary for the Ifá Spiritual Community
        </p>
      </div>
    </div>
  );
};

export default BabalawoLandingPage;
