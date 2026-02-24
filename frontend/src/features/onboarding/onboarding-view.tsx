import React, { useState } from 'react';
import { User, MapPin, ArrowRight, LogOut, ChevronRight, Fingerprint } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import CulturalOnboardingPath from './cultural-onboarding-path';
import YorubaInputHelper from '@/shared/components/yoruba-input-helper';
import NarratorControl from '@/shared/components/narrator-control';
import { useLanguage } from '@/shared/contexts/language-context';
import { UserRole } from '@common';
import { useNavigate } from 'react-router-dom';
import { getDashboardPathForRole } from '@/shared/config/navigation';
import { useAuth } from '@/shared/hooks/use-auth'; // Import useAuth hook

interface OnboardingViewProps {
  userId?: string;
  userRole?: string;
  onComplete?: () => void;
  onLogout?: () => void;
}

/**
 * Onboarding View
 * Fast-track setup flow for new users
 * NOTE: "Personal Awo" relationship is sacred - users may change but not "unfriend" like social media
 */
const OnboardingView: React.FC<OnboardingViewProps> = ({
  userId,
  userRole,
  onComplete,
  onLogout,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate(); // Add navigate hook
  const { setUser } = useAuth(); // Get setUser from auth context
  const [onboardingStep, setOnboardingStep] = useState<'welcome' | 'heritage' | 'form'>('welcome');
  const [welcomeSlide, setWelcomeSlide] = useState(0);

  const [yorubaName, setYorubaName] = useState('');
  const [location, setLocation] = useState('');
  const [reconnectingWithHeritage, setReconnectingWithHeritage] = useState<boolean | null>(null);
  const [showCulturalOnboarding, setShowCulturalOnboarding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define slides inside to access props
  const slides = [
    {
      title: `${t('welcome')}, ${userRole || t('seeker')}`,
      subtitle: "You have found your way to Ìlú Àṣẹ.",
      desc: "A sanctuary where technology serves tradition, not the other way around.",
      icon: <Fingerprint size={48} className="text-highlight" />,
      audioSrc: '/assets/audio/onboarding/welcome-1.mp3'
    },
    {
      title: t('digital_village'),
      subtitle: "More than just an app.",
      desc: "Here we honor the ancestors, learn the old ways, and build the future together in a living community.",
      icon: <MapPin size={48} className="text-highlight" />,
      audioSrc: '/assets/audio/onboarding/welcome-2.mp3'
    },
    {
      title: t('your_journey_begins'),
      subtitle: "Walk with purpose.",
      desc: "Whether you are here to learn, to guide, or to trade, you are a vital part of this story.",
      icon: <User size={48} className="text-highlight" />,
      audioSrc: '/assets/audio/onboarding/welcome-3.mp3'
    }
  ];

  const handleNextSlide = () => {
    if (welcomeSlide < slides.length - 1) {
      setWelcomeSlide(prev => prev + 1);
    } else {
      setOnboardingStep('heritage');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!userId) {
        // Fallback for dev/demo if userId is missing
        logger.warn('User ID is missing, simulating completion');
        setTimeout(() => {
          if (onComplete) onComplete();
          // Navigate to appropriate dashboard after completion
          else if (userRole) {
            navigate(getDashboardPathForRole(userRole as UserRole), { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }, 1000);
        return;
      }

      // Complete onboarding via API
      const response = await api.patch(`/users/${userId}/onboarding`, {
        yorubaName,
        location,
        hasOnboarded: true,
      });

      // Update the user state with the new onboarding status
      const updatedUser = {
        ...response.data,
        hasOnboarded: true
      };
      
      // Update the user in auth context
      setUser(updatedUser);

      if (onComplete) {
        onComplete();
      } else {
        // Navigate to appropriate dashboard after completion
        navigate(getDashboardPathForRole(updatedUser.role), { replace: true });
      }
    } catch (error) {
      logger.error('Onboarding failed:', error);
      // Handle error - show message to user
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>

      <div className="max-w-lg w-full space-y-8 relative z-10 animate-in fade-in zoom-in-95 duration-700">

        {/* Welcome Slides */}
        {onboardingStep === 'welcome' && (
          <div className="bg-white rounded-[2rem] p-10 border border-stone-100 shadow-xl text-center space-y-8 animate-in slide-in-from-bottom-8 duration-500">
            <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative group">
              {slides[welcomeSlide].icon}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                <NarratorControl
                  src={slides[welcomeSlide].audioSrc}
                  autoPlay={true}
                  className="shadow-lg bg-stone-900 border-stone-700 hover:scale-105"
                />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-bold brand-font text-stone-900 leading-none">{slides[welcomeSlide].title}</h2>
              <h3 className="text-xl text-highlight font-bold">{slides[welcomeSlide].subtitle}</h3>
              <p className="text-stone-500 leading-relaxed font-light text-lg">{slides[welcomeSlide].desc}</p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-4">
              {slides.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === welcomeSlide ? 'w-8 bg-highlight' : 'w-2 bg-stone-200'}`} />
              ))}
            </div>

            <button
              onClick={handleNextSlide}
              className="w-full py-5 bg-stone-900 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {welcomeSlide === slides.length - 1 ? t('enter_village') : t('continue')} <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Heritage Reconnection Question */}
        {onboardingStep === 'heritage' && (
          <div className="bg-white rounded-[2rem] p-8 md:p-10 border border-stone-100 shadow-xl shadow-stone-200/40 space-y-8 animate-in slide-in-from-bottom-8 duration-500">
            {/* Header for Heritage Step */}
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-3xl font-bold brand-font text-stone-800">E kaabo, Initiate.</h2>
              <p className="text-stone-400 text-sm font-bold uppercase tracking-widest">Setup Step 1 of 2</p>
            </div>

            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold brand-font text-stone-800">
                Are you reconnecting with your heritage?
              </h3>
              <p className="text-stone-500 text-lg">
                We can provide cultural guidance and resources to help you orient yourself in the tradition.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setReconnectingWithHeritage(true);
                  setShowCulturalOnboarding(true);
                  // Don't advance step immediately if showing cultural onboarding
                }}
                className="py-5 px-6 bg-highlight text-white rounded-xl font-bold text-lg hover:bg-yellow-500 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                Yes, guide me
                <span className="block text-xs font-normal opacity-80 mt-1">I'm re-learning my roots</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setReconnectingWithHeritage(false);
                  setOnboardingStep('form');
                }}
                className="py-5 px-6 bg-stone-100 text-stone-600 rounded-xl font-bold text-lg hover:bg-stone-200 transition-all"
              >
                I'm familiar
                <span className="block text-xs font-normal opacity-60 mt-1">I know the tradition</span>
              </button>
            </div>
          </div>
        )}

        {/* Cultural Onboarding Path */}
        {showCulturalOnboarding && reconnectingWithHeritage && (
          <div className="bg-white rounded-[2rem] overflow-hidden border border-stone-100 shadow-2xl animate-in zoom-in-95 duration-500">
            <CulturalOnboardingPath
              onContinue={() => {
                setShowCulturalOnboarding(false);
                setOnboardingStep('form');
              }}
            />
          </div>
        )}

        {/* Main Onboarding Form */}
        {onboardingStep === 'form' && !showCulturalOnboarding && (
          <div className="bg-white rounded-[2rem] p-8 md:p-10 border border-stone-100 shadow-xl shadow-stone-200/40 space-y-8 animate-in slide-in-from-bottom-8 duration-500">
            <div className="text-center space-y-2 mb-2">
              <h2 className="text-3xl font-bold brand-font text-stone-800">Final Steps</h2>
              <p className="text-stone-400 text-sm font-bold uppercase tracking-widest">Setup Step 2 of 2</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Yoruba Name */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase text-stone-400 tracking-widest flex items-center gap-2">
                  <User size={14} />
                  Your Spirit Name (Orúkọ)
                </label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-highlight transition-colors" size={20} />
                  <input
                    type="text"
                    value={yorubaName}
                    onChange={(e) => setYorubaName(e.target.value)}
                    placeholder="Enter your Yoruba name"
                    className="w-full bg-stone-50 border-stone-200 border p-5 pl-14 rounded-xl text-lg font-bold text-stone-800 outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight transition-all placeholder:text-stone-300"
                    maxLength={100}
                  />
                  <YorubaInputHelper fieldName="Yoruba name" />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase text-stone-400 tracking-widest flex items-center gap-2">
                  <MapPin size={14} />
                  Current Location
                </label>
                <div className="relative group">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-highlight transition-colors" size={20} />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Lagos, Nigeria"
                    className="w-full bg-stone-50 border-stone-200 border p-5 pl-14 rounded-xl text-lg font-bold text-stone-800 outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight transition-all placeholder:text-stone-300"
                    maxLength={200}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 bg-highlight text-white rounded-xl font-bold text-lg uppercase tracking-wide flex items-center justify-center gap-3 hover:bg-yellow-500 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>Processing...</>
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            {/* Logout Option */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full py-2 text-stone-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:text-stone-600 transition-all"
              >
                <LogOut size={14} />
                Sign Out / Cancel
              </button>
            )}
          </div>
        )}

        {/* Footer Note */}
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300">
          Digital Sanctuary &bull; Est. 2026
        </p>
      </div>
    </div>
  );
};

export default OnboardingView;
