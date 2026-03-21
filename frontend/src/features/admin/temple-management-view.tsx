import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, CheckCircle, XCircle, Clock, MapPin, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { SkeletonTable } from '@/shared/components/skeleton';
import { useToast } from '@/shared/components/toast';

import { useModal } from '@/components/common/ModalProvider';

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
  const queryClient = useQueryClient();
  const toast = useToast();

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
      try {
        const response = await api.get('/temples', { params });
        return response.data;
      } catch (error) {
        throw error;
      }
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
                    <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
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
    </div>
  );
};

export default TempleManagementView;

