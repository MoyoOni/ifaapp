import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, CheckCircle, XCircle, Eye, Store, Loader2, AlertCircle, FileText, Globe } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { UserRole, VendorStatus } from '@common';
import { getDemoUsersByRole } from '@/demo';
import VerificationBadge from '@/shared/components/verification-badge';
import { useToast } from '@/components/common/ToastProvider';

interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  businessLicense?: string;
  taxId?: string;
  status: VendorStatus;
  endorsementBy?: string;
  description?: string;
  artisanHeritageProof?: string;
  yorubaProficiencyLevel?: string;
  yorubaProficiencyProof?: string;
  culturalAuthenticityNotes?: string;
  rejectionReason?: string;
  verifiedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    verified: boolean;
    yorubaName?: string;
  };
  _count?: {
    products: number;
    orders: number;
  };
}

type VendorFilterStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

/**
 * Vendor Review View
 * Admin interface for reviewing vendor applications with cultural authenticity vetting
 */
const VendorReviewView: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<VendorFilterStatus>('PENDING');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const demoVendors: Vendor[] = getDemoUsersByRole(UserRole.VENDOR)
    .map((demoUser) => {
      return {
      id: demoUser.id,
      userId: demoUser.id,
      businessName: demoUser.name,
      status: VendorStatus.PENDING,
      description: demoUser.bio || 'Demo vendor application.',
      createdAt: demoUser.createdAt || new Date().toISOString(),
      user: {
        id: demoUser.id,
        name: demoUser.name,
        email: demoUser.email || 'vendor@example.com',
        verified: demoUser.verified ?? true,
        yorubaName: demoUser.yorubaName,
      },
      _count: {
        products: 2,
        orders: 5,
      },
    };
    });

  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ['admin-vendors', filterStatus, searchQuery],
    queryFn: async () => {
      try {
        const params: Record<string, any> = {};
        if (filterStatus !== 'ALL') {
          params.status = filterStatus;
        }
        if (searchQuery) {
          params.search = searchQuery;
        }
        const response = await api.get('/marketplace/vendors', { params });
        return response.data;
      } catch (error) {
        if (!isDemoMode) throw error;

        logger.warn('Failed to fetch vendors, using demo data');
        const filtered = filterStatus === 'ALL'
          ? demoVendors
          : demoVendors.filter((vendor) => vendor.status === filterStatus);
        return searchQuery
          ? filtered.filter((vendor) => vendor.businessName.toLowerCase().includes(searchQuery.toLowerCase()))
          : filtered;
      }
    },
  });

  const { showToast } = useToast();

  const approveVendorMutation = useMutation({
    mutationFn: async ({ vendorId, notes }: { vendorId: string; notes: string }) => {
      await api.patch(`/marketplace/vendors/${vendorId}`, {
        status: VendorStatus.APPROVED,
        culturalAuthenticityNotes: notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      setSelectedVendor(null);
      setReviewNotes('');
      showToast('Vendor approved successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(`Failed to approve vendor: ${error.response?.data?.message || error.message}`, 'error');
    },
  });

  const rejectVendorMutation = useMutation({
    mutationFn: async ({ vendorId, reason, notes }: { vendorId: string; reason: string; notes: string }) => {
      await api.patch(`/marketplace/vendors/${vendorId}`, {
        status: VendorStatus.REJECTED,
        rejectionReason: reason,
        culturalAuthenticityNotes: notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      setSelectedVendor(null);
      setRejectionReason('');
      setReviewNotes('');
      showToast('Vendor rejected successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(`Failed to reject vendor: ${error.response?.data?.message || error.message}`, 'error');
    },
  });

  const suspendVendorMutation = useMutation({
    mutationFn: async ({ vendorId, notes }: { vendorId: string; notes: string }) => {
      await api.patch(`/marketplace/vendors/${vendorId}`, {
        status: VendorStatus.SUSPENDED,
        culturalAuthenticityNotes: notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      setSelectedVendor(null);
      setReviewNotes('');
      showToast('Vendor suspended successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(`Failed to suspend vendor: ${error.response?.data?.message || error.message}`, 'error');
    },
  });

  const getStatusBadge = (status: VendorStatus) => {
    switch (status) {
      case VendorStatus.APPROVED:
        return <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs font-medium">Approved</span>;
      case VendorStatus.REJECTED:
        return <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded-full text-xs font-medium">Rejected</span>;
      case VendorStatus.SUSPENDED:
        return <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full text-xs font-medium">Suspended</span>;
      default:
        return <span className="bg-highlight/20 text-highlight px-2 py-1 rounded-full text-xs font-medium">Pending</span>;
    }
  };