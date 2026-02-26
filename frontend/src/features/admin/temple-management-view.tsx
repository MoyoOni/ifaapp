import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, CheckCircle, XCircle, Clock, Users, MapPin, Shield, Search } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { DEMO_TEMPLES, getDemoUserById, type DemoUser } from '@/demo';
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
      message: 'Please provide a reason for rejection:',
      confirmText: 'Reject',
      cancelText: 'Cancel',
      showInput: true,
      inputPlaceholder: 'Enter rejection reason...',
      onConfirm: (reason) => {
        if (reason) {
          rejectTempleMutation.mutate(templeId);
        }
      }
    });
  };