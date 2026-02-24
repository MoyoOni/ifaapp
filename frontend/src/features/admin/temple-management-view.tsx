import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, CheckCircle, XCircle, Clock, Users, MapPin, Shield, Search } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { DEMO_TEMPLES, getDemoUserById, type DemoUser } from '@/demo';

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

const buildDemoTemples = (): Temple[] => {
  const demoTemples = Object.values(DEMO_TEMPLES).map((temple, index) => {
    const founderId = temple.babalawos?.[0] || 'demo-baba-1';
    const founder = getDemoUserById(founderId) as DemoUser | null;
    const isRejected = index === 1;
    const isVerified = temple.verified && !isRejected;

    return {
      id: temple.id,
      name: temple.name,
      yorubaName: temple.yorubaName,
      slug: temple.slug,
      type: 'COMMUNITY',
      status: isRejected ? 'REJECTED' : 'ACTIVE',
      verified: isVerified,
      verifiedAt: isVerified ? new Date().toISOString() : undefined,
      founderId: founder?.id || founderId,
      city: temple.location?.split(',')[0]?.trim(),
      state: temple.location?.split(',')[1]?.trim(),
      country: 'NG',
      description: temple.description,
      lineage: 'Ile Ife',
      tradition: 'Ifa',
      _count: {
        babalawos: temple.babalawos?.length ?? 0,
        followers: temple.members?.length ?? 0,
      },
      founder: {
        id: founder?.id || founderId,
        name: founder?.name || 'Unknown Founder',
        yorubaName: founder?.yorubaName,
        email: founder?.email,
        verified: founder?.verified ?? false,
      },
      createdAt: new Date().toISOString(),
    };
  });

  if (demoTemples.length > 0) {
    demoTemples[0] = {
      ...demoTemples[0],
      verified: false,
      status: 'ACTIVE',
      verifiedAt: undefined,
    };
  }

  return demoTemples;
};

/**
 * Temple Management View
 * Admin interface for managing temples, verification, and temple-babalawo relationships
 */
const TempleManagementView: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

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
        if (!isDemoMode) throw error;

        logger.warn('Failed to fetch temples, using demo data');
        return buildDemoTemples();
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
    },
  });

  // Filter temples by search query
  const filteredTemples = temples.filter((temple) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      temple.name.toLowerCase().includes(query) ||
      temple.yorubaName?.toLowerCase().includes(query) ||
      temple.city?.toLowerCase().includes(query) ||
      temple.state?.toLowerCase().includes(query) ||
      temple.country?.toLowerCase().includes(query) ||
      temple.founder.name.toLowerCase().includes(query)
    );
  });

  const handleVerify = (templeId: string) => {
    if (confirm('Are you sure you want to verify this temple?')) {
      verifyTempleMutation.mutate(templeId);
    }
  };

  const handleReject = (templeId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      rejectTempleMutation.mutate(templeId);
    }
  };

  const filterTabs = [
    { id: 'all' as FilterType, label: 'All Temples', count: temples.length },
    {
      id: 'pending' as FilterType,
      label: 'Pending Verification',
      count: temples.filter((t) => !t.verified && t.status === 'ACTIVE').length,
    },
    {
      id: 'verified' as FilterType,
      label: 'Verified',
      count: temples.filter((t) => t.verified).length,
    },
    {
      id: 'rejected' as FilterType,
      label: 'Rejected',
      count: temples.filter((t) => t.status === 'REJECTED').length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 size={28} />
            Temple Management
          </h2>
          <p className="text-muted mt-1">
            Manage temple verification and temple-babalawo relationships
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search temples by name, location, or founder..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-12 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-white/10 overflow-x-auto">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-3 flex items-center gap-2 font-medium transition-colors border-b-2 ${
              filter === tab.id
                ? 'border-highlight text-highlight'
                : 'border-transparent text-muted hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Temples List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredTemples.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <Building2 size={48} className="mx-auto mb-4 opacity-50" />
          <p>No temples found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTemples.map((temple) => (
            <div
              key={temple.id}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-highlight/50 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Temple Header */}
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-highlight/20 flex items-center justify-center text-highlight text-2xl font-bold flex-shrink-0">
                      <Building2 size={32} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{temple.name}</h3>
                        {temple.verified ? (
                          <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                            <CheckCircle size={14} />
                            Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                            <Clock size={14} />
                            Pending
                          </span>
                        )}
                        {temple.status === 'REJECTED' && (
                          <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">
                            <XCircle size={14} />
                            Rejected
                          </span>
                        )}
                      </div>
                      {temple.yorubaName && (
                        <p className="text-highlight font-medium mb-1">{temple.yorubaName}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted">
                        <span className="flex items-center gap-1">
                          <Building2 size={14} />
                          {temple.type}
                        </span>
                        {(temple.city || temple.state || temple.country) && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {[temple.city, temple.state, temple.country].filter(Boolean).join(', ')}
                          </span>
                        )}
                        {temple._count && (
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {temple._count.babalawos} member{temple._count.babalawos !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Temple Details */}
                  {temple.description && (
                    <p className="text-muted text-sm line-clamp-2">{temple.description}</p>
                  )}

                  {/* Founder Info */}
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-muted mb-1">Founder</p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">
                        {temple.founder.yorubaName || temple.founder.name}
                      </span>
                      {temple.founder.verified && (
                        <Shield size={14} className="text-highlight" />
                      )}
                      <span className="text-xs text-muted">({temple.founder.email})</span>
                    </div>
                  </div>

                  {/* Lineage/Tradition */}
                  {(temple.lineage || temple.tradition) && (
                    <div className="flex items-center gap-4 text-xs text-muted">
                      {temple.lineage && <span>Lineage: {temple.lineage}</span>}
                      {temple.tradition && <span>Tradition: {temple.tradition}</span>}
                    </div>
                  )}

                  {/* Created Date */}
                  <p className="text-xs text-muted">
                    Created: {new Date(temple.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {!temple.verified && temple.status !== 'REJECTED' && (
                    <>
                      <button
                        onClick={() => handleVerify(temple.id)}
                        disabled={verifyTempleMutation.isPending}
                        className="px-4 py-2 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                      >
                        <CheckCircle size={16} />
                        Verify
                      </button>
                      <button
                        onClick={() => handleReject(temple.id)}
                        disabled={rejectTempleMutation.isPending}
                        className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      // Navigate to temple detail page or open modal
                      window.location.href = `/temples/${temple.slug}`;
                    }}
                    className="px-4 py-2 bg-white/5 text-white border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TempleManagementView;
