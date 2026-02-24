import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, XCircle, Clock, ArrowUp, User, FileText, Loader2, Search } from 'lucide-react';
import { UserRole } from '@common';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { getDemoUserById, type DemoUser } from '@/demo';
import { useToast } from '@/shared/components/toast';

interface Dispute {
  id: string;
  orderId?: string;
  escrowId?: string;
  appointmentId?: string;
  type: string;
  category: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  routedTo?: string;
  assignedTo?: string;
  escalatedAt?: string;
  resolution?: string;
  resolutionType?: string;
  resolvedAt?: string;
  createdAt: string;
  complainant: {
    id: string;
    name: string;
    yorubaName?: string;
    email: string;
  };
  respondent: {
    id: string;
    name: string;
    yorubaName?: string;
    email: string;
  };
  escrow?: {
    id: string;
    amount: number;
    currency: string;
    status: string;
  };
}

type DisputeFilter = 'ALL' | 'OPEN' | 'UNDER_REVIEW' | 'ESCALATED' | 'RESOLVED';
type DisputeRouteFilter = 'ALL' | 'ADMIN' | 'ADVISORY_BOARD' | 'BOTH';

/**
 * Dispute Center View Component
 * Admin interface for managing and resolving disputes
 */
const DisputeCenterView: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [statusFilter, setStatusFilter] = useState<DisputeFilter>('ALL');
  const [routeFilter, setRouteFilter] = useState<DisputeRouteFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [resolution, setResolution] = useState('');
  const [resolutionType, setResolutionType] = useState('REFUND');

  const demoClient1 = getDemoUserById('demo-client-1') || ({ id: 'demo-client-1', name: 'Client', role: UserRole.CLIENT } as DemoUser);
  const demoClient2 = getDemoUserById('demo-client-2') || ({ id: 'demo-client-2', name: 'Client', role: UserRole.CLIENT } as DemoUser);
  const demoBaba1 = getDemoUserById('demo-baba-1') || ({ id: 'demo-baba-1', name: 'Babalawo', role: UserRole.BABALAWO } as DemoUser);
  const demoVendor1 = getDemoUserById('demo-vendor-1') || ({ id: 'demo-vendor-1', name: 'Vendor', role: UserRole.VENDOR } as DemoUser);

  const demoDisputes: Dispute[] = [
    {
      id: 'demo-dispute-1',
      appointmentId: 'apt-1',
      type: 'CONSULTATION',
      category: 'SERVICE_QUALITY',
      title: 'Guidance session did not start on time',
      description: 'Client waited 30 minutes past scheduled time.',
      status: 'OPEN',
      priority: 'HIGH',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      complainant: {
        id: demoClient1.id,
        name: demoClient1.name,
        yorubaName: demoClient1.yorubaName,
        email: demoClient1.email || 'client@example.com',
      },
      respondent: {
        id: demoBaba1.id,
        name: demoBaba1.name,
        yorubaName: demoBaba1.yorubaName,
        email: demoBaba1.email || 'babalawo@example.com',
      },
      escrow: {
        id: 'demo-escrow-1',
        amount: 25000,
        currency: 'NGN',
        status: 'HELD',
      },
    },
    {
      id: 'demo-dispute-2',
      orderId: 'order-1',
      type: 'MARKETPLACE',
      category: 'ITEM_QUALITY',
      title: 'Item not as described',
      description: 'Product description does not match received item.',
      status: 'UNDER_REVIEW',
      priority: 'NORMAL',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      complainant: {
        id: demoClient2.id,
        name: demoClient2.name,
        yorubaName: demoClient2.yorubaName,
        email: demoClient2.email || 'client2@example.com',
      },
      respondent: {
        id: demoVendor1.id,
        name: demoVendor1.name,
        yorubaName: demoVendor1.yorubaName,
        email: demoVendor1.email || 'vendor@example.com',
      },
    },
  ];

  // Fetch disputes
  const { data: disputes = [], isLoading } = useQuery<Dispute[]>({
    queryKey: ['admin-disputes', statusFilter, routeFilter],
    queryFn: async () => {
      try {
        const params: any = {};
        if (statusFilter !== 'ALL') {
          params.status = statusFilter;
        }
        if (routeFilter !== 'ALL') {
          params.routedTo = routeFilter;
        }
        const response = await api.get('/disputes', { params });
        return response.data;
      } catch (error) {
        if (!isDemoMode) throw error;

        logger.warn('Failed to fetch disputes, using demo data');
        return demoDisputes;
      }
    },
  });

  // Resolve dispute mutation
  const resolveDisputeMutation = useMutation({
    mutationFn: async ({ disputeId, resolution, resolutionType }: { disputeId: string; resolution: string; resolutionType: string }) => {
      await api.patch(`/disputes/${disputeId}/resolve`, { resolution, resolutionType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      setSelectedDispute(null);
      setResolution('');
      toast.success('Dispute resolved successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message, 'Failed to resolve dispute');
    },
  });

  // Escalate dispute mutation
  const escalateDisputeMutation = useMutation({
    mutationFn: async (disputeId: string) => {
      await api.patch(`/disputes/${disputeId}/escalate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      toast.success('Dispute escalated to Cultural Advisory Board!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message, 'Failed to escalate dispute');
    },
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: any }> = {
      OPEN: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', icon: Clock },
      UNDER_REVIEW: { bg: 'bg-blue-500/20', text: 'text-blue-300', icon: FileText },
      ESCALATED: { bg: 'bg-purple-500/20', text: 'text-purple-300', icon: ArrowUp },
      RESOLVED: { bg: 'bg-green-500/20', text: 'text-green-300', icon: CheckCircle },
      CLOSED: { bg: 'bg-gray-500/20', text: 'text-gray-300', icon: XCircle },
    };
    const badge = badges[status] || badges.OPEN;
    const Icon = badge.icon;
    return (
      <span className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1`}>
        <Icon size={12} />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, string> = {
      URGENT: 'bg-red-500/20 text-red-300',
      HIGH: 'bg-orange-500/20 text-orange-300',
      NORMAL: 'bg-blue-500/20 text-blue-300',
      LOW: 'bg-gray-500/20 text-gray-300',
    };
    return (
      <span className={`${badges[priority] || badges.NORMAL} px-2 py-1 rounded-full text-xs font-medium`}>
        {priority}
      </span>
    );
  };

  const filteredDisputes = disputes.filter((dispute) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        dispute.title.toLowerCase().includes(query) ||
        dispute.complainant.name.toLowerCase().includes(query) ||
        dispute.respondent.name.toLowerCase().includes(query) ||
        dispute.id.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white flex items-center gap-3">
        <AlertTriangle size={28} /> Dispute Center
      </h2>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
          <input
            type="text"
            placeholder="Search disputes by title, parties, or ID..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-12 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DisputeFilter)}
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="ESCALATED">Escalated</option>
          <option value="RESOLVED">Resolved</option>
        </select>
        <select
          className="bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
          value={routeFilter}
          onChange={(e) => setRouteFilter(e.target.value as DisputeRouteFilter)}
        >
          <option value="ALL">All Routes</option>
          <option value="ADMIN">Admin</option>
          <option value="ADVISORY_BOARD">Advisory Board</option>
          <option value="BOTH">Both</option>
        </select>
      </div>

      {/* Dispute List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-highlight" />
        </div>
      ) : filteredDisputes.length === 0 ? (
        <p className="text-center text-muted py-12">No disputes found.</p>
      ) : (
        <div className="space-y-4">
          {filteredDisputes.map((dispute) => (
            <div
              key={dispute.id}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-highlight transition-all cursor-pointer"
              onClick={() => setSelectedDispute(dispute)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusBadge(dispute.status)}
                    {getPriorityBadge(dispute.priority)}
                    {dispute.routedTo && (
                      <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-xs font-medium">
                        {dispute.routedTo.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{dispute.title}</h3>
                  <p className="text-sm text-muted line-clamp-2 mb-3">{dispute.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted">
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      Complainant: {dispute.complainant.yorubaName || dispute.complainant.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      Respondent: {dispute.respondent.yorubaName || dispute.respondent.name}
                    </span>
                    {dispute.escrow && (
                      <span className="text-highlight">
                        Escrow: {dispute.escrow.currency} {dispute.escrow.amount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs text-muted">
                  <p>{new Date(dispute.createdAt).toLocaleDateString()}</p>
                  <p className="mt-1">ID: {dispute.id.slice(0, 8)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dispute Detail Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
          <div className="bg-background rounded-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar relative">
            <button
              onClick={() => setSelectedDispute(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
            >
              <XCircle size={20} />
            </button>

            <h3 className="text-2xl font-bold text-highlight mb-4">{selectedDispute.title}</h3>
            <div className="flex items-center gap-3 mb-6">
              {getStatusBadge(selectedDispute.status)}
              {getPriorityBadge(selectedDispute.priority)}
              {selectedDispute.routedTo && (
                <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-medium">
                  Routed to: {selectedDispute.routedTo.replace('_', ' ')}
                </span>
              )}
            </div>

            <div className="space-y-6 mb-6">
              <div>
                <h4 className="text-sm font-bold text-muted uppercase tracking-widest mb-2">Description</h4>
                <p className="text-white">{selectedDispute.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-bold text-muted uppercase tracking-widest mb-2">Complainant</h4>
                  <p className="text-white">{selectedDispute.complainant.yorubaName || selectedDispute.complainant.name}</p>
                  <p className="text-xs text-muted">{selectedDispute.complainant.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-muted uppercase tracking-widest mb-2">Respondent</h4>
                  <p className="text-white">{selectedDispute.respondent.yorubaName || selectedDispute.respondent.name}</p>
                  <p className="text-xs text-muted">{selectedDispute.respondent.email}</p>
                </div>
              </div>

              {selectedDispute.escrow && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-yellow-400 mb-2">Escrow Information</h4>
                  <p className="text-white">
                    Amount: {selectedDispute.escrow.currency} {selectedDispute.escrow.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted">Status: {selectedDispute.escrow.status}</p>
                </div>
              )}

              {selectedDispute.resolution && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-green-400 mb-2">Resolution</h4>
                  <p className="text-white">{selectedDispute.resolution}</p>
                  {selectedDispute.resolutionType && (
                    <p className="text-sm text-muted mt-2">
                      Type: {selectedDispute.resolutionType.replace('_', ' ')}
                    </p>
                  )}
                  {selectedDispute.resolvedAt && (
                    <p className="text-xs text-muted mt-1">
                      Resolved: {new Date(selectedDispute.resolvedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Resolution Form (if not resolved) */}
            {selectedDispute.status !== 'RESOLVED' && selectedDispute.status !== 'CLOSED' && (
              <div className="space-y-4 pt-6 border-t border-white/10">
                <h4 className="text-lg font-bold text-white">Resolution</h4>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={4}
                  placeholder="Enter resolution details..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight resize-none"
                />
                <select
                  value={resolutionType}
                  onChange={(e) => setResolutionType(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
                >
                  <option value="REFUND">Full Refund</option>
                  <option value="PARTIAL_REFUND">Partial Refund</option>
                  <option value="NO_ACTION">No Action</option>
                  <option value="WARNING">Warning</option>
                  <option value="SUSPENSION">Suspension</option>
                </select>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      resolveDisputeMutation.mutate({
                        disputeId: selectedDispute.id,
                        resolution,
                        resolutionType,
                      });
                    }}
                    disabled={resolveDisputeMutation.isPending || !resolution.trim()}
                    className="flex-1 px-6 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {resolveDisputeMutation.isPending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <CheckCircle size={18} />
                    )}
                    Resolve Dispute
                  </button>
                  {selectedDispute.routedTo !== 'ADVISORY_BOARD' && (
                    <button
                      onClick={() => escalateDisputeMutation.mutate(selectedDispute.id)}
                      disabled={escalateDisputeMutation.isPending}
                      className="px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {escalateDisputeMutation.isPending ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <ArrowUp size={18} />
                      )}
                      Escalate to Advisory Board
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputeCenterView;
