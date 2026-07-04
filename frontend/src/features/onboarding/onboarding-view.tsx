import React from 'react';
import { ChevronRight, ArrowRight, LogOut, Link, Building2, X, User, MapPin } from 'lucide-react';
import CulturalOnboardingPath from './cultural-onboarding-path';
import YorubaInputHelper from '@/shared/components/yoruba-input-helper';
import NarratorControl from '@/shared/components/narrator-control';
import { UserRole } from '@common';
import { useOnboarding } from './hooks/use-onboarding';

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
 *
 * P2-04: render-only — all fetch/validation/state logic lives in useOnboarding().
 */
const OnboardingView: React.FC<OnboardingViewProps> = ({
  userId: userIdProp,
  userRole: userRoleProp,
  onComplete,
  onLogout,
}) => {
  const {
    t,
    navigate,
    authUser,
    userRole,
    saved,
    showResumeBanner, setShowResumeBanner,
    onboardingStep, setOnboardingStep, setOnboardingStepRaw,
    welcomeSlide,
    setRoleSetupComplete,
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
    clearProgress,
  } = useOnboarding({ userId: userIdProp, userRole: userRoleProp, onComplete });

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>

      <div className="max-w-lg w-full space-y-8 relative z-10 animate-in fade-in zoom-in-95 duration-700">

        {/* Resume banner */}
        {showResumeBanner && saved?.step && saved.step !== 'welcome' && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl px-5 py-3 flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300" role="alert" aria-live="polite">
            <p className="text-sm text-amber-800 dark:text-amber-400 font-medium">
              Welcome back — resuming where you left off.
            </p>
            <button
              type="button"
              onClick={() => { clearProgress(); setOnboardingStepRaw('welcome'); setShowResumeBanner(false); }}
              className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline whitespace-nowrap"
              aria-label="Start onboarding over"
            >
              Start over
            </button>
          </div>
        )}

        {/* Progress indicator */}
        {onboardingStep !== 'welcome' && !showCulturalOnboarding && (
          <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm" role="progressbar" aria-valuenow={onboardingStep === 'intent' ? 1 : onboardingStep === 'preferences' ? 2 : onboardingStep === 'role-setup' ? 3 : onboardingStep === 'heritage' ? 4 : onboardingStep === 'discover-temples' ? 5 : onboardingStep === 'form' ? 6 : 7} aria-valuemin={1} aria-valuemax={7}>
            <div className="flex justify-between text-xs text-stone-500 mb-1">
              <span>Step {onboardingStep === 'intent' ? 1 : onboardingStep === 'preferences' ? 2 : onboardingStep === 'role-setup' ? 3 : onboardingStep === 'heritage' ? 4 : onboardingStep === 'discover-temples' ? 5 : onboardingStep === 'form' ? 6 : 7} of 7</span>
              <span>{Math.round(((onboardingStep === 'intent' ? 1 : onboardingStep === 'preferences' ? 2 : onboardingStep === 'role-setup' ? 3 : onboardingStep === 'heritage' ? 4 : onboardingStep === 'discover-temples' ? 5 : onboardingStep === 'form' ? 6 : 7) / 7) * 100)}%</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-2">
              <div 
                className="bg-highlight h-2 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${(onboardingStep === 'intent' ? 1 : onboardingStep === 'preferences' ? 2 : onboardingStep === 'role-setup' ? 3 : onboardingStep === 'heritage' ? 4 : onboardingStep === 'discover-temples' ? 5 : onboardingStep === 'form' ? 6 : 7) * (100/7)}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Welcome Slides */}
        {onboardingStep === 'welcome' && (
          <div className="bg-card rounded-[2rem] p-10 border border-border/50 shadow-xl text-center space-y-8 animate-in slide-in-from-bottom-8 duration-500 relative">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to exit onboarding? You can always come back later.')) {
                  navigate('/');
                }
              }}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
              aria-label="Close onboarding"
            >
              <X size={20} />
            </button>
            
            <div className="w-24 h-24 bg-muted/40 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative group">
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
              <h2 className="text-4xl font-bold brand-font text-stone-900 dark:text-stone-100 leading-none">{slides[welcomeSlide].title}</h2>
              <h3 className="text-xl text-highlight font-bold">{slides[welcomeSlide].subtitle}</h3>
              <p className="text-stone-500 leading-relaxed font-light text-lg">{slides[welcomeSlide].desc}</p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-4">
              {slides.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === welcomeSlide ? 'w-8 bg-highlight' : 'w-2 bg-muted'}`} />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNextSlide}
              className="w-full py-5 bg-stone-900 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {welcomeSlide === slides.length - 1 ? t('enter_village') : t('continue')} <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Intent Capture Step */}
        {onboardingStep === 'intent' && (
          <div className="bg-card rounded-[2rem] p-8 md:p-10 border border-border/50 shadow-xl shadow-stone-200/40 space-y-8 animate-in slide-in-from-bottom-8 duration-500 relative">
            <button
              type="button"
              onClick={() => setOnboardingStep('welcome')}
              className="absolute top-4 left-4 text-stone-400 hover:text-stone-600 transition-colors"
              aria-label="Go back to welcome"
            >
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-3xl font-bold brand-font text-stone-800 dark:text-stone-200">What brings you to Ìlú Àṣẹ?</h2>
              <p className="text-stone-400 text-sm font-bold uppercase tracking-widest">Help us personalise your experience</p>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-stone-300 scrollbar-track-stone-100 dark:scrollbar-thumb-stone-700 dark:scrollbar-track-stone-900 rounded-lg">
              <p className="text-stone-600 dark:text-stone-300 text-center">Choose one or more options (up to 2)</p>
              
              {[
                { id: 'reconnect', label: 'I want to reconnect with my Yoruba roots' },
                { id: 'guidance', label: 'I\'m seeking spiritual guidance or divination' },
                { id: 'learning', label: 'I want to learn about Ifá and Isese' },
                { id: 'practice', label: 'I\'m a practitioner building my practice' },
                { id: 'products', label: 'I\'m selling sacred items and supplies' },
                { id: 'exploring', label: 'I\'m just exploring — I\'m curious' }
              ].map((option) => (
                <div key={option.id} className="flex items-center p-2 -m-2 rounded-lg hover:bg-muted/40 transition-colors focus-within:bg-muted/40">
                  <input
                    type="checkbox"
                    id={`intent-${option.id}`}
                    checked={intentTags.includes(option.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (intentTags.length < 2) {
                          setIntentTags([...intentTags, option.id]);
                        }
                      } else {
                        setIntentTags(intentTags.filter(tag => tag !== option.id));
                      }
                    }}
                    className="h-5 w-5 rounded border-border text-highlight focus:ring-highlight"
                  />
                  <label htmlFor={`intent-${option.id}`} className="ml-3 text-stone-700 dark:text-stone-200 flex-1 cursor-pointer">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setOnboardingStep('preferences')}
                disabled={intentTags.length === 0}
                className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${
                  intentTags.length > 0
                    ? 'bg-highlight text-white hover:bg-yellow-500 shadow-lg'
                    : 'bg-muted/40 text-stone-400 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => setOnboardingStep('role-setup')}
                className="flex-1 py-4 bg-muted/60 text-stone-600 rounded-xl font-bold text-lg hover:bg-muted transition-all"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* Preferences Step — timezone & language */}
        {onboardingStep === 'preferences' && (
          <div className="bg-card rounded-[2rem] p-8 md:p-10 border border-border/50 shadow-xl space-y-6 animate-in slide-in-from-bottom-8 duration-500 relative">
            <button
              type="button"
              onClick={() => setOnboardingStep('intent')}
              className="absolute top-4 left-4 text-stone-400 hover:text-stone-600 transition-colors"
              aria-label="Go back to intent selection"
            >
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-muted/40 rounded-2xl flex items-center justify-center mx-auto text-3xl">🌐</div>
              <h2 className="text-3xl font-bold brand-font text-stone-800 dark:text-stone-200">Your Preferences</h2>
              <p className="text-stone-500 text-sm">Help us communicate with you in your language.</p>
            </div>

            <div className="space-y-5">
              {/* Language */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-stone-400 tracking-widest">Preferred Language</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { code: 'en', label: 'English', flag: '🇬🇧' },
                    { code: 'yo', label: 'Yorùbá', flag: '🌍' },
                    { code: 'fr', label: 'Français', flag: '🇫🇷' },
                    { code: 'pt', label: 'Português', flag: '🇧🇷' },
                  ].map(lang => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setPreferredLanguage(lang.code)}
                      className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 text-sm font-semibold ${
                        preferredLanguage === lang.code
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border bg-muted/20 text-foreground hover:border-primary/30'
                      }`}
                      aria-pressed={preferredLanguage === lang.code}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      {lang.label}
                      {preferredLanguage === lang.code && <span className="ml-auto text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-stone-400 tracking-widest">Your Timezone</label>
                <select
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  aria-label="Your timezone"
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                >
                  {[
                    { value: 'Africa/Lagos', label: 'Lagos, Nigeria (WAT)' },
                    { value: 'Europe/London', label: 'London, UK (GMT/BST)' },
                    { value: 'America/New_York', label: 'New York, USA (EST)' },
                    { value: 'America/Chicago', label: 'Chicago, USA (CST)' },
                    { value: 'America/Los_Angeles', label: 'Los Angeles, USA (PST)' },
                    { value: 'America/Toronto', label: 'Toronto, Canada (EST)' },
                    { value: 'Europe/Paris', label: 'Paris, France (CET)' },
                    { value: 'Africa/Accra', label: 'Accra, Ghana (GMT)' },
                    { value: 'Africa/Abidjan', label: 'Abidjan, Côte d\'Ivoire (GMT)' },
                    { value: 'America/Sao_Paulo', label: 'São Paulo, Brazil (BRT)' },
                    { value: 'UTC', label: 'UTC (Universal Time)' },
                  ].map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Detected: <span className="font-medium">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (userRole === UserRole.BABALAWO || userRole === UserRole.VENDOR) {
                    setOnboardingStep('role-setup');
                  } else {
                    setOnboardingStep('heritage');
                  }
                }}
                className="flex-1 py-4 bg-muted/60 text-stone-500 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-muted transition-all"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => {
                  if (userRole === UserRole.BABALAWO || userRole === UserRole.VENDOR) {
                    setOnboardingStep('role-setup');
                  } else {
                    setOnboardingStep('heritage');
                  }
                }}
                className="flex-[2] py-4 bg-stone-900 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                Continue <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Role-Specific Setup Step (Babalawo & Vendor only) */}
        {onboardingStep === 'role-setup' && userRole === UserRole.BABALAWO && (
          <div className="bg-card rounded-[2rem] p-8 md:p-10 border border-border/50 shadow-xl space-y-6 animate-in slide-in-from-bottom-8 duration-500 relative">
            <button
              type="button"
              onClick={() => setOnboardingStep('preferences')}
              className="absolute top-4 left-4 text-stone-400 hover:text-stone-600 transition-colors"
              aria-label="Go back to preferences"
            >
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-muted/40 rounded-2xl flex items-center justify-center mx-auto text-3xl">🌿</div>
              <h2 className="text-3xl font-bold brand-font text-stone-800 dark:text-stone-200">Your Practice</h2>
              <p className="text-stone-400 text-sm font-bold uppercase tracking-widest">Babalawo Setup</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 rounded-2xl p-5 space-y-3">
              <p className="text-amber-800 dark:text-amber-400 font-bold text-sm">Verification Required</p>
              <p className="text-amber-700 dark:text-amber-400 text-sm leading-relaxed">
                To accept clients, your profile will need to be reviewed by our admin team. After completing setup, you can upload credentials from your profile.
              </p>
              <ul className="space-y-1.5 text-sm text-amber-700 dark:text-amber-400">
                {['Certificate of initiation or training', 'Reference from a recognized temple', 'Brief biography of your practice'].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-amber-500 dark:text-amber-400 mt-0.5">•</span>{item}
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => { setRoleSetupComplete(true); setOnboardingStep('username'); }}
              className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              I understand <ChevronRight size={16} />
            </button>
          </div>
        )}

        {onboardingStep === 'role-setup' && userRole === UserRole.VENDOR && (
          <div className="bg-card rounded-[2rem] p-8 md:p-10 border border-border/50 shadow-xl space-y-6 animate-in slide-in-from-bottom-8 duration-500 relative">
            <button
              type="button"
              onClick={() => setOnboardingStep('preferences')}
              className="absolute top-4 left-4 text-stone-400 hover:text-stone-600 transition-colors"
              aria-label="Go back to preferences"
            >
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-muted/40 rounded-2xl flex items-center justify-center mx-auto text-3xl">🛍️</div>
              <h2 className="text-3xl font-bold brand-font text-stone-800 dark:text-stone-200">Register Your Shop</h2>
              <p className="text-stone-400 text-sm font-bold uppercase tracking-widest">Vendor Setup</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 rounded-2xl p-4 text-sm text-amber-800 dark:text-amber-400">
              Your shop will be reviewed by our admin team before you can list products. This usually takes 1–2 business days.
            </div>
            <form onSubmit={handleVendorRegister} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-stone-400 tracking-widest">Business / Shop Name *</label>
                <input
                  type="text"
                  required
                  value={vendorBusinessName}
                  onChange={e => setVendorBusinessName(e.target.value)}
                  placeholder="e.g. Ẹkùn Ifá Sacred Supplies"
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight"
                  maxLength={100}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-stone-400 tracking-widest">Shop Description <span className="normal-case font-normal">(optional)</span></label>
                <textarea
                  rows={3}
                  value={vendorDescription}
                  onChange={e => setVendorDescription(e.target.value)}
                  placeholder="Tell the community what you sell and your connection to the tradition"
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight resize-none"
                  maxLength={500}
                />
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vendorNoCounterfeit}
                  onChange={e => setVendorNoCounterfeit(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-primary"
                />
                <span className="text-sm text-stone-600 dark:text-stone-400">
                  I agree not to sell counterfeit spiritual items or items that misrepresent their cultural origin
                </span>
              </label>
              <button
                type="submit"
                disabled={vendorSubmitting || !vendorBusinessName.trim()}
                className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {vendorSubmitting ? 'Submitting...' : <>Register Shop <ChevronRight size={16} /></>}
              </button>
            </form>
          </div>
        )}

        {/* Username Step (Babalawo only) */}
        {onboardingStep === 'username' && userRole === UserRole.BABALAWO && (
          <div className="bg-card rounded-[2rem] p-8 md:p-10 border border-border/50 shadow-xl space-y-6 animate-in slide-in-from-bottom-8 duration-500 relative">
            <button
              type="button"
              onClick={() => setOnboardingStep('role-setup')}
              className="absolute top-4 left-4 text-stone-400 hover:text-stone-600 transition-colors"
              aria-label="Go back to role setup"
            >
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-muted/40 rounded-2xl flex items-center justify-center mx-auto text-3xl">🔗</div>
              <h2 className="text-3xl font-bold brand-font text-stone-800 dark:text-stone-200">Your Personal Link</h2>
              <p className="text-stone-400 text-sm font-bold uppercase tracking-widest">Choose Your Address</p>
            </div>
            <p className="text-stone-500 text-center text-sm">
              Seekers will find you at this address. Share it on social media, business cards, anywhere.
            </p>
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase text-stone-400 tracking-widest flex items-center gap-2">
                <Link size={14} />
                Your site name
              </label>
              <div className="flex items-center gap-0 border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-highlight/50 focus-within:border-highlight bg-muted/40">
                <input
                  type="text"
                  value={slugValue}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);
                    setSlugValue(val);
                    setSlugAvailable(null);
                    if (val.length >= 3) checkSlug(val);
                  }}
                  placeholder="yourname"
                  className="flex-1 bg-transparent p-4 text-lg font-bold text-stone-800 dark:text-stone-200 outline-none placeholder:text-stone-300 min-w-0"
                  maxLength={30}
                />
                <span className="px-4 text-stone-400 font-semibold text-sm whitespace-nowrap">.iluase.com</span>
              </div>
              {slugChecking && <p className="text-xs text-stone-400">Checking availability...</p>}
              {!slugChecking && slugAvailable === true && (
                <p className="text-xs text-green-600 dark:text-green-400 font-semibold">✓ Available — this address is yours</p>
              )}
              {!slugChecking && slugAvailable === false && (
                <p className="text-xs text-red-500 dark:text-red-400 font-semibold">✗ Already taken — try a different name</p>
              )}
              {slugValue.length >= 3 && slugAvailable === true && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 rounded-xl p-3 text-sm text-amber-800 dark:text-amber-400">
                  Preview: <strong>{slugValue}.iluase.com</strong>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOnboardingStep('credentials')}
                className="flex-1 py-4 bg-muted/60 text-stone-500 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-muted transition-all"
              >
                Skip for now
              </button>
              <button
                type="button"
                disabled={slugValue.length >= 3 && (slugChecking || slugAvailable === false)}
                onClick={() => setOnboardingStep('credentials')}
                className="flex-[2] py-4 bg-stone-900 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Credential Upload Step (Babalawo only) */}
        {onboardingStep === 'credentials' && userRole === UserRole.BABALAWO && (
          <div className="bg-card rounded-[2rem] p-8 md:p-10 border border-border/50 shadow-xl space-y-6 animate-in slide-in-from-bottom-8 duration-500 relative">
            <button
              type="button"
              onClick={() => setOnboardingStep('username')}
              className="absolute top-4 left-4 text-stone-400 hover:text-stone-600 transition-colors"
              aria-label="Go back to username selection"
            >
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-muted/40 rounded-2xl flex items-center justify-center mx-auto text-3xl">📜</div>
              <h2 className="text-3xl font-bold brand-font text-stone-800 dark:text-stone-200">Upload Credentials</h2>
              <p className="text-stone-400 text-sm font-bold uppercase tracking-widest">Optional — speeds up verification</p>
            </div>

            <p className="text-stone-500 text-sm text-center leading-relaxed">
              Upload your certificate of initiation, temple reference letter, or any document that supports your verification. Our admin team will review these privately.
            </p>

            {/* Drop zone */}
            <button
              type="button"
              onClick={() => credentialInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/40 hover:bg-primary/5 transition-all group"
              aria-label="Upload credential documents"
            >
              <div className="text-4xl mb-2">📎</div>
              <p className="text-sm font-bold text-stone-600 dark:text-stone-400 group-hover:text-primary transition-colors">Tap to upload documents</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG · Max 10MB per file</p>
            </button>
            <input
              ref={credentialInputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              aria-label="Upload credential documents"
              title="Upload credential documents"
              onChange={handleCredentialSelect}
            />

            {/* Uploaded file list */}
            {credentialFiles.length > 0 && (
              <ul className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-stone-300 scrollbar-track-stone-100 dark:scrollbar-thumb-stone-700 dark:scrollbar-track-stone-900 rounded-lg">
                {credentialFiles.map((f, i) => (
                  <li key={i} className="flex items-center justify-between bg-muted/40 rounded-xl px-4 py-3 text-sm">
                    <span className="text-foreground font-medium truncate flex-1">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setCredentialFiles(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-xs text-muted-foreground hover:text-red-500 ml-3 transition-colors"
                      aria-label={`Remove ${f.name}`}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOnboardingStep('heritage')}
                className="flex-1 py-4 bg-muted/60 text-stone-500 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-muted transition-all"
              >
                Skip for now
              </button>
              <button
                type="button"
                disabled={credentialUploading}
                onClick={submitCredentials}
                className="flex-[2] py-4 bg-stone-900 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {credentialUploading ? 'Uploading...' : credentialFiles.length > 0 ? <>Submit & Continue <ChevronRight size={16} /></> : <>Continue <ChevronRight size={16} /></>}
              </button>
            </div>
          </div>
        )}

        {/* Heritage Reconnection Question */}
        {onboardingStep === 'heritage' && (
          <div className="bg-card rounded-[2rem] p-8 md:p-10 border border-border/50 shadow-xl shadow-stone-200/40 space-y-8 animate-in slide-in-from-bottom-8 duration-500 relative">
            <button
              type="button"
              onClick={() => {
                if (userRole === UserRole.BABALAWO || userRole === UserRole.VENDOR) {
                  if (userRole === UserRole.BABALAWO) {
                    setOnboardingStep('credentials');
                  } else {
                    setOnboardingStep('role-setup');
                  }
                } else {
                  setOnboardingStep('preferences');
                }
              }}
              className="absolute top-4 left-4 text-stone-400 hover:text-stone-600 transition-colors"
              aria-label="Go back to previous step"
            >
              <ChevronRight size={20} className="rotate-180" />
            </button>
            {/* Header for Heritage Step */}
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-3xl font-bold brand-font text-stone-800 dark:text-stone-200">E kaabo, Initiate.</h2>
              <p className="text-stone-400 text-sm font-bold uppercase tracking-widest">Setup Step 1 of 2</p>
            </div>

            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold brand-font text-stone-800 dark:text-stone-200">
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
                  setOnboardingStep(userRole === UserRole.CLIENT ? 'discover-temples' : 'form');
                }}
                className="py-5 px-6 bg-muted/60 text-stone-600 rounded-xl font-bold text-lg hover:bg-muted transition-all"
              >
                I'm familiar
                <span className="block text-xs font-normal opacity-60 mt-1">I know the tradition</span>
              </button>
            </div>
          </div>
        )}

        {/* Cultural Onboarding Path */}
        {showCulturalOnboarding && reconnectingWithHeritage && (
          <div className="bg-card rounded-[2rem] overflow-hidden border border-border/50 shadow-2xl animate-in zoom-in-95 duration-500 relative">
            <button
              type="button"
              onClick={() => {
                setShowCulturalOnboarding(false);
                setOnboardingStep(userRole === UserRole.CLIENT ? 'discover-temples' : 'form');
              }}
              className="absolute top-4 right-4 z-10 text-stone-400 hover:text-stone-600 transition-colors"
              aria-label="Close cultural onboarding"
            >
              <X size={20} />
            </button>
            <CulturalOnboardingPath
              onContinue={() => {
                setShowCulturalOnboarding(false);
                setOnboardingStep(userRole === UserRole.CLIENT ? 'discover-temples' : 'form');
              }}
            />
          </div>
        )}

        {/* Discover Temples Step (CLIENT only) */}
        {onboardingStep === 'discover-temples' && (
          <div className="bg-card rounded-[2rem] p-8 md:p-10 border border-border/50 shadow-xl space-y-6 animate-in slide-in-from-bottom-8 duration-500 relative">
            <button
              type="button"
              onClick={() => setOnboardingStep('heritage')}
              className="absolute top-4 left-4 text-stone-400 hover:text-stone-600 transition-colors"
              aria-label="Go back to heritage question"
            >
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <div className="text-center space-y-3">
              <div className="w-20 h-20 bg-amber-50 dark:bg-amber-950/30 rounded-full flex items-center justify-center mx-auto">
                <Building2 size={36} className="text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-3xl font-bold brand-font text-stone-900 dark:text-stone-100">Find Your Spiritual Home</h2>
              <p className="text-stone-500 text-base leading-relaxed">
                {templeCount !== null 
                  ? `Join ${templeCount} registered Ilé Ìjúbà and Ilé Ifá congregations on our platform.`
                  : 'Ilé Ìjúbà and Ilé Ifá congregations are registered on our platform.'}{' '}
                Connect with one and become part of the community.
              </p>
            </div>

            {/* Temple preview cards */}
            {templesLoading ? (
              <div className="space-y-2">
                {[0,1,2].map(i => (
                  <div key={i} className="h-14 bg-muted/40 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : templePreview.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-stone-300 scrollbar-track-stone-100 dark:scrollbar-thumb-stone-700 dark:scrollbar-track-stone-900 rounded-lg">
                {templePreview.map(temple => (
                  <div key={temple.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                      <Building2 size={16} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{temple.name}</p>
                      {temple.location && <p className="text-xs text-muted-foreground truncate">{temple.location}</p>}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-center text-muted-foreground pt-1">And many more waiting for you…</p>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                onClick={() => { navigate('/client/temples'); if (onComplete) onComplete(); }}
                className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold text-lg hover:bg-amber-600 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Building2 size={20} />
                Explore All Temples
              </button>
              <button
                type="button"
                onClick={() => setOnboardingStep('form')}
                className="w-full py-3 text-stone-400 text-sm font-semibold hover:text-stone-600 transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* Main Onboarding Form */}
        {onboardingStep === 'form' && !showCulturalOnboarding && (
          <div className="bg-card rounded-[2rem] p-8 md:p-10 border border-border/50 shadow-xl shadow-stone-200/40 space-y-8 animate-in slide-in-from-bottom-8 duration-500 relative">
            <button
              type="button"
              onClick={() => {
                if (userRole === UserRole.CLIENT) {
                  setOnboardingStep('discover-temples');
                } else {
                  setOnboardingStep('heritage');
                }
              }}
              className="absolute top-4 left-4 text-stone-400 hover:text-stone-600 transition-colors"
              aria-label="Go back to previous step"
            >
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <div className="text-center space-y-2 mb-2">
              <h2 className="text-3xl font-bold brand-font text-stone-800 dark:text-stone-200">Final Steps</h2>
              <p className="text-stone-400 text-sm font-bold uppercase tracking-widest">Setup Step 2 of 2</p>
            </div>

            <form onSubmit={handleFormNext} className="space-y-6">
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
                    className="w-full bg-muted/40 border-border border p-5 pl-14 rounded-xl text-lg font-bold text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight transition-all placeholder:text-stone-300"
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
                    className="w-full bg-muted/40 border-border border p-5 pl-14 rounded-xl text-lg font-bold text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight transition-all placeholder:text-stone-300"
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
                type="button"
                onClick={onLogout}
                className="w-full py-2 text-stone-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:text-stone-600 transition-all"
              >
                <LogOut size={14} />
                Sign Out / Cancel
              </button>
            )}
          </div>
        )}

        {/* Avatar Upload Step */}
        {onboardingStep === 'avatar' && (
          <div className="bg-card rounded-[2rem] p-8 md:p-10 border border-border/50 shadow-xl space-y-6 animate-in slide-in-from-bottom-8 duration-500 text-center relative">
            <button
              type="button"
              onClick={() => {
                if (userRole === UserRole.CLIENT) {
                  setOnboardingStep('form');
                } else {
                  setOnboardingStep('form');
                }
              }}
              className="absolute top-4 left-4 text-stone-400 hover:text-stone-600 transition-colors"
              aria-label="Go back to profile form"
            >
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <div className="space-y-2">
              <div className="w-16 h-16 bg-muted/40 rounded-2xl flex items-center justify-center mx-auto text-3xl">📸</div>
              <h2 className="text-3xl font-bold brand-font text-stone-800 dark:text-stone-200">Add Your Photo</h2>
              <p className="text-stone-400 text-sm font-bold uppercase tracking-widest">Optional — helps the community know you</p>
            </div>

            {/* Avatar preview / upload zone */}
            <div className="flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="relative group"
                aria-label={avatarPreview ? "Change profile photo" : "Upload profile photo"}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Your avatar preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-highlight shadow-xl"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-muted/60 border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 group-hover:border-highlight group-hover:bg-highlight/5 transition-all">
                    <span className="text-3xl">👤</span>
                    <span className="text-xs text-stone-400 font-semibold">Tap to upload</span>
                  </div>
                )}
                <div className="absolute bottom-1 right-1 w-8 h-8 bg-highlight rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <span className="text-white text-base">+</span>
                </div>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                aria-label="Upload profile photo"
                title="Upload profile photo"
                onChange={handleAvatarSelect}
              />
              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => { setAvatarPreview(null); if (avatarInputRef.current) avatarInputRef.current.value = ''; }}
                  className="text-xs text-stone-400 hover:text-red-500 transition-colors"
                >
                  Remove photo
                </button>
              )}
              {avatarPreview && avatarPreview === authUser?.avatar && (
                <p className="text-xs text-stone-400">Using your Google profile photo — tap to change</p>
              )}
              <p className="text-xs text-stone-400">JPG, PNG or WebP · Max 5MB</p>
            </div>

            <button
              type="button"
              onClick={handleAvatarUpload}
              disabled={avatarUploading}
              className="w-full py-4 bg-highlight text-white rounded-2xl font-bold text-base shadow-lg shadow-highlight/20 hover:bg-yellow-500 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {avatarUploading ? 'Saving…' : avatarPreview ? 'Save & Continue →' : 'Skip for now →'}
            </button>
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