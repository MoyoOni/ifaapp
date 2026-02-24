import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Users, X, Trash2, Building2 } from 'lucide-react';
import { Temple, UpdateTempleDto } from '@common';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { useAuth } from '@/shared/hooks/use-auth';
// import { DEMO_TEMPLES } from '@/demo';

interface TempleManagementViewProps {
  templeId: string;
  onBack?: () => void;
}

/**
 * Temple Management View
 * Allows temple founders and admins to manage temple information
 * NOTE: Only founder or admin can access this page
 */
const TempleManagementView: React.FC<TempleManagementViewProps> = ({
  templeId,
  onBack,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UpdateTempleDto>>({});

  // Fetch temple
  const { data: temple, isLoading } = useQuery<Temple & {
    founder?: {
      id: string;
      name: string;
    };
    babalawos?: Array<{
      id: string;
      name: string;
      yorubaName?: string;
      avatar?: string;
    }>;
  }>({
    queryKey: ['temple', templeId],
    queryFn: async () => {
      try {
        const response = await api.get(`/temples/${templeId}`);
        return response.data;
      } catch(e) {
        logger.error('Failed to fetch temple', e);
        return null;
      }
    },
  });

// Update temple mutation
const updateMutation = useMutation({
  mutationFn: async (data: UpdateTempleDto) => {
    const response = await api.patch(`/temples/${templeId}`, data);
    return response.data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['temple', templeId] });
    setIsEditing(false);
  },
});

// Remove babalawo mutation
const removeBabalawoMutation = useMutation({
  mutationFn: async (babalawoId: string) => {
    const response = await api.patch(`/temples/${templeId}/babalawos/${babalawoId}/remove`);
    return response.data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['temple', templeId] });
  },
});

// Check if user can edit
const canEdit = user && (user.role === 'ADMIN' || temple?.founderId === user.id);

if (isLoading) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

if (!temple) {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 p-6 flex flex-col items-center justify-center">
      <Building2 className="w-16 h-16 text-stone-300 mb-4" />
      <p className="text-stone-500 text-lg font-medium">Temple not found.</p>
      <button onClick={onBack} className="mt-4 text-highlight font-bold hover:underline">
        Go Back
      </button>
    </div>
  );
}

if (!canEdit) {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 p-6 flex items-center justify-center">
      <div className="max-w-md text-center space-y-4 bg-white p-8 rounded-2xl shadow-xl">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
          <X size={32} />
        </div>
        <h3 className="text-xl font-bold">Access Denied</h3>
        <p className="text-stone-500">
          You do not have permission to manage this temple.
        </p>
        <button onClick={onBack} className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors">
          Return
        </button>
      </div>
    </div>
  );
}

const handleSave = () => {
  updateMutation.mutate(formData as UpdateTempleDto);
};

const handleInputChange = (field: keyof UpdateTempleDto, value: unknown) => {
  setFormData((prev) => ({ ...prev, [field]: value }));
};

return (
  <div className="min-h-screen bg-stone-50 text-stone-800 p-6">
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold brand-font text-stone-800 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-highlight" />
            Manage Temple
          </h1>
          <div className="flex items-center gap-2 text-stone-500">
            <span className="font-semibold">{temple.name}</span>
            <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
            <span>Admin Portal</span>
          </div>
        </div>
        <div className="flex gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-white border border-stone-200 text-stone-600 rounded-xl font-bold hover:bg-stone-50 transition-colors shadow-sm"
            >
              Back
            </button>
          )}
          <button
            onClick={() => {
              if (isEditing) {
                setIsEditing(false);
                setFormData({});
              } else {
                setIsEditing(true);
                setFormData({
                  name: temple.name,
                  yorubaName: temple.yorubaName,
                  description: temple.description,
                  history: temple.history,
                  mission: temple.mission,
                  address: temple.address,
                  city: temple.city,
                  state: temple.state,
                  country: temple.country,
                  phone: temple.phone,
                  email: temple.email,
                  website: temple.website,
                  lineage: temple.lineage,
                  tradition: temple.tradition,
                  specialties: temple.specialties,
                });
              }
            }}
            className={`px-6 py-2 rounded-xl font-bold transition-all shadow-sm ${isEditing
              ? 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              : 'bg-highlight text-white hover:bg-yellow-500'
              }`}
          >
            {isEditing ? 'Cancel Edit' : 'Edit Details'}
          </button>
        </div>
      </div>

      {/* Temple Information Form */}
      <div className="bg-white rounded-[2rem] p-8 md:p-10 border border-stone-100 shadow-xl shadow-stone-200/50 space-y-8">
        <div className="flex items-center justify-between border-b border-stone-100 pb-6">
          <h2 className="text-2xl font-bold brand-font text-stone-800">Temple Profile</h2>
          {isEditing && <span className="text-xs font-bold text-highlight bg-amber-50 px-3 py-1 rounded-full border border-amber-100">Editing Mode Active</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-stone-400 tracking-widest">Official Name *</label>
            <input
              type="text"
              value={isEditing ? (formData.name ?? temple.name) : temple.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-stone-800 font-bold focus:outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight disabled:opacity-70 disabled:bg-white disabled:border-stone-100 transition-all"
              placeholder="Temple Name"
            />
          </div>

          {/* Yoruba Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-stone-400 tracking-widest">Yoruba Name (Orúkọ)</label>
            <input
              type="text"
              value={isEditing ? (formData.yorubaName ?? temple.yorubaName ?? '') : (temple.yorubaName ?? '')}
              onChange={(e) => handleInputChange('yorubaName', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-stone-800 font-bold focus:outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight disabled:opacity-70 disabled:bg-white disabled:border-stone-100 transition-all"
              placeholder="Yoruba Name"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold uppercase text-stone-400 tracking-widest">Description</label>
            <textarea
              value={isEditing ? (formData.description ?? temple.description ?? '') : (temple.description ?? '')}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={!isEditing}
              rows={4}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight disabled:opacity-70 disabled:bg-white disabled:border-stone-100 transition-all resize-none"
              placeholder="Tell us about your temple..."
            />
          </div>

          {/* History */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold uppercase text-stone-400 tracking-widest">History & Lineage</label>
            <textarea
              value={isEditing ? (formData.history ?? temple.history ?? '') : (temple.history ?? '')}
              onChange={(e) => handleInputChange('history', e.target.value)}
              disabled={!isEditing}
              rows={4}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight disabled:opacity-70 disabled:bg-white disabled:border-stone-100 transition-all resize-none"
              placeholder="Share the history of your house..."
            />
          </div>

          {/* Mission */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold uppercase text-stone-400 tracking-widest">Mission Statement</label>
            <textarea
              value={isEditing ? (formData.mission ?? temple.mission ?? '') : (temple.mission ?? '')}
              onChange={(e) => handleInputChange('mission', e.target.value)}
              disabled={!isEditing}
              rows={3}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight disabled:opacity-70 disabled:bg-white disabled:border-stone-100 transition-all resize-none"
              placeholder="What is your mission?"
            />
          </div>

          <div className="md:col-span-2 border-t border-stone-100 my-4"></div>

          {/* Location Fields */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-stone-400 tracking-widest">City</label>
            <input
              type="text"
              value={isEditing ? (formData.city ?? temple.city ?? '') : (temple.city ?? '')}
              onChange={(e) => handleInputChange('city', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight disabled:opacity-70 disabled:bg-white disabled:border-stone-100 transition-all"
              placeholder="City"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-stone-400 tracking-widest">State / Region</label>
            <input
              type="text"
              value={isEditing ? (formData.state ?? temple.state ?? '') : (temple.state ?? '')}
              onChange={(e) => handleInputChange('state', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight disabled:opacity-70 disabled:bg-white disabled:border-stone-100 transition-all"
              placeholder="State"
            />
          </div>

          {/* Contact Fields */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-stone-400 tracking-widest">Phone Contact</label>
            <input
              type="tel"
              value={isEditing ? (formData.phone ?? temple.phone ?? '') : (temple.phone ?? '')}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight disabled:opacity-70 disabled:bg-white disabled:border-stone-100 transition-all"
              placeholder="+234..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-stone-400 tracking-widest">Email Address</label>
            <input
              type="email"
              value={isEditing ? (formData.email ?? temple.email ?? '') : (temple.email ?? '')}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight disabled:opacity-70 disabled:bg-white disabled:border-stone-100 transition-all"
              placeholder="temple@example.com"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold uppercase text-stone-400 tracking-widest">Website URL</label>
            <input
              type="url"
              value={isEditing ? (formData.website ?? temple.website ?? '') : (temple.website ?? '')}
              onChange={(e) => handleInputChange('website', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight disabled:opacity-70 disabled:bg-white disabled:border-stone-100 transition-all"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Save Button */}
        {isEditing && (
          <div className="flex justify-end pt-6 border-t border-stone-100 mt-6">
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex items-center gap-3 px-8 py-4 bg-highlight hover:bg-yellow-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              <Save size={20} />
              {updateMutation.isPending ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </div>
        )}
      </div>

      {/* Babalawos Management */}
      <div className="bg-white rounded-[2rem] p-8 border border-stone-100 shadow-xl shadow-stone-200/40 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold brand-font text-stone-800 flex items-center gap-3">
            <Users size={24} className="text-highlight" />
            Priests & Initiates ({temple.babalawos?.length || 0})
          </h2>
        </div>

        {/* Babalawos List */}
        {temple.babalawos && temple.babalawos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {temple.babalawos.map((babalawo) => (
              <div
                key={babalawo.id}
                className="flex items-center justify-between bg-stone-50 rounded-xl p-4 border border-stone-100 hover:border-highlight/30 transition-all group"
              >
                <div className="flex items-center gap-4">
                  {babalawo.avatar ? (
                    <img
                      src={babalawo.avatar}
                      alt={babalawo.name}
                      className="w-14 h-14 rounded-full object-cover shadow-sm ring-2 ring-white"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-white border border-stone-100 flex items-center justify-center shadow-sm">
                      <Building2 size={24} className="text-stone-300" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-stone-800">{babalawo.name}</p>
                    {babalawo.yorubaName && (
                      <p className="text-xs font-bold text-highlight uppercase tracking-wider">{babalawo.yorubaName}</p>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${babalawo.name} from this temple?`)) {
                        removeBabalawoMutation.mutate(babalawo.id);
                      }
                    }}
                    disabled={removeBabalawoMutation.isPending}
                    className="p-3 bg-white text-red-500 rounded-lg hover:bg-red-50 transition-colors shadow-sm opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Remove Member"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-stone-50 rounded-2xl border border-stone-100 border-dashed">
            <p className="text-stone-400 font-medium">No babalawos assigned to this temple yet.</p>
          </div>
        )}

        {/* Note about assigning */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800">
          <div className="mt-0.5"><Users size={18} /></div>
          <div>
            <p className="text-sm font-bold">Manage Membership</p>
            <p className="text-xs opacity-80 mt-1">
              To assign new priests or students to this temple, please use the main Members Directory or invite them via their profile pages.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default TempleManagementView;
