import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { XCircle, Store, Loader2, FileText, User } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { UserRole, VendorStatus } from '@common';
import { getDemoUsersByRole } from '@/demo';
import VerificationBadge from '@/shared/components/verification-badge';
import { useToast } from '@/shared/components/toast';

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

/**
 * Vendor Review View
 * Admin interface for reviewing vendor applications with cultural authenticity vetting
 */
const VendorReviewView: React.FC = () => {
  const queryClient = useQueryClient();
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
    queryKey: ['admin-vendors'],
    queryFn: async () => {
      try {
        const response = await api.get('/marketplace/vendors');
        return response.data;
      } catch (error) {
        if (!isDemoMode) throw error;
        logger.warn('Failed to fetch vendors, using demo data');
        return demoVendors;
      }
    },
  });

  const { success } = useToast();

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
      success('Vendor approved successfully!');
    },
    onError: (error: any) => {
      error(`Failed to approve vendor: ${error.response?.data?.message || error.message}`);
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
      success('Vendor rejected successfully!');
    },
    onError: (error: any) => {
      error(`Failed to reject vendor: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleApprove = (vendorId: string) => {
    approveVendorMutation.mutate({ vendorId, notes: reviewNotes });
  };

  const handleReject = (vendorId: string) => {
    rejectVendorMutation.mutate({ vendorId, reason: rejectionReason, notes: reviewNotes });
  };

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
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>;
  }
  
  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 p-6">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-3">
              <Store className="text-primary" size={36} />
              Vendor Review Center
            </h1>
            <p className="text-stone-500 mt-2">Review and manage marketplace vendors</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm">
            <div className="text-2xl font-bold text-stone-900">{vendors.filter(v => v.status === 'PENDING').length}</div>
            <div className="text-sm text-stone-500">Pending Reviews</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm">
            <div className="text-2xl font-bold text-green-600">{vendors.filter(v => v.status === 'APPROVED').length}</div>
            <div className="text-sm text-stone-500">Approved</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm">
            <div className="text-2xl font-bold text-red-600">{vendors.filter(v => v.status === 'REJECTED').length}</div>
            <div className="text-sm text-stone-500">Rejected</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">{vendors.filter(v => v.status === 'SUSPENDED').length}</div>
            <div className="text-sm text-stone-500">Suspended</div>
          </div>
        </div>

        {/* Vendors Table */}
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Vendor</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Business</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-stone-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-stone-200 flex items-center justify-center">
                          <User size={20} className="text-stone-500" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-stone-900">{vendor.user.name}</div>
                        <div className="text-sm text-stone-500">{vendor.user.yorubaName || 'No Yoruba name'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-stone-900">{vendor.businessName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">{vendor.user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(vendor.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedVendor(vendor)}
                        className="p-2 text-stone-500 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                        title="Review Application"
                      >
                        <FileText size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Dialog */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-stone-900">Review Application</h2>
                <button onClick={() => setSelectedVendor(null)} className="p-2 hover:bg-stone-100 rounded-lg">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-stone-900 mb-2">{selectedVendor.businessName}</h3>
                  <p className="text-stone-600">{selectedVendor.description || 'No description provided'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Business License</label>
                    {selectedVendor.businessLicense ? (
                      <div className="flex items-center text-sm text-stone-900">
                        <FileText size={14} className="mr-1" /> Document Uploaded
                      </div>
                    ) : (
                      <p className="text-sm text-stone-500">Not provided</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Tax ID</label>
                    {selectedVendor.taxId ? (
                      <div className="text-sm text-stone-900">Provided</div>
                    ) : (
                      <p className="text-sm text-stone-500">Not provided</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Cultural Authenticity Proof</label>
                  {selectedVendor.artisanHeritageProof ? (
                    <div className="flex items-center text-sm text-stone-900">
                      <FileText size={14} className="mr-1" /> Artisan Heritage Document
                    </div>
                  ) : (
                    <p className="text-sm text-stone-500">Not provided</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Yoruba Proficiency</label>
                  <p className="text-sm text-stone-900">
                    {selectedVendor.yorubaProficiencyLevel || 'Not specified'} 
                    {selectedVendor.yorubaProficiencyProof && ' • Proof provided'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Verification Status</label>
                  <div className="flex items-center">
                    <VerificationBadge verified={selectedVendor.user.verified} />
                    <span className="ml-2 text-sm text-stone-900">
                      {selectedVendor.user.verified ? 'Verified' : 'Not verified'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Cultural Authenticity Notes</label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about cultural authenticity (optional)"
                    className="w-full h-24 p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                {selectedVendor.status === VendorStatus.REJECTED && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-red-800">Rejection Reason: {selectedVendor.rejectionReason}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(selectedVendor.id)}
                    disabled={approveVendorMutation.isPending}
                    className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {approveVendorMutation.isPending ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </div>
                    ) : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(selectedVendor.id)}
                    disabled={rejectVendorMutation.isPending}
                    className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {rejectVendorMutation.isPending ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </div>
                    ) : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorReviewView;