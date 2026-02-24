import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Palette, Eye, Award, Save, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';

/**
 * Profile Customization Component
 * Allows users to customize their profile appearance and sections
 */
const ProfileCustomization: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [customization, setCustomization] = useState({
    themeColor: (user as any)?.themeColor || 'highlight',
    showCulturalLevel: true,
    showBadges: true,
    showInterests: true,
    showLocation: true,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.patch(`/users/${user?.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', user?.id] });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      themeColor: customization.themeColor,
      profileVisibility: 'community', // Could be made customizable
    });
  };

  const culturalLevels = ['Omo Ilé', 'Akeko', 'Oye', 'Aremo', 'Omo Awo'];
  const themeColors = [
    { name: 'Gold', value: 'highlight', color: '#D4AF37' },
    { name: 'Clay', value: 'secondary', color: '#8B4513' },
    { name: 'Blue', value: 'blue-500', color: '#3B82F6' },
    { name: 'Purple', value: 'purple-500', color: '#A855F7' },
    { name: 'Green', value: 'green-500', color: '#10B981' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Profile Customization</h1>

      {/* Theme Selection */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Palette size={24} className="text-highlight" />
          <h2 className="text-xl font-bold text-white">Theme Color</h2>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {themeColors.map((theme) => (
            <button
              key={theme.value}
              onClick={() => setCustomization({ ...customization, themeColor: theme.value })}
              className={`p-4 rounded-xl border-2 transition-all ${customization.themeColor === theme.value
                ? 'border-highlight'
                : 'border-white/10 hover:border-white/20'
                }`}
            >
              <div
                className="w-full h-12 rounded-lg mb-2"
                style={{ backgroundColor: theme.color }}
              />
              <div className="text-sm text-white">{theme.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Profile Sections */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Eye size={24} className="text-highlight" />
          <h2 className="text-xl font-bold text-white">Profile Sections</h2>
        </div>
        <div className="space-y-3">
          {[
            { key: 'showCulturalLevel', label: 'Cultural Level Badge', icon: Award },
            { key: 'showBadges', label: 'Achievement Badges', icon: Award },
            { key: 'showInterests', label: 'Interests', icon: Award },
            { key: 'showLocation', label: 'Location', icon: Award },
          ].map((section) => (
            <label key={section.key} className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <section.icon size={20} className="text-highlight" />
                <span className="text-white">{section.label}</span>
              </div>
              <input
                type="checkbox"
                checked={customization[section.key as keyof typeof customization] as boolean}
                onChange={(e) =>
                  setCustomization({
                    ...customization,
                    [section.key]: e.target.checked,
                  })
                }
                className="text-highlight focus:ring-highlight"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Cultural Level Badge Preview */}
      {customization.showCulturalLevel && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Cultural Level Badge Preview</h3>
          <div className="flex flex-wrap gap-3">
            {culturalLevels.map((level) => (
              <div
                key={level}
                className={`px-4 py-2 rounded-full ${(user as any)?.culturalLevel === level
                  ? 'bg-highlight text-foreground'
                  : 'bg-white/10 text-white'
                  } font-bold`}
              >
                {level}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-6 py-3 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors disabled:opacity-50"
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
    </div>
  );
};

export default ProfileCustomization;
