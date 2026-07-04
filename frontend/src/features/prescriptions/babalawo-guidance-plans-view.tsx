import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Play,
  Eye,
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { isDevModeActive } from '@/shared/utils/dev-mode';

interface GuidancePlanItem {
  name: string;
  quantity: number;
  description?: string;
  cost: number;
}

interface GuidancePlan {
  id: string;
  type: string;
  items: GuidancePlanItem[];
  totalCost: number;
  platformServiceFee: number;
  currency: string;
  instructions?: string;
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
    email: string;
  };
  escrow?: {
    id: string;
    status: string;
    amount: number;
  };
  createdAt: string;
  approvedAt?: string;
  completedAt?: string;
}

interface BabalawoGuidancePlansViewProps {
  onViewDetails?: (guidancePlanId: string) => void;
}

/**
 * Babalawo Guidance Plans Management View
 * Shows guidance plans assigned to the Babalawo with action buttons
 * Allows marking plans as IN_PROGRESS or COMPLETED
 */
const BabalawoGuidancePlansView: React.FC<BabalawoGuidancePlansViewProps> = ({
  onViewDetails,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const { data: guidancePlans, isLoading } = useQuery<GuidancePlan[]>({
    queryKey: ['babalawo-guidance-plans', user?.id, statusFilter],
    queryFn: async () => {
      try {
        const params = statusFilter ? { status: statusFilter } : {};
        const response = await api.get(`/guidance-plans/user/${user?.id}`, { params });
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    enabled: !!user?.id && !isDevModeActive(),
  });

  // Mark as In Progress mutation
  const markInProgressMutation = useMutation({
    mutationFn: async (guidancePlanId: string) => {
      const response = await api.patch(
        `/guidance-plans/${guidancePlanId}/in-progress/${user?.id}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['babalawo-guidance-plans'] });
      queryClient.invalidateQueries({ queryKey: ['guidance-plans'] });
    },
  });

  // Mark as Complete mutation
  const completeMutation = useMutation({
    mutationFn: async (guidancePlanId: string) => {
      const response = await api.patch(
        `/guidance-plans/${guidancePlanId}/complete/${user?.id}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['babalawo-guidance-plans'] });
      queryClient.invalidateQueries({ queryKey: ['guidance-plans'] });
    },
  });

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
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800';
      case 'APPROVED':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
      case 'IN_PROGRESS':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
      case 'COMPLETED':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
      case 'CANCELLED':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
      default:
        return 'text-muted-foreground bg-muted/40 border-border';
    }
  };

  const getActionableCount = () => {
    if (!guidancePlans) return { approved: 0, inProgress: 0 };
    return {
      approved: guidancePlans.filter((p) => p.status === 'APPROVED').length,
      inProgress: guidancePlans.filter((p) => p.status === 'IN_PROGRESS').length,
    };
  };

  const actionCounts = getActionableCount();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-highlight" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-200">Guidance Plans</h2>
          <p className="text-stone-500 text-sm mt-1">
            Manage and track your client guidance plans
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-3">
          {actionCounts.approved > 0 && (
            <div className="px-4 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                {actionCounts.approved} awaiting start
              </span>
            </div>
          )}
          {actionCounts.inProgress > 0 && (
            <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                {actionCounts.inProgress} in progress
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setStatusFilter('')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === ''
              ? 'bg-stone-800 text-white'
              : 'bg-muted/60 text-stone-600 hover:bg-muted'
          }`}
        >
          All
        </button>
        {['APPROVED', 'IN_PROGRESS', 'COMPLETED', 'PENDING', 'CANCELLED'].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-stone-800 text-white'
                : 'bg-muted/60 text-stone-600 hover:bg-muted'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Guidance Plans List */}
      {!guidancePlans || guidancePlans.length === 0 ? (
        <div className="text-center p-12 bg-muted/40 rounded-xl border border-border">
          <Package className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 font-medium">No guidance plans found</p>
          <p className="text-stone-400 text-sm mt-1">
            Guidance plans will appear here after divination sessions
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {guidancePlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Main Row */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
                        {plan.type} Guidance Plan
                      </h3>
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${getStatusColor(
                          plan.status
                        )}`}
                      >
                        {getStatusIcon(plan.status)}
                        {plan.status.replace('_', ' ')}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        <span>{plan.client.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(plan.appointment.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="font-medium text-highlight">
                        {formatCurrency(
                          plan.totalCost + plan.platformServiceFee,
                          plan.currency
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {plan.status === 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() => markInProgressMutation.mutate(plan.id)}
                        disabled={markInProgressMutation.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {markInProgressMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        Start Work
                      </button>
                    )}

                    {plan.status === 'IN_PROGRESS' && (
                      <button
                        type="button"
                        onClick={() => completeMutation.mutate(plan.id)}
                        disabled={completeMutation.isPending}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {completeMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Mark Complete
                      </button>
                    )}

                    {onViewDetails && (
                      <button
                        type="button"
                        onClick={() => onViewDetails(plan.id)}
                        className="p-2 text-stone-400 hover:text-stone-600 hover:bg-muted/60 rounded-lg transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPlan(expandedPlan === plan.id ? null : plan.id)
                      }
                      className="p-2 text-stone-400 hover:text-stone-600 hover:bg-muted/60 rounded-lg transition-colors"
                    >
                      {expandedPlan === plan.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedPlan === plan.id && (
                <div className="border-t border-border bg-muted/40 p-5 space-y-4">
                  {/* Client Info */}
                  <div>
                    <h4 className="text-sm font-medium text-stone-500 mb-2">Client</h4>
                    <p className="font-medium">{plan.client.name}</p>
                    <p className="text-sm text-stone-500">{plan.client.email}</p>
                  </div>

                  {/* Items */}
                  <div>
                    <h4 className="text-sm font-medium text-stone-500 mb-2">
                      Plan Items
                    </h4>
                    <div className="space-y-2">
                      {plan.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-card p-3 rounded-lg border border-border"
                        >
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {item.description && (
                              <p className="text-sm text-stone-500">{item.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatCurrency(item.cost * item.quantity, plan.currency)}
                            </p>
                            <p className="text-xs text-stone-400">
                              Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Instructions */}
                  {plan.instructions && (
                    <div>
                      <h4 className="text-sm font-medium text-stone-500 mb-2">
                        Instructions
                      </h4>
                      <div className="bg-card p-3 rounded-lg border border-border">
                        <p className="text-sm whitespace-pre-wrap">{plan.instructions}</p>
                      </div>
                    </div>
                  )}

                  {/* Cost Breakdown */}
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-stone-500">Items Total</span>
                      <span>{formatCurrency(plan.totalCost, plan.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-stone-500">Platform Fee</span>
                      <span>
                        {formatCurrency(plan.platformServiceFee, plan.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t border-border">
                      <span>Total</span>
                      <span className="text-highlight">
                        {formatCurrency(
                          plan.totalCost + plan.platformServiceFee,
                          plan.currency
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Escrow Status */}
                  {plan.escrow && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        <strong>Escrow Status:</strong> {plan.escrow.status}
                        {plan.status === 'IN_PROGRESS' && (
                          <span className="block mt-1 text-blue-600 dark:text-blue-400">
                            50% released when you started. Remaining 50% will be released upon
                            completion.
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BabalawoGuidancePlansView;

