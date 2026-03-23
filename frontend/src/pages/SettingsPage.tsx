import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, User, Bell, Shield, Palette, Mail, Lock, CreditCard, Trash2, LogOut, AtSign, Check, X, Loader2, MessageCircle, Sun, Moon, Sparkles, Crown, ArrowRight, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/use-auth';
import { useToast } from '@/shared/components/toast';
import api from '@/lib/api';
import { useSubscription } from '@/features/subscription/use-subscription';
import ReferralPanel from '@/features/devoted/referral-panel';

type SettingsState = {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    consultationReminders: boolean;
    communityUpdates: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisibility: string;
    showOnlineStatus: boolean;
    allowMessaging: boolean;
  };
  appearance: {
    theme: string;
    language: string;
  };
};

const DEFAULT_SETTINGS: SettingsState = {
  notifications: {
    email: true,
    push: true,
    sms: false,
    consultationReminders: true,
    communityUpdates: true,
    marketing: false,
  },
  privacy: {
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowMessaging: true,
  },
  appearance: {
    theme: 'light',
    language: 'english',
  },
};

const slugRegex = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activeSection, setActiveSection] = useState('account');
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [slugInput, setSlugInput] = useState('');
  const [slugEditing, setSlugEditing] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

  const { data: userProfile } = useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => {
      const res = await api.get(`/users/${user!.id}`);
      return res.data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (userProfile?.settings) {
      setSettings(prev => ({
        notifications: { ...prev.notifications, ...userProfile.settings.notifications },
        privacy: { ...prev.privacy, ...userProfile.settings.privacy },
        appearance: { ...prev.appearance, ...userProfile.settings.appearance },
      }));
    }
    if (userProfile) {
      setWhatsappNumber(userProfile.whatsappNumber || '');
      setWhatsappEnabled(userProfile.whatsappEnabled ?? true);
    }
  }, [userProfile]);

  const saveWhatsappMutation = useMutation({
    mutationFn: (data: { whatsappNumber: string; whatsappEnabled: boolean }) =>
      api.patch(`/users/${user!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings', user?.id] });
      toast.success('WhatsApp preferences saved');
    },
    onError: () => toast.error('Failed to save WhatsApp settings'),
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (updated: SettingsState) =>
      api.patch(`/users/${user!.id}`, { settings: updated }),
  });

  const saveSlugMutation = useMutation({
    mutationFn: (slug: string) => api.patch(`/users/${user!.id}`, { slug }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-settings', user?.id] });
      toast.success('Username saved!');
      setSlugEditing(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save username');
    },
  });

  const checkSlugAvailability = async (slug: string) => {
    if (!slugRegex.test(slug)) { setSlugAvailable(null); return; }
    setSlugChecking(true);
    try {
      await api.get(`/public/resolve/${slug}`);
      // 200 = username taken
      setSlugAvailable(false);
    } catch (err: any) {
      // 404 = username available
      setSlugAvailable(err?.response?.status === 404);
    } finally {
      setSlugChecking(false);
    }
  };

  const updateSettings = (updated: SettingsState) => {
    setSettings(updated);
    saveSettingsMutation.mutate(updated);
  };

  const { isDevoted, isFree, plan, endDate, daysRemaining, status, autoRenew } = useSubscription();

  const cancelSubscriptionMutation = useMutation({
    mutationFn: () => api.post('/subscriptions/cancel'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success('Your subscription will not renew. You keep Devoted access until your period ends.');
    },
    onError: () => toast.error('Could not cancel subscription. Please try again.'),
  });

  const sections = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'subscription', label: 'Subscription', icon: Crown },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/login');
    }
  };

  const handleDeleteAccount = () => {
    window.confirm('This action cannot be undone. Are you sure you want to delete your account?');
  };

  return (
    <div className="bg-muted/40">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-800 dark:text-stone-200 brand-font flex items-center gap-3">
            <Settings className="text-highlight" size={32} />
            Settings
          </h1>
          <p className="text-stone-500 mt-2">Manage your account preferences and settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl border border-border shadow-sm p-2">
              {sections.map((section) => {
                const IconComponent = section.icon;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-highlight text-white'
                        : 'hover:bg-muted/60 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <IconComponent size={18} />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Danger Zone */}
            <div className="mt-6 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-800 p-4">
              <h3 className="font-bold text-red-800 dark:text-red-400 mb-3 flex items-center gap-2">
                <Shield size={18} />
                Danger Zone
              </h3>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-700 dark:text-red-400 hover:bg-red-100 dark:bg-red-900/30 rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  <span className="font-medium">Log Out</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-700 dark:text-red-400 hover:bg-red-100 dark:bg-red-900/30 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                  <span className="font-medium">Delete Account</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
              {activeSection === 'account' && (
                <div>
                  <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-200 mb-6">Account Settings</h2>

                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-xl">
                      <div className="w-16 h-16 bg-highlight/10 rounded-full flex items-center justify-center">
                        <User className="text-highlight" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-800 dark:text-stone-200">{user?.name}</h3>
                        <p className="text-stone-600">{user?.email}</p>
                        <p className="text-sm text-stone-500 capitalize">{user?.role?.toLowerCase()}</p>
                      </div>
                    </div>

                    {/* Username / Shareable Link */}
                    <div className="p-4 bg-muted/40 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <AtSign size={16} className="text-stone-600" />
                        <h3 className="font-bold text-stone-800 dark:text-stone-200">Username (shareable link)</h3>
                      </div>
                      {!slugEditing ? (
                        <div className="flex items-center justify-between">
                          <p className="text-stone-600 text-sm">
                            {userProfile?.slug
                              ? <span>iluase.com/<strong>@{userProfile.slug}</strong></span>
                              : <span className="text-stone-400 italic">No username set yet</span>}
                          </p>
                          <button
                            type="button"
                            onClick={() => { setSlugInput(userProfile?.slug || ''); setSlugEditing(true); setSlugAvailable(null); }}
                            className="text-sm text-highlight font-medium hover:underline"
                          >
                            {userProfile?.slug ? 'Change' : 'Set username'}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-stone-500 text-sm">iluase.com/@</span>
                            <input
                              type="text"
                              value={slugInput}
                              onChange={(e) => {
                                const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                setSlugInput(v);
                                setSlugAvailable(null);
                              }}
                              onBlur={() => slugInput && checkSlugAvailability(slugInput)}
                              placeholder="your-username"
                              maxLength={30}
                              className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-highlight focus:border-highlight"
                            />
                            {slugChecking && <Loader2 size={16} className="animate-spin text-stone-400" />}
                            {!slugChecking && slugAvailable === true && <Check size={16} className="text-green-500 dark:text-green-400" />}
                            {!slugChecking && slugAvailable === false && <X size={16} className="text-red-500 dark:text-red-400" />}
                          </div>
                          <p className="text-xs text-stone-400">
                            3–30 characters · lowercase letters, numbers, hyphens only
                            {slugAvailable === false && <span className="text-red-500 dark:text-red-400 ml-2">Username taken</span>}
                            {slugAvailable === true && <span className="text-green-600 dark:text-green-400 ml-2">Available!</span>}
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={!slugRegex.test(slugInput) || slugAvailable === false || saveSlugMutation.isPending}
                              onClick={() => saveSlugMutation.mutate(slugInput)}
                              className="px-4 py-2 bg-highlight text-white rounded-lg text-sm font-medium disabled:opacity-50"
                            >
                              {saveSlugMutation.isPending ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSlugEditing(false)}
                              className="px-4 py-2 bg-muted text-stone-700 dark:text-stone-300 rounded-lg text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-2 px-4 py-3 bg-muted/60 hover:bg-muted rounded-xl transition-colors"
                      >
                        <Mail size={18} className="text-stone-600" />
                        <span className="font-medium text-stone-700 dark:text-stone-300">Update Email</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-2 px-4 py-3 bg-muted/60 hover:bg-muted rounded-xl transition-colors"
                      >
                        <Lock size={18} className="text-stone-600" />
                        <span className="font-medium text-stone-700 dark:text-stone-300">Change Password</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/wallet')}
                        className="flex items-center gap-2 px-4 py-3 bg-muted/60 hover:bg-muted rounded-xl transition-colors"
                      >
                        <CreditCard size={18} className="text-stone-600" />
                        <span className="font-medium text-stone-700 dark:text-stone-300">Payment Methods</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'subscription' && (
                <div>
                  <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-200 mb-6 flex items-center gap-2">
                    <Crown className="text-amber-500" size={24} /> Subscription
                  </h2>

                  {isDevoted ? (
                    <div className="space-y-6">
                      {/* Active Devoted card */}
                      <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                            <Sparkles size={18} className="text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-amber-800 dark:text-amber-300 text-lg">Devoted Member</p>
                            <p className="text-amber-600 dark:text-amber-500 text-sm">
                              {plan === 'ANNUAL' ? 'Annual plan' : 'Quarterly plan'}
                            </p>
                          </div>
                          <span className="ml-auto px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold uppercase tracking-wide">
                            {status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-white/60 dark:bg-black/20 rounded-xl p-3">
                            <p className="text-xs text-amber-600 dark:text-amber-500 font-medium mb-0.5">Access until</p>
                            <p className="font-bold text-amber-800 dark:text-amber-300">
                              {endDate ? new Date(endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            </p>
                          </div>
                          <div className="bg-white/60 dark:bg-black/20 rounded-xl p-3">
                            <p className="text-xs text-amber-600 dark:text-amber-500 font-medium mb-0.5">Days remaining</p>
                            <p className="font-bold text-amber-800 dark:text-amber-300">{daysRemaining ?? '—'}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-5">
                          {[
                            'Selected premium Academy courses',
                            'Exclusive Community Circles',
                            'Unlimited messaging',
                            'Free local delivery above ₦100k',
                            'Devoted badge on profile',
                          ].map((benefit) => (
                            <span key={benefit} className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-medium px-2.5 py-1 rounded-full">
                              <Check size={10} /> {benefit}
                            </span>
                          ))}
                        </div>

                        {autoRenew ? (
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-amber-600 dark:text-amber-500">Auto-renews on expiry</p>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Cancel auto-renewal? You keep Devoted access until the period ends.')) {
                                  cancelSubscriptionMutation.mutate();
                                }
                              }}
                              disabled={cancelSubscriptionMutation.isPending}
                              className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium disabled:opacity-50"
                            >
                              {cancelSubscriptionMutation.isPending ? 'Cancelling...' : 'Cancel renewal'}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-500">
                            <AlertCircle size={12} />
                            Auto-renewal cancelled — access ends on expiry date
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate('/subscription/manage')}
                        className="w-full flex items-center justify-between px-4 py-3 bg-muted/60 hover:bg-muted rounded-xl transition-colors text-stone-700 dark:text-stone-300"
                      >
                        <span className="font-medium">Manage subscription & billing</span>
                        <ArrowRight size={16} />
                      </button>

                      {/* Referral panel */}
                      <div className="rounded-2xl border border-border bg-card p-6">
                        <ReferralPanel />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Free tier */}
                      <div className="rounded-2xl border border-border bg-muted/30 p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                          <User size={22} className="text-muted-foreground" />
                        </div>
                        <p className="font-bold text-foreground mb-1">Seeker — Free</p>
                        <p className="text-sm text-muted-foreground mb-4">Access core platform features at no cost.</p>
                        <div className="flex flex-wrap gap-2 justify-center mb-5">
                          {['Browse temples & Babalawos', 'Book consultations', 'Community forum', 'Marketplace'].map((f) => (
                            <span key={f} className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs px-2.5 py-1 rounded-full">
                              <Check size={10} /> {f}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles size={18} className="text-amber-600 dark:text-amber-400" />
                          <h3 className="font-bold text-amber-800 dark:text-amber-300">Become Devoted</h3>
                        </div>
                        <p className="text-sm text-amber-700 dark:text-amber-400 mb-4">
                          Unlock premium Academy courses, exclusive Circles, unlimited messaging, and more.
                        </p>
                        <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
                          <div className="bg-white/60 dark:bg-black/20 rounded-xl p-3 text-center">
                            <p className="font-bold text-amber-800 dark:text-amber-300 text-lg">₦25,000</p>
                            <p className="text-amber-600 dark:text-amber-500 text-xs">3 months</p>
                          </div>
                          <div className="bg-white/60 dark:bg-black/20 rounded-xl p-3 text-center">
                            <p className="font-bold text-amber-800 dark:text-amber-300 text-lg">₦100,000</p>
                            <p className="text-amber-600 dark:text-amber-500 text-xs">1 year · best value</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate('/pricing')}
                          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors"
                        >
                          <Sparkles size={15} /> Become Devoted <ArrowRight size={15} />
                        </button>
                      </div>

                      {/* Referral panel — available to all users */}
                      <div className="rounded-2xl border border-border bg-card p-6">
                        <ReferralPanel />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-200 mb-6">Notification Preferences</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-stone-800 dark:text-stone-200 mb-4">Communication Channels</h3>
                      <div className="space-y-3">
                        {[
                          { key: 'email', label: 'Email Notifications' },
                          { key: 'push', label: 'Push Notifications' },
                          { key: 'sms', label: 'SMS Notifications' },
                        ].map(({ key, label }) => (
                          <label key={key} className="flex items-center justify-between p-4 bg-muted/40 rounded-xl">
                            <span className="font-medium text-stone-700 dark:text-stone-300">{label}</span>
                            <input
                              type="checkbox"
                              checked={settings.notifications[key as keyof typeof settings.notifications] as boolean}
                              onChange={(e) => {
                                const updated = {
                                  ...settings,
                                  notifications: { ...settings.notifications, [key]: e.target.checked },
                                };
                                updateSettings(updated);
                              }}
                              className="w-5 h-5 text-highlight rounded focus:ring-highlight"
                            />
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* WhatsApp Notifications */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
                          <MessageCircle size={18} className="text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-stone-800 dark:text-stone-200">WhatsApp Notifications</h3>
                          <p className="text-xs text-muted-foreground">Get instant alerts for bookings, orders & messages</p>
                        </div>
                        <label className="ml-auto flex items-center cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only"
                              aria-label="Enable WhatsApp notifications"
                              checked={whatsappEnabled}
                              onChange={(e) => {
                                setWhatsappEnabled(e.target.checked);
                                saveWhatsappMutation.mutate({ whatsappNumber, whatsappEnabled: e.target.checked });
                              }}
                            />
                            <div className={`w-11 h-6 rounded-full transition-colors ${whatsappEnabled ? 'bg-green-500' : 'bg-muted'}`} />
                            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${whatsappEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                          </div>
                        </label>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300">
                          WhatsApp Number
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="tel"
                            placeholder="+234 800 000 0000"
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value)}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <button
                            type="button"
                            onClick={() => saveWhatsappMutation.mutate({ whatsappNumber, whatsappEnabled })}
                            disabled={saveWhatsappMutation.isPending || !whatsappNumber.trim()}
                            className="px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors flex items-center gap-2"
                          >
                            {saveWhatsappMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            Save
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">Include country code e.g. +234 for Nigeria, +44 for UK</p>
                      </div>

                      {whatsappEnabled && whatsappNumber && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {['New bookings', 'Messages', 'Orders', 'Payments', 'Guidance plans'].map((item) => (
                            <span key={item} className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                              <Check size={10} /> {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-stone-800 dark:text-stone-200 mb-4">Notification Types</h3>
                      <div className="space-y-3">
                        {[
                          { key: 'consultationReminders', label: 'Consultation Reminders' },
                          { key: 'communityUpdates', label: 'Community Updates' },
                          { key: 'marketing', label: 'Marketing & Promotions' },
                        ].map(({ key, label }) => (
                          <label key={key} className="flex items-center justify-between p-4 bg-muted/40 rounded-xl">
                            <span className="font-medium text-stone-700 dark:text-stone-300">{label}</span>
                            <input
                              type="checkbox"
                              checked={settings.notifications[key as keyof typeof settings.notifications] as boolean}
                              onChange={(e) => {
                                const updated = {
                                  ...settings,
                                  notifications: { ...settings.notifications, [key]: e.target.checked },
                                };
                                updateSettings(updated);
                              }}
                              className="w-5 h-5 text-highlight rounded focus:ring-highlight"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'privacy' && (
                <div>
                  <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-200 mb-6">Privacy Settings</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-stone-800 dark:text-stone-200 mb-4">Profile Visibility</h3>
                      <div className="space-y-3">
                        {[
                          { value: 'public', label: 'Public - Visible to everyone' },
                          { value: 'community', label: 'Community - Visible to verified members only' },
                          { value: 'private', label: 'Private - Only visible to you' },
                        ].map(({ value, label }) => (
                          <label key={value} className="flex items-center gap-3 p-4 bg-muted/40 rounded-xl cursor-pointer">
                            <input
                              type="radio"
                              name="profileVisibility"
                              value={value}
                              checked={settings.privacy.profileVisibility === value}
                              onChange={(e) => {
                                const updated = {
                                  ...settings,
                                  privacy: { ...settings.privacy, profileVisibility: e.target.value },
                                };
                                updateSettings(updated);
                              }}
                              className="w-4 h-4 text-highlight focus:ring-highlight"
                            />
                            <span className="font-medium text-stone-700 dark:text-stone-300">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-stone-800 dark:text-stone-200 mb-4">Activity Settings</h3>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-4 bg-muted/40 rounded-xl">
                          <span className="font-medium text-stone-700 dark:text-stone-300">Show online status</span>
                          <input
                            type="checkbox"
                            checked={settings.privacy.showOnlineStatus}
                            onChange={(e) => {
                              const updated = {
                                ...settings,
                                privacy: { ...settings.privacy, showOnlineStatus: e.target.checked },
                              };
                              updateSettings(updated);
                            }}
                            className="w-5 h-5 text-highlight rounded focus:ring-highlight"
                          />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-muted/40 rounded-xl">
                          <span className="font-medium text-stone-700 dark:text-stone-300">Allow direct messaging</span>
                          <input
                            type="checkbox"
                            checked={settings.privacy.allowMessaging}
                            onChange={(e) => {
                              const updated = {
                                ...settings,
                                privacy: { ...settings.privacy, allowMessaging: e.target.checked },
                              };
                              updateSettings(updated);
                            }}
                            className="w-5 h-5 text-highlight rounded focus:ring-highlight"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'appearance' && (
                <div>
                  <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-200 mb-6">Appearance</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-stone-800 dark:text-stone-200 mb-4">Theme</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => updateSettings({ ...settings, appearance: { ...settings.appearance, theme: 'light' } })}
                          className={`p-4 rounded-xl border-2 transition-colors ${
                            settings.appearance.theme === 'light'
                              ? 'border-highlight bg-highlight/5'
                              : 'border-border hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Sun size={20} className="text-amber-500 dark:text-amber-400" />
                            <span className="font-bold text-stone-800 dark:text-stone-200">Light</span>
                          </div>
                          <div className="bg-card border border-border rounded-lg w-full h-8"></div>
                        </button>

                        <button
                          type="button"
                          onClick={() => updateSettings({ ...settings, appearance: { ...settings.appearance, theme: 'dark' } })}
                          className={`p-4 rounded-xl border-2 transition-colors ${
                            settings.appearance.theme === 'dark'
                              ? 'border-highlight bg-highlight/5'
                              : 'border-border hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Moon size={20} className="text-indigo-500 dark:text-indigo-400" />
                            <span className="font-bold text-stone-800 dark:text-stone-200">Dark</span>
                          </div>
                          <div className="bg-stone-800 border border-stone-700 rounded-lg w-full h-8"></div>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-stone-800 dark:text-stone-200 mb-4">Language</h3>
                      <select
                        aria-label="Language preference"
                        value={settings.appearance.language}
                        onChange={(e) => updateSettings({ ...settings, appearance: { ...settings.appearance, language: e.target.value } })}
                        className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
                      >
                        <option value="english">English</option>
                        <option value="yoruba">Yoruba</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
