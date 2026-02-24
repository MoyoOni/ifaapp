import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Palette, User, Lock, Users, Loader2 } from 'lucide-react';
import { CulturalLevel } from '@common';
import api from '@/lib/api';

interface ProfileCustomizationViewProps {
  userId: string;
}

/**
 * Profile Customization View
 * MySpace-style customizable user profiles
 * NOTE: Preserves cultural integrity - Yoruba diacritics and terminology
 */
const ProfileCustomizationView: React.FC<ProfileCustomizationViewProps> = ({ userId }) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch user profile
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    },
  });

  const [formData, setFormData] = useState({
    name: user?.name || '',
    yorubaName: user?.yorubaName || '',
    bio: user?.bio || '',
    aboutMe: user?.aboutMe || '',
    location: user?.location || '',
    culturalLevel: user?.culturalLevel || CulturalLevel.OMO_ILE,
    themeColor: user?.themeColor || 'foreground',
    profileVisibility: user?.profileVisibility || 'community',
    interests: user?.interests || [],
    age: user?.age,
    gender: user?.gender,
  });

  // Update form data when user data is fetched
  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        yorubaName: user.yorubaName || '',
        bio: user.bio || '',
        aboutMe: user.aboutMe || '',
        location: user.location || '',
        culturalLevel: user.culturalLevel || CulturalLevel.OMO_ILE,
        themeColor: user.themeColor || 'foreground',
        profileVisibility: user.profileVisibility || 'community',
        interests: user.interests || [],
        age: user.age,
        gender: user.gender,
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.patch(`/users/${userId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      setIsEditing(false);
    },
  });

  const themeColors = [
    { value: 'foreground', label: 'Deep Midnight', class: 'bg-background' },
    { value: 'highlight', label: 'Oyo Gold', class: 'bg-highlight' },
    { value: 'primary', label: 'Forest Spirit', class: 'bg-primary' },
    { value: '#92400E', label: 'Clay Earth', class: 'bg-[#92400E]' },
    { value: '#1e3a8a', label: 'Sky Aṣẹ', class: 'bg-blue-900' },
  ];

  const culturalLevels = Object.values(CulturalLevel);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* 1. Header Hero */}
      <div className="bg-background rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
        {/* Abstract patterns */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-highlight rounded-full opacity-10 blur-3xl translate-x-1/2 -translate-y-1/2"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-highlight border border-white/10">
                Profile Settings
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold brand-font leading-tight">
              My Sanctuary
            </h1>
            <p className="text-white/70 max-w-lg text-lg">
              Manage your personal information, cultural journey, and privacy preferences.
            </p>
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-white text-foreground hover:bg-stone-100 px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
            >
              <Palette size={18} />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Form Card */}
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">

          {/* Section 1: Identity */}
          <div className="p-8 border-b border-stone-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-highlight/10 flex items-center justify-center text-highlight">
                <User size={20} />
              </div>
              <h2 className="text-xl font-bold text-foreground brand-font">Identity & Presence</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-stone-400 tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={!isEditing}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight transition-all disabled:opacity-50 disabled:bg-stone-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-stone-400 tracking-wider">Yoruba Name (Orúkọ)</label>
                <input
                  type="text"
                  value={formData.yorubaName}
                  onChange={(e) => setFormData({ ...formData, yorubaName: e.target.value })}
                  disabled={!isEditing}
                  placeholder="e.g. Adewale"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight transition-all disabled:opacity-50 disabled:bg-stone-100 placeholder:italic"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase text-stone-400 tracking-wider">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={2}
                  placeholder="A short tagline about you..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight transition-all resize-none disabled:opacity-50 disabled:bg-stone-100"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase text-stone-400 tracking-wider">About Me (Ìtàn Mi)</label>
                <textarea
                  value={formData.aboutMe}
                  onChange={(e) => setFormData({ ...formData, aboutMe: e.target.value })}
                  disabled={!isEditing}
                  rows={5}
                  placeholder="Share your spiritual journey..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight transition-all resize-none disabled:opacity-50 disabled:bg-stone-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-stone-400 tracking-wider">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={!isEditing}
                  placeholder="City, Country"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight transition-all disabled:opacity-50 disabled:bg-stone-100"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Cultural & Privacy */}
          <div className="p-8 bg-stone-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Cultural Level */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Users size={16} />
                  </div>
                  <h3 className="font-bold text-foreground">Cultural Path</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-stone-400 tracking-wider">Current Level</label>
                  <div className="relative">
                    <select
                      value={formData.culturalLevel}
                      onChange={(e) => setFormData({ ...formData, culturalLevel: e.target.value as CulturalLevel })}
                      disabled={!isEditing}
                      className="w-full appearance-none bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight transition-all disabled:opacity-50"
                    >
                      {culturalLevels.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">▼</div>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    This helps us tailor content to your knowledge level.
                  </p>
                </div>
              </div>

              {/* Privacy */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-600">
                    <Lock size={16} />
                  </div>
                  <h3 className="font-bold text-foreground">Privacy</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-stone-400 tracking-wider">Visibility</label>
                  <div className="relative">
                    <select
                      value={formData.profileVisibility}
                      onChange={(e) => setFormData({ ...formData, profileVisibility: e.target.value })}
                      disabled={!isEditing}
                      className="w-full appearance-none bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight transition-all disabled:opacity-50"
                    >
                      <option value="public">Public (Visible to everyone)</option>
                      <option value="community">Community (Members only)</option>
                      <option value="private">Private (Only me)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">▼</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Theme */}
          <div className="p-8 border-t border-stone-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <Palette size={16} />
              </div>
              <h3 className="font-bold text-foreground">Personal Theme</h3>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {themeColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, themeColor: color.value })}
                  disabled={!isEditing}
                  className={`relative w-16 h-16 rounded-2xl shadow-sm transition-all flex items-center justify-center ${color.class} ${formData.themeColor === color.value
                    ? 'ring-4 ring-offset-2 ring-stone-200 scale-105'
                    : 'hover:scale-105 opacity-80 hover:opacity-100'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={color.label}
                >
                  {formData.themeColor === color.value && (
                    <div className="bg-white rounded-full p-1" >
                      <div className="w-2 h-2 rounded-full bg-black"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          {isEditing && (
            <div className="p-6 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-4 sticky bottom-0 z-10 transition-all">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  if (user) {
                    setFormData({
                      name: user.name || '',
                      yorubaName: user.yorubaName || '',
                      bio: user.bio || '',
                      aboutMe: user.aboutMe || '',
                      location: user.location || '',
                      culturalLevel: user.culturalLevel || CulturalLevel.OMO_ILE,
                      themeColor: user.themeColor || 'foreground',
                      profileVisibility: user.profileVisibility || 'community',
                      interests: user.interests || [],
                      age: user.age,
                      gender: user.gender,
                    });
                  }
                }}
                className="px-6 py-3 bg-white text-stone-600 rounded-xl font-bold border border-stone-200 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-8 py-3 bg-highlight text-foreground rounded-xl font-bold hover:bg-yellow-500 shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};

export default ProfileCustomizationView;
