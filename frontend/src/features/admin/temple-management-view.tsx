import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, CheckCircle, XCircle, Clock, MapPin, Plus, X } from 'lucide-react';
import api from '@/lib/api';
import { SkeletonTable } from '@/shared/components/skeleton';
import { useToast } from '@/shared/components/toast';

import { useModal } from '@/components/common/ModalProvider';

const TEMPLE_TYPES = [
  { value: 'ILE_IFA', label: 'Ilé Ifá (Full Temple)' },
  { value: 'BRANCH', label: 'Branch / Extension' },
  { value: 'STUDY_CIRCLE', label: 'Study Circle' },
] as const;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

interface NewTempleForm {
  name: string;
  yorubaName: string;
  type: 'ILE_IFA' | 'BRANCH' | 'STUDY_CIRCLE';
  city: string;
  state: string;
  country: string;
  address: string;
  description: string;
  phone: string;
  email: string;
  website: string;
}

const EMPTY_FORM: NewTempleForm = {
  name: '',
  yorubaName: '',
  type: 'ILE_IFA',
  city: '',
  state: '',
  country: 'Nigeria',
  address: '',
  description: '',
  phone: '',
  email: '',
  website: '',
};

interface Temple {
  id: string;
  name: string;
  yorubaName?: string;
  slug: string;
  type: string;
  status: string;
  verified: boolean;
  verifiedAt?: string;
  founderId: string;
  city?: string;
  state?: string;
  country?: string;
  description?: string;
  lineage?: string;
  tradition?: string;
  _count?: {
    babalawos: number;
    followers: number;
  };
  founder: {
    id: string;
    name: string;
    yorubaName?: string;
    email?: string;
    verified: boolean;
  };
  createdAt: string;
}

type FilterType = 'all' | 'pending' | 'verified' | 'rejected';

/**
 * Temple Management View
 * Admin interface for managing temples, verification, and temple-babalawo relationships
 */
const TempleManagementView: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<NewTempleForm>(EMPTY_FORM);
  const queryClient = useQueryClient();
  const toast = useToast();

  const createTempleMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/temples', {
        name: form.name,
        yorubaName: form.yorubaName || undefined,
        slug: slugify(form.name),
        type: form.type,
        city: form.city || undefined,
        state: form.state || undefined,
        country: form.country || undefined,
        address: form.address || undefined,
        description: form.description || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        website: form.website || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-temples'] });
      toast.success('Temple added');
      setShowCreateForm(false);
      setForm(EMPTY_FORM);
    },
    onError: (err: Error) => {
      toast.error(`Failed to add temple — ${err.message}`);
    },
  });

  // Fetch all temples
  const { data: temples = [], isLoading } = useQuery<Temple[]>({
    queryKey: ['admin-temples', filter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filter === 'pending') {
        params.verified = 'false';
        params.status = 'ACTIVE';
      } else if (filter === 'verified') {
        params.verified = 'true';
      } else if (filter === 'rejected') {
        params.status = 'REJECTED';
      }
      const response = await api.get('/temples', { params });
      return response.data;
    },
  });

  // Verify temple mutation
  const verifyTempleMutation = useMutation({
    mutationFn: async (templeId: string) => {
      const response = await api.patch(`/temples/${templeId}/verify`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-temples'] });
      toast.success('Temple verified');
    },
    onError: (err: Error) => {
      toast.error(`Failed to verify temple — ${err.message}`);
    },
  });

  // Reject temple mutation
  const rejectTempleMutation = useMutation({
    mutationFn: async (templeId: string) => {
      const response = await api.patch(`/temples/${templeId}`, {
        status: 'REJECTED',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-temples'] });
      toast.success('Temple rejected');
    },
    onError: (err: Error) => {
      toast.error(`Failed to reject temple — ${err.message}`);
    },
  });

  const filteredTemples = temples;

  const { showModal } = useModal();

  const handleVerify = (templeId: string) => {
    showModal({
      title: 'Confirm Verification',
      message: 'Are you sure you want to verify this temple?',
      confirmText: 'Verify',
      cancelText: 'Cancel',
      onConfirm: () => {
        verifyTempleMutation.mutate(templeId);
      }
    });
  };

  const handleReject = (templeId: string) => {
    showModal({
      title: 'Reject Temple',
      message: 'Are you sure you want to reject this temple registration?',
      confirmText: 'Reject',
      cancelText: 'Cancel',
      onConfirm: () => {
        rejectTempleMutation.mutate(templeId);
      }
    });
  };

  if (isLoading) {
    return <SkeletonTable rows={4} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Building2 size={24} />
          Temple Management
        </h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> Add Temple
          </button>
        <div className="flex gap-2">
          {(['all', 'pending', 'verified', 'rejected'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-input overflow-hidden">
        {filteredTemples.length > 0 ? (
          <div className="divide-y divide-border">
            {filteredTemples.map((temple) => (
              <div key={temple.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Building2 className="text-primary" size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{temple.name}</h3>
                    {temple.yorubaName && (
                      <p className="text-sm text-muted-foreground italic">{temple.yorubaName}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {temple.city && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {temple.city}{temple.state ? `, ${temple.state}` : ''}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {new Date(temple.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {temple.verified ? (
                    <span className="flex items-center gap-1 text-xs dark:text-green-400 text-green-600 bg-green-500/10 px-2 py-1 rounded-full">
                      <CheckCircle size={12} /> Verified
                    </span>
                  ) : temple.status === 'REJECTED' ? (
                    <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
                      <XCircle size={12} /> Rejected
                    </span>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerify(temple.id)}
                        disabled={verifyTempleMutation.isPending}
                        className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => handleReject(temple.id)}
                        disabled={rejectTempleMutation.isPending}
                        className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No temples found</p>
          </div>
        )}
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-xl border border-input w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Building2 size={20} /> Add Temple
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="temple-name" className="text-sm font-medium text-foreground">Name *</label>
                <input
                  id="temple-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ilé Ìjọ́sìn Ọ̀rúnmìlà"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                />
              </div>

              <div>
                <label htmlFor="temple-yoruba-name" className="text-sm font-medium text-foreground">Yorùbá Name</label>
                <input
                  id="temple-yoruba-name"
                  type="text"
                  value={form.yorubaName}
                  onChange={(e) => setForm({ ...form, yorubaName: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                />
              </div>

              <div>
                <label htmlFor="temple-type" className="text-sm font-medium text-foreground">Type</label>
                <select
                  id="temple-type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as NewTempleForm['type'] })}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                >
                  {TEMPLE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="temple-city" className="text-sm font-medium text-foreground">City</label>
                  <input
                    id="temple-city"
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="temple-state" className="text-sm font-medium text-foreground">State</label>
                  <input
                    id="temple-state"
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="temple-country" className="text-sm font-medium text-foreground">Country</label>
                <input
                  id="temple-country"
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                />
              </div>

              <div>
                <label htmlFor="temple-address" className="text-sm font-medium text-foreground">Address</label>
                <input
                  id="temple-address"
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                />
              </div>

              <div>
                <label htmlFor="temple-description" className="text-sm font-medium text-foreground">Description</label>
                <textarea
                  id="temple-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="temple-phone" className="text-sm font-medium text-foreground">Phone</label>
                  <input
                    id="temple-phone"
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="temple-email" className="text-sm font-medium text-foreground">Email</label>
                  <input
                    id="temple-email"
                    type="text"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="temple-website" className="text-sm font-medium text-foreground">Website</label>
                <input
                  id="temple-website"
                  type="text"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => createTempleMutation.mutate()}
                disabled={!form.name.trim() || createTempleMutation.isPending}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {createTempleMutation.isPending ? 'Adding…' : 'Add Temple'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TempleManagementView;

