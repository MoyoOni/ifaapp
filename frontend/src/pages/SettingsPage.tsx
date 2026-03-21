import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, User, Bell, Shield, Palette, Moon, Sun, Mail, Lock, CreditCard, Trash2, LogOut, AtSign, Check, X, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/use-auth';
import { useToast } from '@/shared/components/toast';
import api from '@/lib/api';

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
  }, [userProfile]);

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

  const sections = [
    { id: 'account', label: 'Account', icon: User },
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
    <div className="bg-stone-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-800 brand-font flex items-center gap-3">
            <Settings className="text-highlight" size={32} />
            Settings
          </h1>
          <p className="text-stone-500 mt-2">Manage your account preferences and settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-2">
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
                        : 'hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <IconComponent size={18} />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Danger Zone */}
            <div className="mt-6 bg-red-50 rounded-2xl border border-red-200 p-4">
              <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                <Shield size={18} />
                Danger Zone
              </h3>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  <span className="font-medium">Log Out</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                  <span className="font-medium">Delete Account</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
              {activeSection === 'account' && (
                <div>
                  <h2 className="text-2xl font-bold text-stone-800 mb-6">Account Settings</h2>

                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl">
                      <div className="w-16 h-16 bg-highlight/10 rounded-full flex items-center justify-center">
                        <User className="text-highlight" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-800">{user?.name}</h3>
                        <p className="text-stone-600">{user?.email}</p>
                        <p className="text-sm text-stone-500 capitalize">{user?.role?.toLowerCase()}</p>
                      </div>
                    </div>

                    {/* Username / Shareable Link */}
                    <div className="p-4 bg-stone-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <AtSign size={16} className="text-stone-600" />
                        <h3 className="font-bold text-stone-800">Username (shareable link)</h3>
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
                            {!slugChecking && slugAvailable === true && <Check size={16} className="text-green-500" />}
                            {!slugChecking && slugAvailable === false && <X size={16} className="text-red-500" />}
                          </div>
                          <p className="text-xs text-stone-400">
                            3–30 characters · lowercase letters, numbers, hyphens only
                            {slugAvailable === false && <span className="text-red-500 ml-2">Username taken</span>}
                            {slugAvailable === true && <span className="text-green-600 ml-2">Available!</span>}
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
                              className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg text-sm font-medium"
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
                        className="flex items-center gap-2 px-4 py-3 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                      >
                        <Mail size={18} className="text-stone-600" />
                        <span className="font-medium text-stone-700">Update Email</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-2 px-4 py-3 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                      >
                        <Lock size={18} className="text-stone-600" />
                        <span className="font-medium text-stone-700">Change Password</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/wallet')}
                        className="flex items-center gap-2 px-4 py-3 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                      >
                        <CreditCard size={18} className="text-stone-600" />
                        <span className="font-medium text-stone-700">Payment Methods</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-bold text-stone-800 mb-6">Notification Preferences</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-stone-800 mb-4">Communication Channels</h3>
                      <div className="space-y-3">
                        {[
                          { key: 'email', label: 'Email Notifications' },
                          { key: 'push', label: 'Push Notifications' },
                          { key: 'sms', label: 'SMS Notifications' },
                        ].map(({ key, label }) => (
                          <label key={key} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                            <span className="font-medium text-stone-700">{label}</span>
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

                    <div>
                      <h3 className="font-bold text-stone-800 mb-4">Notification Types</h3>
                      <div className="space-y-3">
                        {[
                          { key: 'consultationReminders', label: 'Consultation Reminders' },
                          { key: 'communityUpdates', label: 'Community Updates' },
                          { key: 'marketing', label: 'Marketing & Promotions' },
                        ].map(({ key, label }) => (
                          <label key={key} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                            <span className="font-medium text-stone-700">{label}</span>
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
                  <h2 className="text-2xl font-bold text-stone-800 mb-6">Privacy Settings</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-stone-800 mb-4">Profile Visibility</h3>
                      <div className="space-y-3">
                        {[
                          { value: 'public', label: 'Public - Visible to everyone' },
                          { value: 'community', label: 'Community - Visible to verified members only' },
                          { value: 'private', label: 'Private - Only visible to you' },
                        ].map(({ value, label }) => (
                          <label key={value} className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl cursor-pointer">
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
                            <span className="font-medium text-stone-700">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-stone-800 mb-4">Activity Settings</h3>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                          <span className="font-medium text-stone-700">Show online status</span>
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

                        <label className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                          <span className="font-medium text-stone-700">Allow direct messaging</span>
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
                  <h2 className="text-2xl font-bold text-stone-800 mb-6">Appearance</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-stone-800 mb-4">Theme</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => updateSettings({ ...settings, appearance: { ...settings.appearance, theme: 'light' } })}
                          className={`p-4 rounded-xl border-2 transition-colors ${
                            settings.appearance.theme === 'light'
                              ? 'border-highlight bg-highlight/5'
                              : 'border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Sun size={20} className="text-amber-500" />
                            <span className="font-bold text-stone-800">Light</span>
                          </div>
                          <div className="bg-white border border-stone-200 rounded-lg w-full h-8"></div>
                        </button>

                        <button
                          type="button"
                          onClick={() => updateSettings({ ...settings, appearance: { ...settings.appearance, theme: 'dark' } })}
                          className={`p-4 rounded-xl border-2 transition-colors ${
                            settings.appearance.theme === 'dark'
                              ? 'border-highlight bg-highlight/5'
                              : 'border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Moon size={20} className="text-indigo-500" />
                            <span className="font-bold text-stone-800">Dark</span>
                          </div>
                          <div className="bg-stone-800 border border-stone-700 rounded-lg w-full h-8"></div>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-stone-800 mb-4">Language</h3>
                      <select
                        aria-label="Language preference"
                        value={settings.appearance.language}
                        onChange={(e) => updateSettings({ ...settings, appearance: { ...settings.appearance, language: e.target.value } })}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
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
