import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, CheckCircle, XCircle, Eye, Store, Loader2, AlertCircle, FileText, Globe } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { UserRole, VendorStatus } from '@common';
import { getDemoUsersByRole } from '@/demo';
import VerificationBadge from '@/shared/components/verification-badge';

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
      alert('Vendor approved successfully!');
    },
    onError: (error: any) => {
      alert(`Failed to approve vendor: ${error.response?.data?.message || error.message}`);
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
      alert('Vendor rejected successfully!');
    },
    onError: (error: any) => {
      alert(`Failed to reject vendor: ${error.response?.data?.message || error.message}`);
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
      alert('Vendor suspended successfully!');
    },
    onError: (error: any) => {
      alert(`Failed to suspend vendor: ${error.response?.data?.message || error.message}`);
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

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white flex items-center gap-3">
        <Store size={28} /> Vendor Review & Cultural Authenticity
      </h2>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
          <input
            type="text"
            placeholder="Search vendors by name, business, email..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-12 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as VendorFilterStatus)}
        >
          <option value="ALL">All Vendors</option>
          <option value="PENDING">Pending Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Vendor List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-highlight" />
        </div>
      ) : vendors.length === 0 ? (
        <p className="text-center text-muted py-12">No vendors found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((vendor) => (
            <div key={vendor.id} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{vendor.businessName}</h3>
                  <p className="text-sm text-muted">
                    {vendor.user.yorubaName || vendor.user.name}
                    <VerificationBadge verified={vendor.user.verified} />
                  </p>
                </div>
                {getStatusBadge(vendor.status)}
              </div>

              <p className="text-sm text-muted line-clamp-2">{vendor.description || 'No description'}</p>

              {/* Cultural Authenticity Indicators */}
              <div className="space-y-2 text-sm">
                {vendor.artisanHeritageProof && (
                  <div className="flex items-center gap-2 text-highlight">
                    <FileText size={14} />
                    <span>Artisan Heritage Proof Provided</span>
                  </div>
                )}
                {vendor.yorubaProficiencyLevel && (
                  <div className="flex items-center gap-2 text-highlight">
                    <Globe size={14} />
                    <span>Yoruba Proficiency: {vendor.yorubaProficiencyLevel}</span>
                  </div>
                )}
                {vendor.endorsementBy && (
                  <div className="flex items-center gap-2 text-green-300">
                    <CheckCircle size={14} />
                    <span>Endorsed by Babalawo/Elder</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => setSelectedVendor(vendor)}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  <Eye size={16} /> Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vendor Detail Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
          <div className="bg-background rounded-xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar relative">
            <button
              onClick={() => {
                setSelectedVendor(null);
                setReviewNotes('');
                setRejectionReason('');
              }}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
            >
              <XCircle size={20} />
            </button>

            <h3 className="text-2xl font-bold text-highlight mb-4">{selectedVendor.businessName}</h3>

            <div className="space-y-6">
              {/* Vendor Info */}
              <div className="bg-white/5 rounded-xl p-4 space-y-2">
                <p><strong className="text-highlight">Owner:</strong> {selectedVendor.user.yorubaName || selectedVendor.user.name} ({selectedVendor.user.email})</p>
                <p><strong className="text-highlight">Status:</strong> {selectedVendor.status}</p>
                {selectedVendor.businessLicense && <p><strong className="text-highlight">Business License:</strong> {selectedVendor.businessLicense}</p>}
                {selectedVendor.taxId && <p><strong className="text-highlight">Tax ID:</strong> {selectedVendor.taxId}</p>}
                {selectedVendor._count && (
                  <p><strong className="text-highlight">Products:</strong> {selectedVendor._count.products} | <strong className="text-highlight">Orders:</strong> {selectedVendor._count.orders}</p>
                )}
              </div>

              {/* Description */}
              {selectedVendor.description && (
                <div className="bg-white/5 rounded-xl p-4">
                  <h4 className="font-bold text-highlight mb-2">Business Description</h4>
                  <p className="text-white">{selectedVendor.description}</p>
                </div>
              )}

              {/* Cultural Authenticity Section */}
              <div className="bg-highlight/10 border border-highlight/30 rounded-xl p-4 space-y-4">
                <h4 className="font-bold text-highlight flex items-center gap-2">
                  <AlertCircle size={20} /> Cultural Authenticity Review
                </h4>

                {selectedVendor.artisanHeritageProof && (
                  <div>
                    <p className="text-sm font-medium text-highlight mb-1">Artisan Heritage Proof:</p>
                    <a href={selectedVendor.artisanHeritageProof} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:underline text-sm">
                      {selectedVendor.artisanHeritageProof}
                    </a>
                  </div>
                )}

                {selectedVendor.yorubaProficiencyLevel && (
                  <div>
                    <p className="text-sm font-medium text-highlight mb-1">Yoruba Proficiency Level:</p>
                    <p className="text-white">{selectedVendor.yorubaProficiencyLevel}</p>
                    {selectedVendor.yorubaProficiencyProof && (
                      <a href={selectedVendor.yorubaProficiencyProof} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:underline text-sm">
                        Proof: {selectedVendor.yorubaProficiencyProof}
                      </a>
                    )}
                  </div>
                )}

                {selectedVendor.endorsementBy && (
                  <div>
                    <p className="text-sm font-medium text-highlight mb-1">Endorsed By:</p>
                    <p className="text-white">User ID: {selectedVendor.endorsementBy}</p>
                  </div>
                )}

                {selectedVendor.culturalAuthenticityNotes && (
                  <div>
                    <p className="text-sm font-medium text-highlight mb-1">Previous Review Notes:</p>
                    <p className="text-white text-sm">{selectedVendor.culturalAuthenticityNotes}</p>
                  </div>
                )}

                {selectedVendor.rejectionReason && (
                  <div>
                    <p className="text-sm font-medium text-red-300 mb-1">Rejection Reason:</p>
                    <p className="text-white text-sm">{selectedVendor.rejectionReason}</p>
                  </div>
                )}

                {/* Review Notes Input */}
                <div>
                  <label className="block text-sm font-medium text-highlight mb-2">
                    Cultural Authenticity Review Notes
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about cultural authenticity, heritage verification, language proficiency, etc."
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                {selectedVendor.status === VendorStatus.PENDING && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-red-300 mb-2">
                        Rejection Reason (if rejecting)
                      </label>
                      <input
                        type="text"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Reason for rejection..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => approveVendorMutation.mutate({ vendorId: selectedVendor.id, notes: reviewNotes })}
                        disabled={approveVendorMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 px-4 py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                      >
                        {approveVendorMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                        Approve
                      </button>
                      <button
                        onClick={() => rejectVendorMutation.mutate({ vendorId: selectedVendor.id, reason: rejectionReason, notes: reviewNotes })}
                        disabled={rejectVendorMutation.isPending || !rejectionReason.trim()}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                      >
                        {rejectVendorMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                        Reject
                      </button>
                    </div>
                  </>
                )}

                {selectedVendor.status === VendorStatus.APPROVED && (
                  <button
                    onClick={() => suspendVendorMutation.mutate({ vendorId: selectedVendor.id, notes: reviewNotes })}
                    disabled={suspendVendorMutation.isPending}
                    className="flex items-center justify-center gap-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 px-4 py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                  >
                    {suspendVendorMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} />}
                    Suspend Vendor
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorReviewView;
