import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Loader2, AlertCircle, Clock, Package, Square, CheckSquare } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { DEMO_GUIDANCE_PLANS, getDemoAppointmentById, getDemoUserById } from '@/demo';

interface GuidancePlanItem {
  name: string;
  quantity: number;
  description?: string;
  cost: number;
  completed?: boolean;
  completedAt?: string;
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
  escrow?: {
    id: string;
    status: string;
    amount: number;
  };
  createdAt: string;
}

interface GuidancePlanApprovalViewProps {
  guidancePlanId: string;
  onApproved?: () => void;
  onRejected?: () => void;
}

/**
 * Guidance Plan Approval View (Client)
 * Shows guidance plan details and allows approval/rejection
 * NOTE: Platform service fee is clearly displayed (NOT a commission on sacred items)
 */
const GuidancePlanApprovalView: React.FC<GuidancePlanApprovalViewProps> = ({
  guidancePlanId,
  onApproved,
  onRejected,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rejectionNotes, setRejectionNotes] = useState('');

  const buildDemoPlan = (planId: string): GuidancePlan | null => {
    const demoPlan = DEMO_GUIDANCE_PLANS[planId as keyof typeof DEMO_GUIDANCE_PLANS];
    if (!demoPlan) {
      return null;
    }
    const appointment = getDemoAppointmentById(demoPlan.appointmentId);
    const babalawo = getDemoUserById(demoPlan.babalawoId);
    const steps = demoPlan.steps || [];
    const items: GuidancePlanItem[] = steps.length > 0
      ? steps.map((step: string, index: number) => ({
          name: step,
          quantity: 1,
          description: `Step ${index + 1}`,
          cost: Math.max(1, Math.floor(demoPlan.totalCost / steps.length)),
        }))
      : [{
          name: 'Guidance Materials',
          quantity: 1,
          description: 'Demo item',
          cost: demoPlan.totalCost,
        }];

    return {
      id: demoPlan.id,
      type: demoPlan.type,
      items,
      totalCost: demoPlan.totalCost,
      platformServiceFee: 0,
      currency: 'NGN',
      instructions: steps.join('\n'),
      status: demoPlan.status,
      appointment: {
        id: demoPlan.appointmentId,
        date: appointment?.date || '2026-02-10',
        time: appointment?.time || '10:00',
      },
      babalawo: {
        id: demoPlan.babalawoId,
        name: babalawo?.name || 'Babalawo',
        yorubaName: babalawo?.yorubaName,
      },
      createdAt: demoPlan.createdAt,
    };
  };

  const getSessionPlan = (planId: string): GuidancePlan | null => {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }
    const cached = sessionStorage.getItem(`demo-guidance-plan:${planId}`);
    if (!cached) {
      return null;
    }
    try {
      return JSON.parse(cached) as GuidancePlan;
    } catch (error) {
      logger.warn('Failed to parse demo guidance plan from session', error);
      return null;
    }
  };

  const persistSessionPlan = (plan: GuidancePlan) => {
    if (typeof sessionStorage === 'undefined') {
      return;
    }
    sessionStorage.setItem(`demo-guidance-plan:${plan.id}`, JSON.stringify(plan));
  };

  // Fetch guidance plan
  const { data: guidancePlan, isLoading } = useQuery<GuidancePlan | null>({
    queryKey: ['guidance-plan', guidancePlanId],
    queryFn: async () => {
      try {
        const response = await api.get(`/guidance-plans/${guidancePlanId}`);
        return response.data;
      } catch (error) {
        if (!isDemoMode) throw error;

        logger.warn('Failed to fetch guidance plan, using demo data');
        return getSessionPlan(guidancePlanId) || buildDemoPlan(guidancePlanId);
      }
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (approve: boolean) => {
      try {
        const response = await api.post(`/guidance-plans/${guidancePlanId}/approve/${user?.id}`, {
          approve,
          notes: approve ? undefined : rejectionNotes,
        });
        return response.data;
      } catch (error) {
        if (!guidancePlan) {
          throw error;
        }
        const updatedPlan: GuidancePlan = {
          ...guidancePlan,
          status: approve ? 'APPROVED' : 'CANCELLED',
        };
        persistSessionPlan(updatedPlan);
        return updatedPlan;
      }
    },
    onSuccess: (data, approve) => {
      if (data) {
        queryClient.setQueryData(['guidance-plan', guidancePlanId], data);
      }
      queryClient.invalidateQueries({ queryKey: ['guidance-plan', guidancePlanId] });
      queryClient.invalidateQueries({ queryKey: ['guidance-plans', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance', user?.id] });

      if (approve) {
        onApproved?.();
      } else {
        onRejected?.();
      }
    },
  });

  // Item completion mutation
  const itemCompletionMutation = useMutation({
    mutationFn: async ({ itemIndex, completed }: { itemIndex: number; completed: boolean }) => {
      try {
        const response = await api.patch(`/guidance-plans/${guidancePlanId}/items/${itemIndex}`, {
          completed,
        });
        return response.data;
      } catch (error) {
        const cachedPlan = queryClient.getQueryData<GuidancePlan | null>(['guidance-plan', guidancePlanId]);
        if (!cachedPlan) {
          throw error;
        }
        const updatedItems = cachedPlan.items.map((item, index) => (
          index === itemIndex ? { ...item, completed } : item
        ));
        const updatedPlan: GuidancePlan = {
          ...cachedPlan,
          items: updatedItems,
        };
        persistSessionPlan(updatedPlan);
        return updatedPlan;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guidance-plan', guidancePlanId] });
    },
  });

  const handleToggleItemCompletion = (index: number, currentCompleted: boolean) => {
    itemCompletionMutation.mutate({ itemIndex: index, completed: !currentCompleted });
  };

  // Calculate completion progress
  const completedItems = guidancePlan?.items.filter((item) => item.completed).length || 0;
  const totalItems = guidancePlan?.items.length || 0;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const canTrackCompletion = guidancePlan?.status === 'IN_PROGRESS' || guidancePlan?.status === 'COMPLETED';

  const handleApprove = () => {
    approveMutation.mutate(true);
  };

  const handleReject = () => {
    if (!rejectionNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    approveMutation.mutate(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-highlight" />
      </div>
    );
  }

  if (!guidancePlan) {
    return (
      <div className="text-center p-8">
        <p className="text-muted">Guidance plan not found</p>
        {onRejected && (
          <button
            type="button"
            onClick={onRejected}
            className="mt-4 px-4 py-2 bg-white/10 text-highlight rounded-lg hover:bg-white/20 transition-colors"
          >
            Back to History
          </button>
        )}
      </div>
    );
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: { icon: Clock, color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
      APPROVED: { icon: CheckCircle, color: 'text-green-400 bg-green-400/10 border-green-400/30' },
      IN_PROGRESS: { icon: Package, color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
      COMPLETED: { icon: CheckCircle, color: 'text-green-400 bg-green-400/10 border-green-400/30' },
      CANCELLED: { icon: XCircle, color: 'text-red-400 bg-red-400/10 border-red-400/30' },
    };

    const badge = badges[status as keyof typeof badges] || badges.PENDING;
    const Icon = badge.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${badge.color}`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{status.replace('_', ' ')}</span>
      </div>
    );
  };

  return (
    <div className="bg-background border border-white/10 rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-highlight">Guidance Plan Review</h2>
          <p className="text-sm text-muted mt-1">
            From {guidancePlan.babalawo.yorubaName || guidancePlan.babalawo.name}
          </p>
        </div>
        {getStatusBadge(guidancePlan.status)}
      </div>

      {/* Cultural Disclaimer */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-yellow-400">Sacred Guidance Plan</p>
            <p className="text-sm text-muted">
              Akose/Ebo are sacred guidance plans—not products. They are spiritual remedies
              prescribed after divination and should be treated with respect and reverence.
            </p>
          </div>
        </div>
      </div>

      {/* Appointment Info */}
      <div className="bg-white/5 rounded-lg p-4">
        <p className="text-sm text-muted mb-1">From Divination Session</p>
        <p className="font-medium">
          {new Date(guidancePlan.appointment.date).toLocaleDateString()} at{' '}
          {guidancePlan.appointment.time}
        </p>
      </div>

      {/* Guidance Plan Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Guidance Plan Items</h3>
          {canTrackCompletion && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted">{completedItems}/{totalItems} completed</span>
              <span className="text-highlight font-medium">{progressPercent}%</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {canTrackCompletion && (
          <div className="mb-4 bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="bg-highlight h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        <div className="space-y-3">
          {guidancePlan.items.map((item, index) => (
            <div
              key={index}
              className={`bg-white/5 rounded-lg p-4 border transition-colors ${
                item.completed ? 'border-green-500/30 bg-green-500/5' : 'border-white/10'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Completion checkbox - only show when tracking is enabled */}
                {canTrackCompletion && (
                  <button
                    type="button"
                    onClick={() => handleToggleItemCompletion(index, !!item.completed)}
                    disabled={itemCompletionMutation.isPending}
                    className="mt-1 flex-shrink-0 text-muted hover:text-highlight transition-colors disabled:opacity-50"
                  >
                    {item.completed ? (
                      <CheckSquare className="w-5 h-5 text-green-400" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`font-medium ${item.completed ? 'line-through text-muted' : ''}`}>
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="text-sm text-muted mt-1">{item.description}</p>
                      )}
                      {item.completed && item.completedAt && (
                        <p className="text-xs text-green-400 mt-1">
                          Completed {new Date(item.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-medium">
                        {formatCurrency(item.cost * item.quantity, guidancePlan.currency)}
                      </p>
                      <p className="text-xs text-muted">
                        {item.quantity} × {formatCurrency(item.cost, guidancePlan.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cost Breakdown */}
        <div className="mt-4 space-y-2">
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted">Items Subtotal:</span>
              <span className="font-medium">
                {formatCurrency(guidancePlan.totalCost, guidancePlan.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-muted">Platform Service Fee:</span>
                <p className="text-xs text-muted mt-0.5">
                  (Fixed fee - not a commission on sacred items)
                </p>
              </div>
              <span className="font-medium">
                {formatCurrency(guidancePlan.platformServiceFee, guidancePlan.currency)}
              </span>
            </div>
          </div>

          <div className="p-4 bg-highlight/10 border border-highlight/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Amount:</span>
              <span className="text-2xl font-bold text-highlight">
                {formatCurrency(guidancePlan.totalCost + guidancePlan.platformServiceFee, guidancePlan.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {guidancePlan.instructions && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Instructions</h3>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <p className="text-sm whitespace-pre-wrap">{guidancePlan.instructions}</p>
          </div>
        </div>
      )}

      {/* Escrow Info */}
      {guidancePlan.escrow && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            Payment held in escrow. Funds will be released in two tiers:
          </p>
          <ul className="text-sm text-blue-300/80 mt-2 space-y-1 list-disc list-inside">
            <li>50% when work begins</li>
            <li>50% when guidance plan is completed</li>
          </ul>
        </div>
      )}

      {/* Approval Actions (only if PENDING) */}
      {guidancePlan.status === 'PENDING' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Rejection Reason (if rejecting)
            </label>
            <textarea
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-highlight"
              placeholder="Optional: Provide a reason for rejection..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={approveMutation.isPending}
              className="flex-1 px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  Reject
                </>
              )}
            </button>
            <button
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              className="flex-1 px-6 py-3 bg-highlight text-white rounded-lg font-medium hover:bg-highlight/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Approve & Pay
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {guidancePlan.status === 'APPROVED' && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <p className="text-green-300">
            ✓ Guidance plan approved. Payment held in escrow. Your Babalawo will begin work soon.
          </p>
        </div>
      )}

      {guidancePlan.status === 'IN_PROGRESS' && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-blue-300">
            ⏳ Guidance plan work in progress. 50% payment released to Babalawo.
          </p>
        </div>
      )}

      {guidancePlan.status === 'COMPLETED' && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <p className="text-green-300">
            ✓ Guidance plan completed. Full payment released to Babalawo.
          </p>
        </div>
      )}

      {guidancePlan.status === 'CANCELLED' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-300">✗ Guidance plan was cancelled.</p>
        </div>
      )}
    </div>
  );
};

export default GuidancePlanApprovalView;
