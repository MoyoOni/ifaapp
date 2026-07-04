import React, { useState, useCallback, useEffect } from 'react';
import { User, MapPin, Fingerprint } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { analytics } from '@/lib/analytics';
import { useLanguage } from '@/shared/contexts/language-context';
import { UserRole } from '@common';
import { useNavigate } from 'react-router-dom';
import { getDashboardPathForRole } from '@/shared/config/navigation';
import { useAuth } from '@/shared/hooks/use-auth';

export interface UseOnboardingProps {
  userId?: string;
  userRole?: string;
  onComplete?: () => void;
}

export type OnboardingStep =
  | 'welcome' | 'intent' | 'preferences' | 'role-setup' | 'username'
  | 'credentials' | 'heritage' | 'discover-temples' | 'form' | 'avatar';

/**
 * P2-04: all fetch/validation/state logic extracted verbatim out of
 * onboarding-view.tsx, which is now render-only. No behavior changed —
 * every state variable, effect, and handler here is a straight move, not
 * a rewrite (this file has no test coverage of its own to protect against
 * a rewrite silently changing behavior, so a mechanical move was the
 * deliberately lower-risk choice — see ProBacklog-v1.md P2-04).
 */
export function useOnboarding({ userId: userIdProp, userRole: userRoleProp, onComplete }: UseOnboardingProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user: authUser, setUser } = useAuth();

  // Fall back to auth context when not passed as props (e.g. routed directly to /onboarding)
  const userId = userIdProp ?? authUser?.id;
  const userRole = userRoleProp ?? authUser?.role;

  // ── Progress persistence ─────────────────────────────────────────────────
  const progressKey = userId ? `onboarding_progress_${userId}` : null;

  const getSavedProgress = () => {
    if (!progressKey) return null;
    try { return JSON.parse(localStorage.getItem(progressKey) || 'null'); } catch { return null; }
  };

  const saved = getSavedProgress();
  const [showResumeBanner, setShowResumeBanner] = useState(!!saved);

  const [onboardingStep, setOnboardingStepRaw] = useState<OnboardingStep>(
    saved?.step ?? 'welcome'
  );
  const [welcomeSlide, setWelcomeSlide] = useState(0);
  const [roleSetupComplete, setRoleSetupComplete] = useState(false);

  const [yorubaName, setYorubaName] = useState(saved?.yorubaName ?? '');
  const [location, setLocation] = useState(saved?.location ?? '');
  const [intentTags, setIntentTags] = useState<string[]>(saved?.intentTags ?? []);
  const [preferredLanguage, setPreferredLanguage] = useState<string>(saved?.preferredLanguage ?? 'en');
  const [timezone, setTimezone] = useState<string>(saved?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC');
  const [reconnectingWithHeritage, setReconnectingWithHeritage] = useState<boolean | null>(null);
  const [showCulturalOnboarding, setShowCulturalOnboarding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Accessibility: Announce progress changes to screen readers
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(`Onboarding step: ${onboardingStep.replace('-', ' ')}`);
      utterance.lang = preferredLanguage === 'yo' ? 'yo' : preferredLanguage;
      window.speechSynthesis.cancel(); // Cancel previous announcement
      window.speechSynthesis.speak(utterance);
    }

    // Also update document title for screen readers
    document.title = `Onboarding - ${onboardingStep} | Ìlú Àṣẹ`;
  }, [onboardingStep, preferredLanguage]);

  // Wrap step setter to auto-save progress
  const setOnboardingStep = (step: OnboardingStep) => {
    setOnboardingStepRaw(step);
    analytics.track(`onboarding_${step}`, { userId, role: userRole ?? undefined });
    if (progressKey && step !== 'avatar') {
      try {
        localStorage.setItem(progressKey, JSON.stringify({ step, yorubaName, location, intentTags, preferredLanguage, timezone }));
      } catch { /* ignore */ }
    }
  };

  const clearProgress = () => {
    if (progressKey) localStorage.removeItem(progressKey);
  };

  // Username/slug step (babalawo only)
  const [slugValue, setSlugValue] = useState('');
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  // Vendor registration fields
  const [vendorBusinessName, setVendorBusinessName] = useState('');
  const [vendorDescription, setVendorDescription] = useState('');
  const [vendorNoCounterfeit, setVendorNoCounterfeit] = useState(false);
  const [vendorSubmitting, setVendorSubmitting] = useState(false);

  // Discover Temples step — real data
  const [templePreview, setTemplePreview] = useState<Array<{ id: string; name: string; location?: string; memberCount?: number }>>([]);
  const [templesLoading, setTemplesLoading] = useState(false);
  const [templeCount, setTempleCount] = useState<number | null>(null);

  useEffect(() => {
    if (onboardingStep !== 'discover-temples') return;
    let cancelled = false;
    setTemplesLoading(true);

    // Fetch temple count
    api.get('/temples/count')
      .then(countRes => {
        if (!cancelled) setTempleCount(countRes.data.count || countRes.data);
      })
      .catch(() => { /* ignore count error */ });

    // Fetch temple previews
    api.get('/temples', { params: { limit: 3, verified: 'true' } })
      .then(res => {
        if (!cancelled) setTemplePreview((res.data?.temples ?? res.data ?? []).slice(0, 3));
      })
      .catch(() => { /* non-critical — show static fallback */ })
      .finally(() => { if (!cancelled) setTemplesLoading(false); });
    return () => { cancelled = true; };
  }, [onboardingStep]);

  // Credential upload step (babalawo only)
  const [credentialFiles, setCredentialFiles] = useState<Array<{ name: string; data: string }>>([]);
  const [credentialUploading, setCredentialUploading] = useState(false);
  const credentialInputRef = React.useRef<HTMLInputElement>(null);

  const handleCredentialSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) { alert(`${file.name} exceeds 10MB`); return; }
      const reader = new FileReader();
      reader.onload = ev => {
        setCredentialFiles(prev => [...prev, { name: file.name, data: ev.target?.result as string }]);
      };
      reader.readAsDataURL(file);
    });
    // Reset input so same file can be re-selected
    if (credentialInputRef.current) credentialInputRef.current.value = '';
  };

  const submitCredentials = async () => {
    if (credentialFiles.length === 0) { setOnboardingStep('heritage'); return; }
    setCredentialUploading(true);
    try {
      await api.post('/verification/upload-credentials', { files: credentialFiles });
    } catch (err) {
      logger.error('Credential upload failed:', err);
      // Don't block — let them continue regardless
    } finally {
      setCredentialUploading(false);
      setOnboardingStep('heritage');
    }
  };

  // Avatar upload step — pre-populate with Google avatar if present
  const [avatarPreview, setAvatarPreview] = useState<string | null>(authUser?.avatar ?? null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarPreview || !userId) {
      // Skip — go straight to completion
      await handleSubmit(new Event('submit') as any);
      return;
    }
    setAvatarUploading(true);
    try {
      await api.patch(`/users/${userId}`, { avatar: avatarPreview });
      if (authUser) setUser({ ...authUser, avatar: avatarPreview });
    } catch (err) {
      logger.error('Avatar upload failed:', err);
    } finally {
      setAvatarUploading(false);
      await handleSubmit(new Event('submit') as any);
    }
  };

  const checkSlug = useCallback(async (value: string) => {
    if (value.length < 3) { setSlugAvailable(null); return; }
    setSlugChecking(true);
    try {
      await api.get(`/public/resolve/${value}`);
      setSlugAvailable(false); // 200 = already taken
    } catch {
      setSlugAvailable(true); // 404 = available
    } finally {
      setSlugChecking(false);
    }
  }, []);

  // Define slides inside to access props
  const slides = [
    {
      title: `${t('welcome')}, ${userRole || t('seeker')}`,
      subtitle: "You have found your way to Ìlú Àṣẹ.",
      desc: "A sanctuary where technology serves tradition, not the other way around.",
      icon: React.createElement(Fingerprint, { size: 48, className: 'text-highlight' }),
      audioSrc: '/assets/audio/onboarding/welcome-1.mp3'
    },
    {
      title: t('digital_village'),
      subtitle: "More than just an app.",
      desc: "Here we honor the ancestors, learn the old ways, and build the future together in a living community.",
      icon: React.createElement(MapPin, { size: 48, className: 'text-highlight' }),
      audioSrc: '/assets/audio/onboarding/welcome-2.mp3'
    },
    {
      title: t('your_journey_begins'),
      subtitle: "Walk with purpose.",
      desc: "Whether you are here to learn, to guide, or to trade, you are a vital part of this story.",
      icon: React.createElement(User, { size: 48, className: 'text-highlight' }),
      audioSrc: '/assets/audio/onboarding/welcome-3.mp3'
    }
  ];

  const handleNextSlide = () => {
    if (welcomeSlide < slides.length - 1) {
      setWelcomeSlide(prev => prev + 1);
    } else {
      // All users see intent capture before role-setup
      setOnboardingStep('intent');
    }
  };

  const handleVendorRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorBusinessName.trim()) return;
    setVendorSubmitting(true);
    try {
      await api.post('/marketplace/vendors', {
        businessName: vendorBusinessName.trim(),
        description: vendorDescription.trim() || undefined,
        noCounterfeitSpiritualItems: vendorNoCounterfeit,
      });
    } catch (err: any) {
      // If vendor profile already exists (409), continue — otherwise log
      if (err?.response?.status !== 409) {
        logger.error('Vendor registration failed:', err);
      }
    } finally {
      setVendorSubmitting(false);
      setRoleSetupComplete(true);
      setOnboardingStep('heritage');
    }
  };

  const handleFormNext = (e: React.FormEvent) => {
    e.preventDefault();
    // Go to avatar step before completing
    setOnboardingStep('avatar');
  };

  const completeOnboarding = async () => {
    analytics.track('onboarding_complete', { userId, role: userRole ?? undefined });
    setIsSubmitting(true);
    try {
      if (!userId) {
        logger.warn('User ID is missing, simulating completion');
        setTimeout(() => {
          if (onComplete) onComplete();
          else if (userRole) navigate(getDashboardPathForRole(userRole as UserRole), { replace: true });
          else navigate('/', { replace: true });
        }, 1000);
        return;
      }

      clearProgress();
      const response = await api.patch(`/users/${userId}/onboarding`, {
        yorubaName,
        location,
        intentTags: intentTags.length > 0 ? intentTags : undefined,
        preferredLanguage: preferredLanguage || undefined,
        timezone: timezone || undefined,
        hasOnboarded: true,
      });

      if (userRole === UserRole.BABALAWO && slugValue.length >= 3 && slugAvailable === true) {
        await api.patch(`/users/${userId}`, { slug: slugValue });
      }

      const updatedUser = { ...response.data, hasOnboarded: true };
      setUser(updatedUser);

      if (onComplete) {
        onComplete();
      } else {
        const postRedirect = sessionStorage.getItem('postOnboardingRedirect');
        if (postRedirect) {
          sessionStorage.removeItem('postOnboardingRedirect');
          navigate(postRedirect, { replace: true });
        } else {
          navigate(getDashboardPathForRole(updatedUser.role), { replace: true });
        }
      }
    } catch (error) {
      logger.error('Onboarding failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Called from avatar step — upload avatar then complete
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (avatarPreview && userId) {
      setAvatarUploading(true);
      try {
        await api.patch(`/users/${userId}`, { avatar: avatarPreview });
        if (authUser) setUser({ ...authUser, avatar: avatarPreview });
      } catch (err) {
        logger.error('Avatar upload failed:', err);
      } finally {
        setAvatarUploading(false);
      }
    }
    await completeOnboarding();
  };

  return {
    t,
    navigate,
    authUser,
    userId,
    userRole,
    saved,
    showResumeBanner, setShowResumeBanner,
    onboardingStep, setOnboardingStep, setOnboardingStepRaw,
    welcomeSlide, setWelcomeSlide,
    roleSetupComplete, setRoleSetupComplete,
    yorubaName, setYorubaName,
    location, setLocation,
    intentTags, setIntentTags,
    preferredLanguage, setPreferredLanguage,
    timezone, setTimezone,
    reconnectingWithHeritage, setReconnectingWithHeritage,
    showCulturalOnboarding, setShowCulturalOnboarding,
    isSubmitting,
    slugValue, setSlugValue,
    slugChecking,
    slugAvailable, setSlugAvailable,
    vendorBusinessName, setVendorBusinessName,
    vendorDescription, setVendorDescription,
    vendorNoCounterfeit, setVendorNoCounterfeit,
    vendorSubmitting,
    templePreview,
    templesLoading,
    templeCount,
    credentialFiles, setCredentialFiles,
    credentialUploading,
    credentialInputRef,
    handleCredentialSelect,
    submitCredentials,
    avatarPreview, setAvatarPreview,
    avatarUploading,
    avatarInputRef,
    handleAvatarSelect,
    handleAvatarUpload,
    checkSlug,
    slides,
    handleNextSlide,
    handleVendorRegister,
    handleFormNext,
    completeOnboarding,
    handleSubmit,
    clearProgress,
  };
}
