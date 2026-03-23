import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Crown, Sparkles, AlertCircle, CheckCircle, Calendar, Clock, CreditCard, PauseCircle, XCircle, ArrowLeft, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { useSubscription } from '@/features/subscription/use-subscription';

interface BillingRecord {
  id: string;
  plan: 'QUARTERLY' | 'ANNUAL';
  status: string;
  startDate: string;
  endDate: string;
  paystackRef?: string;
  createdAt: string;
}

const planLabel = (plan: string) => plan === 'ANNUAL' ? 'Annual' : 'Quarterly';
const planAmount = (plan: string) => plan === 'ANNUAL' ? '₦100,000' : '₦25,000';

const SubscriptionManagePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isDevoted, isFree, plan, endDate, daysRemaining, status, autoRenew } = useSubscription();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [pauseUsed, setPauseUsed] = useState(false);

  const { data: history = [], isLoading: historyLoading } = useQuery<BillingRecord[]>({
    queryKey: ['subscription-history', user?.id],
    queryFn: () => api.get('/subscriptions/history').then(r => r.data),
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.post('/subscriptions/cancel'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-history'] });
      setShowCancelModal(false);
    },
  });

  const pauseMutation = useMutation({
    mutationFn: () => api.post('/subscriptions/pause'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      setPauseUsed(true);
      setShowCancelModal(false);
    },
  });

  const formattedEnd = endDate
    ? new Date(endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Crown size={22} className="text-amber-500" /> Subscription
            </h1>
            <p className="text-sm text-muted-foreground">Manage your Devoted membership</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* ── Current Plan ── */}
          {isDevoted ? (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-amber-800 dark:text-amber-300 text-lg">Devoted · {planLabel(plan || '')}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 capitalize">{status?.toLowerCase()}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold uppercase tracking-wide">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-white/60 dark:bg-black/20 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-amber-600 dark:text-amber-500 font-medium mb-1">Access until</p>
                  <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">{formattedEnd ?? '—'}</p>
                </div>
                <div className="bg-white/60 dark:bg-black/20 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-amber-600 dark:text-amber-500 font-medium mb-1">Days left</p>
                  <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">{daysRemaining ?? '—'}</p>
                </div>
                <div className="bg-white/60 dark:bg-black/20 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-amber-600 dark:text-amber-500 font-medium mb-1">Auto-renew</p>
                  <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">{autoRenew ? 'On' : 'Off'}</p>
                </div>
              </div>

              {!autoRenew && (
                <div className="flex items-center gap-2 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl mb-4 text-sm">
                  <AlertCircle size={14} className="text-amber-700 dark:text-amber-400 flex-shrink-0" />
                  <p className="text-amber-800 dark:text-amber-300">Auto-renewal is off. Your plan will end on {formattedEnd}.</p>
                </div>
              )}

              <div className="flex gap-3">
                {autoRenew && (
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    <XCircle size={15} /> Cancel Plan
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/pricing')}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
                >
                  <Calendar size={15} /> Change Plan
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <Crown size={40} className="mx-auto text-muted-foreground mb-3" />
              <p className="font-bold text-foreground mb-2">No active subscription</p>
              <p className="text-sm text-muted-foreground mb-5">You are on the free Seeker plan.</p>
              <button
                type="button"
                onClick={() => navigate('/pricing')}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors flex items-center gap-2 mx-auto"
              >
                <Sparkles size={16} /> Become Devoted
              </button>
            </div>
          )}

          {/* ── Billing History ── */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-primary" /> Billing History
            </h2>

            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-muted-foreground" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8">
                <Clock size={32} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No billing records yet.</p>
              </div>
            ) : (
              <div className="space-y-0 divide-y divide-border">
                {history.map((record) => (
                  <div key={record.id} className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        Devoted {planLabel(record.plan)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(record.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {record.paystackRef && ` · Ref: ${record.paystackRef}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{planAmount(record.plan)}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
                        <CheckCircle size={10} /> Paid
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Cancel / Pause Modal ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-foreground mb-2">Before you go…</h2>
            <p className="text-sm text-muted-foreground mb-6">
              You can <strong>pause for 1 month</strong> instead — no charge, Devoted access continues, auto-renewal resumes after.
            </p>

            {pauseUsed ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl mb-4 text-sm text-amber-800 dark:text-amber-300">
                You've already used your pause for this period.
              </div>
            ) : (
              <button
                type="button"
                onClick={() => pauseMutation.mutate()}
                disabled={pauseMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 mb-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors disabled:opacity-50"
              >
                {pauseMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <PauseCircle size={16} />}
                Pause for 1 month — stay Devoted
              </button>
            )}

            <button
              type="button"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 mb-3 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50"
            >
              {cancelMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
              Cancel Anyway — access until {formattedEnd}
            </button>

            {cancelMutation.isSuccess && (
              <p className="text-sm text-center text-muted-foreground mt-2">
                Plan cancelled. You keep Devoted access until {formattedEnd}. No refund issued for unused time.
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowCancelModal(false)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors mt-2"
            >
              Never mind, keep my plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagePage;
