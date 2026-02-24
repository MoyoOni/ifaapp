import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, CheckCircle, XCircle, Package, Eye, Loader2, Calendar, Search } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { DEMO_GUIDANCE_PLANS, getDemoAppointmentById, getDemoUserById } from '@/demo';

interface GuidancePlan {
  id: string;
  type: string;
  totalCost: number;
  platformServiceFee: number;
  currency: string;
  status: string;
  appointment: {
    id: string;
    date: string;
    time: string;
  };
  babalawo: {
    id: string;
    name: string;
    yorubaName?: string;
  };
  client: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface GuidancePlanHistoryViewProps {
  userId?: string;
  onViewDetails?: (guidancePlanId: string) => void;
}

/**
 * Guidance Plan History View
 * Shows list of guidance plans with status tracking and archival functionality
 */
const GuidancePlanHistoryView: React.FC<GuidancePlanHistoryViewProps> = ({
  userId,
  onViewDetails,
}) => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ 
    start: '', 
    end: '' 
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'all' | 'active' | 'archived'>('all'); // Added view mode for archive functionality

  const targetUserId = userId || user?.id;

  const buildDemoPlans = (): GuidancePlan[] => {
    return Object.values(DEMO_GUIDANCE_PLANS).map((plan) => {
      const appointment = getDemoAppointmentById(plan.appointmentId);
      const babalawo = getDemoUserById(plan.babalawoId);
      const client = getDemoUserById(plan.clientId);

      return {
        id: plan.id,
        type: plan.type,
        totalCost: plan.totalCost,
        platformServiceFee: 0,
        currency: 'NGN',
        status: plan.status,
        appointment: {
          id: plan.appointmentId,
          date: appointment?.date || '2026-02-10',
          time: appointment?.time || '10:00',
        },
        babalawo: {
          id: plan.babalawoId,
          name: babalawo?.name || 'Babalawo',
          yorubaName: babalawo?.yorubaName,
        },
        client: {
          id: plan.clientId,
          name: client?.name || 'Client',
        },
        createdAt: plan.createdAt,
      };
    });
  };

  const getSessionPlans = (): GuidancePlan[] => {
    if (typeof sessionStorage === 'undefined') {
      return [];
    }
    const plans: GuidancePlan[] = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i);
      if (!key || !key.startsWith('demo-guidance-plan:')) {
        continue;
      }
      try {
        const parsed = JSON.parse(sessionStorage.getItem(key) || '{}') as GuidancePlan;
        if (parsed?.id) {
          plans.push(parsed);
        }
      } catch (error) {
        logger.warn('Failed to parse demo guidance plan from session', error);
      }
    }
    return plans;
  };

  const { data: guidancePlans, isLoading } = useQuery<GuidancePlan[]>({
    queryKey: ['guidance-plans', targetUserId, statusFilter],
    queryFn: async () => {
      try {
        const params: Record<string, string> = statusFilter ? { status: statusFilter } : {};
        const response = await api.get(`/guidance-plans/user/${targetUserId}`, { params });
        return response.data;
      } catch (error) {
        if (!isDemoMode) throw error;

        logger.warn('Failed to fetch guidance plans, using demo data');
        const demoPlans = buildDemoPlans();
        const sessionPlans = getSessionPlans();
        const merged = [...demoPlans];
        sessionPlans.forEach((plan) => {
          if (!merged.some((existing) => existing.id === plan.id)) {
            merged.push(plan);
          }
        });
        const filtered = statusFilter ? merged.filter((plan) => plan.status === statusFilter) : merged;
        if (targetUserId) {
          return filtered.filter(
            (plan) => plan.client.id === targetUserId || plan.babalawo.id === targetUserId
          );
        }
        return filtered;
      }
    },
    enabled: !!targetUserId,
  });

  // Filter plans based on view mode and other criteria
  const filteredGuidancePlans = guidancePlans?.filter(plan => {
    // Apply status filter
    if (statusFilter && plan.status !== statusFilter) {
      return false;
    }

    // Apply date range filter
    if (dateRange.start && new Date(plan.createdAt) < new Date(dateRange.start)) {
      return false;
    }
    if (dateRange.end && new Date(plan.createdAt) > new Date(dateRange.end)) {
      return false;
    }

    // Apply search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (
        !plan.type.toLowerCase().includes(searchLower) &&
        !plan.babalawo.name.toLowerCase().includes(searchLower) &&
        !(plan.babalawo.yorubaName && plan.babalawo.yorubaName.toLowerCase().includes(searchLower)) &&
        !plan.status.toLowerCase().replace('_', ' ').includes(searchLower)
      ) {
        return false;
      }
    }

    // Apply view mode filter (archived vs active)
    if (viewMode === 'archived' && plan.status !== 'COMPLETED') {
      return false;
    }
    if (viewMode === 'active' && plan.status === 'COMPLETED') {
      return false;
    }

    return true;
  });

  // Group plans by date
  const groupedByDate = filteredGuidancePlans?.reduce((acc, plan) => {
    const date = new Date(plan.createdAt).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(plan);
    return acc;
  }, {} as Record<string, GuidancePlan[]>);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4" />;
      case 'IN_PROGRESS':
        return <Package className="w-4 h-4" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'APPROVED':
        return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'IN_PROGRESS':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'COMPLETED':
        return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'CANCELLED':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      default:
        return 'text-muted bg-white/5 border-white/10';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-highlight" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-highlight">Guidance Plan History</h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* View Mode Selector */}
          <div className="flex border border-white/10 rounded-lg overflow-hidden">
            {(['all', 'active', 'archived'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 text-sm font-medium transition-colors flex-1 ${
                  viewMode === mode 
                    ? 'bg-highlight text-foreground' 
                    : 'bg-white/5 text-muted hover:bg-white/10'
                }`}
                aria-label={mode === 'all' ? 'Show all plans' : 
                          mode === 'active' ? 'Show active plans' : 
                          'Show archived plans'}
              >
                {mode === 'all' && 'All Plans'}
                {mode === 'active' && 'Active Plans'}
                {mode === 'archived' && 'Archived Plans'}
              </button>
            ))}
          </div>
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-highlight min-w-[150px]"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Search and Date Range Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-4 h-4" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search plans, babalawo, status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-highlight"
            aria-label="Search guidance plans"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-4 h-4" aria-hidden="true" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-highlight"
              aria-label="Start date"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-4 h-4" aria-hidden="true" />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-highlight"
              aria-label="End date"
            />
          </div>
        </div>
      </div>

      {/* Guidance Plans List */}
      {!filteredGuidancePlans || filteredGuidancePlans.length === 0 ? (
        <div className="text-center p-6 sm:p-8 bg-white/5 rounded-xl border border-white/10">
          <p className="text-muted">No guidance plans found</p>
          <p className="text-sm text-muted/70 mt-1">
            {viewMode === 'archived' 
              ? 'No archived plans match your filters' 
              : 'Try adjusting your filters or create a new guidance plan'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByDate && Object.entries(groupedByDate).map(([date, plans]) => (
            <div key={date} className="space-y-4">
              <h3 className="text-lg font-bold text-muted border-b border-white/10 pb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              
              <div className="space-y-4">
                {plans.map((guidancePlan) => (
                  <div
                    key={guidancePlan.id}
                    className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10 hover:border-highlight/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <h3 className="text-lg font-semibold break-words max-w-full">
                            {guidancePlan.type} Guidance Plan
                          </h3>
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${getStatusColor(
                              guidancePlan.status
                            )}`}
                          >
                            {getStatusIcon(guidancePlan.status)}
                            <span className="text-sm font-medium whitespace-nowrap">
                              {guidancePlan.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 text-sm">
                          <div>
                            <p className="text-muted">Babalawo</p>
                            <p className="font-medium break-words max-w-full">
                              {guidancePlan.babalawo.yorubaName || guidancePlan.babalawo.name}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted">Session Date</p>
                            <p className="font-medium break-words max-w-full">
                              {new Date(guidancePlan.appointment.date).toLocaleDateString()} at{' '}
                              {guidancePlan.appointment.time}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted">Total Amount</p>
                            <p className="font-medium text-highlight break-words max-w-full">
                              {formatCurrency(guidancePlan.totalCost + guidancePlan.platformServiceFee, guidancePlan.currency)}
                            </p>
                            <p className="text-xs text-muted mt-0.5 break-words max-w-full">
                              Items: {formatCurrency(guidancePlan.totalCost, guidancePlan.currency)} + 
                              Fee: {formatCurrency(guidancePlan.platformServiceFee, guidancePlan.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted">Created</p>
                            <p className="font-medium break-words max-w-full">
                              {new Date(guidancePlan.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {onViewDetails && (
                        <button
                          onClick={() => onViewDetails(guidancePlan.id)}
                          className="ml-0 sm:ml-4 p-2 hover:bg-white/10 rounded-lg transition-colors self-start"
                          aria-label={`View details for ${guidancePlan.type} guidance plan`}
                        >
                          <Eye className="w-5 h-5 text-muted" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuidancePlanHistoryView;