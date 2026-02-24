import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Shield,
  Clock,
  User,
  Building2,
  Package,
  Search,
  Filter,
  ChevronDown,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Award,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import api from '@/lib/api';
import { isDemoMode } from '@/shared/config/demo-mode';
import { logger } from '@/shared/utils/logger';
import { cn } from '@/lib/utils';

interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userType: 'babalawo' | 'vendor' | 'temple';
  status: 'pending' | 'approved' | 'rejected' | 'review';
  submittedAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  documents: string[];
  notes?: string;
  rejectionReason?: string;
  verificationLevel?: 'basic' | 'standard' | 'premium';
}

interface QualityMetrics {
  totalRequests: number;
  pendingReviews: number;
  approvedToday: number;
  rejectedToday: number;
  avgReviewTime: number;
  approvalRate: number;
}

const VerificationDashboard: React.FC = () => {
  const { user: _user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'review'>('all');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'babalawo' | 'vendor' | 'temple'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch verification requests
  const { data: requests = [], isLoading } = useQuery<VerificationRequest[]>({
    queryKey: ['verification-requests', searchQuery, statusFilter, userTypeFilter],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/verification/requests', {
          params: {
            search: searchQuery || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            userType: userTypeFilter !== 'all' ? userTypeFilter : undefined,
          },
        });
        return response.data || [];
      } catch (error) {
        if (!isDemoMode) throw error;
        
        logger.warn('Using demo data for verification requests');
        
        // Generate demo requests
        const userTypes: ('babalawo' | 'vendor' | 'temple')[] = ['babalawo', 'vendor', 'temple'];
        const statuses: ('pending' | 'approved' | 'rejected' | 'review')[] = ['pending', 'approved', 'rejected', 'review'];
        
        return Array.from({ length: 15 }, (_, index) => ({
          id: `req-${index + 1}`,
          userId: `user-${index + 1}`,
          userName: `User ${index + 1}`,
          userEmail: `user${index + 1}@example.com`,
          userType: userTypes[index % userTypes.length],
          status: statuses[index % statuses.length],
          submittedAt: new Date(Date.now() - Math.random() * 604800000).toISOString(),
          reviewedAt: statuses[index % statuses.length] !== 'pending' ? 
            new Date(Date.now() - Math.random() * 86400000).toISOString() : undefined,
          documents: [`doc-${index + 1}.pdf`],
          notes: index % 3 === 0 ? 'Additional documentation required' : undefined,
          rejectionReason: statuses[index % statuses.length] === 'rejected' ? 'Incomplete credentials' : undefined,
          verificationLevel: ['basic', 'standard', 'premium'][index % 3] as any
        }));
      }
    },
  });

  // Fetch quality metrics
  const { data: metrics = null, isLoading: metricsLoading } = useQuery<QualityMetrics>({
    queryKey: ['verification-metrics'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/verification/metrics');
        return response.data;
      } catch (error) {
        if (!isDemoMode) throw error;
        
        logger.warn('Using demo data for verification metrics');
        
        return {
          totalRequests: 127,
          pendingReviews: 23,
          approvedToday: 8,
          rejectedToday: 2,
          avgReviewTime: 156,
          approvalRate: 87.3
        };
      }
    },
  });

  // Filter requests
  const filteredRequests = requests.filter(request => {
    // Search filter
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      if (!request.userName.toLowerCase().includes(term) && 
          !request.userEmail.toLowerCase().includes(term)) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'all' && request.status !== statusFilter) {
      return false;
    }

    // User type filter
    if (userTypeFilter !== 'all' && request.userType !== userTypeFilter) {
      return false;
    }

    return true;
  });

  // Mutations
  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      await api.post(`/admin/verification/${requestId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['verification-metrics'] });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      await api.post(`/admin/verification/${requestId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['verification-metrics'] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case 'babalawo': return <User size={16} className="text-purple-600" />;
      case 'vendor': return <Package size={16} className="text-amber-600" />;
      case 'temple': return <Building2 size={16} className="text-blue-600" />;
      default: return <User size={16} className="text-gray-600" />;
    }
  };

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'babalawo': return 'bg-purple-100 text-purple-800';
      case 'vendor': return 'bg-amber-100 text-amber-800';
      case 'temple': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading || metricsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-8 text-white shadow-xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Member Verification</h1>
            <p className="text-green-100 text-lg">
              Safeguard community authenticity and quality standards
            </p>
          </div>
        </motion.div>

        {/* Quality Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Pending Reviews</p>
                <h3 className="text-3xl font-bold text-stone-900 mt-1">{metrics?.pendingReviews || 0}</h3>
              </div>
              <div className="bg-yellow-100 p-3 rounded-xl text-yellow-700">
                <Clock size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Approved Today</p>
                <h3 className="text-3xl font-bold text-stone-900 mt-1">{metrics?.approvedToday || 0}</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-xl text-green-700">
                <ThumbsUp size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Approval Rate</p>
                <h3 className="text-3xl font-bold text-stone-900 mt-1">{metrics?.approvalRate || 0}%</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl text-blue-700">
                <Award size={24} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 mb-8 border border-stone-200 shadow-sm"
        >
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-stone-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-green-600 font-medium hover:text-green-700 transition-colors"
          >
            <Filter size={18} />
            Filter Requests
            <ChevronDown 
              size={16} 
              className={cn("transition-transform", showFilters && "rotate-180")} 
            />
          </button>

          {/* Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-stone-200"
            >
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="review">In Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">User Type</label>
                <select
                  value={userTypeFilter}
                  onChange={(e) => setUserTypeFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="babalawo">Babalawo</option>
                  <option value="vendor">Vendor</option>
                  <option value="temple">Temple</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setUserTypeFilter('all');
                  }}
                  className="w-full py-2 px-4 bg-stone-100 text-stone-700 font-medium rounded-lg hover:bg-stone-200 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-stone-600">
            Showing <span className="font-bold text-stone-900">{filteredRequests.length}</span> verification requests
            {searchQuery && (
              <span> matching "<span className="text-green-600">{searchQuery}</span>"</span>
            )}
          </p>
        </div>

        {/* Requests List */}
        <motion.div 
          className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
          layout
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-stone-700">Applicant</th>
                  <th className="text-left py-4 px-6 font-semibold text-stone-700">Type</th>
                  <th className="text-left py-4 px-6 font-semibold text-stone-700">Submitted</th>
                  <th className="text-left py-4 px-6 font-semibold text-stone-700">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-stone-700">Documents</th>
                  <th className="text-right py-4 px-6 font-semibold text-stone-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request, index) => (
                  <motion.tr
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-stone-100 rounded-lg">
                          {getUserTypeIcon(request.userType)}
                        </div>
                        <div>
                          <p className="font-medium text-stone-900">{request.userName}</p>
                          <p className="text-sm text-stone-500">{request.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn("inline-block px-2 py-1 text-xs font-medium rounded-full", getUserTypeColor(request.userType))}>
                        {request.userType.charAt(0).toUpperCase() + request.userType.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-stone-600">
                        {new Date(request.submittedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn("inline-block px-2 py-1 text-xs font-medium rounded-full", getStatusColor(request.status))}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-stone-400" />
                        <span className="text-sm text-stone-600">{request.documents.length} documents</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-stone-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <Eye size={18} />
                        </button>
                        {request.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => approveRequestMutation.mutate(request.id)}
                              className="p-2 text-stone-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              disabled={approveRequestMutation.isPending}
                            >
                              <ThumbsUp size={18} />
                            </button>
                            <button 
                              onClick={() => rejectRequestMutation.mutate({ requestId: request.id, reason: 'Documentation incomplete' })}
                              className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              disabled={rejectRequestMutation.isPending}
                            >
                              <ThumbsDown size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Empty State */}
        {filteredRequests.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-2xl border border-stone-200"
          >
            <Shield size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-xl font-bold text-stone-900 mb-2">No Requests Found</h3>
            <p className="text-stone-600 mb-6">
              Adjust your filters to see verification requests
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setUserTypeFilter('all');
              }}
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Clear All Filters
            </button>
          </motion.div>
        )}

        {/* Quality Assurance Tools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-white rounded-2xl p-6 border border-stone-200"
        >
          <h3 className="text-xl font-bold text-stone-900 mb-6">Quality Assurance Tools</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center gap-4 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
              <div className="p-3 bg-green-200 rounded-lg">
                <AlertTriangle size={20} className="text-green-700" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-stone-900">Flag Suspicious</h4>
                <p className="text-sm text-stone-600">Report concerning applications</p>
              </div>
            </button>
            
            <button className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
              <div className="p-3 bg-blue-200 rounded-lg">
                <FileText size={20} className="text-blue-700" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-stone-900">Document Review</h4>
                <p className="text-sm text-stone-600">Verify credentials thoroughly</p>
              </div>
            </button>
            
            <button className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
              <div className="p-3 bg-purple-200 rounded-lg">
                <Award size={20} className="text-purple-700" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-stone-900">Certification Levels</h4>
                <p className="text-sm text-stone-600">Assign verification tiers</p>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerificationDashboard;