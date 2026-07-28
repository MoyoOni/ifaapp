import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Award, Loader2, Send } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';

interface CertificationApplication {
  id: string;
  requestedTier: string;
  documentation: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
  declineReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

interface CertificationStatus {
  currentTier: string;
  applications: CertificationApplication[];
}

interface VendorCertificationTabProps {
  vendorId: string;
  activeTab: string;
}

const TIER_INFO: Record<string, { label: string; description: string; icon: React.ReactNode; color: string }> = {
  COMMUNITY_LISTED: {
    label: 'Community Listed',
    description: 'Listed on the platform. No additional vetting -- you self-declare cultural authenticity.',
    icon: null,
    color: 'text-muted-foreground',
  },
  COMMUNITY_VERIFIED: {
    label: 'Community Verified',
    description: "You've provided documentation of sourcing/provenance and an admin has reviewed it.",
    icon: <ShieldCheck size={16} />,
    color: 'text-primary',
  },
  ELDER_ENDORSED: {
    label: 'Elder Endorsed',
    description: 'A verified elder has explicitly endorsed your products as culturally appropriate and correctly made -- the highest trust marker on the platform.',
    icon: <Award size={16} />,
    color: 'text-highlight',
  },
};

const NEXT_TIER: Record<string, string | null> = {
  COMMUNITY_LISTED: 'COMMUNITY_VERIFIED',
  COMMUNITY_VERIFIED: 'ELDER_ENDORSED',
  ELDER_ENDORSED: null,
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  DECLINED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

// VENDOR_BACKLOG.md VND-017
const VendorCertificationTab: React.FC<VendorCertificationTabProps> = ({ vendorId, activeTab }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const isActive = activeTab === 'certification';
  const [showForm, setShowForm] = useState(false);
  const [documentation, setDocumentation] = useState('');

  const { data, isLoading } = useQuery<CertificationStatus>({
    queryKey: ['vendor-certification', vendorId],
    queryFn: async () => (await api.get(`/marketplace/vendors/${vendorId}/certification`)).data,
    enabled: !!vendorId && isActive,
  });

  const nextTier = data ? NEXT_TIER[data.currentTier] : null;
  const hasPending = data?.applications.some((a) => a.status === 'PENDING');

  const applyMutation = useMutation({
    mutationFn: async () =>
      api.post(`/marketplace/vendors/${vendorId}/certification/apply`, {
        requestedTier: nextTier,
        documentation,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-certification', vendorId] });
      toast.success('Certification application submitted');
      setShowForm(false);
      setDocumentation('');
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.error?.userMessage || err?.response?.data?.message || 'Failed to submit application'),
  });

  if (!isActive) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Cultural Authenticity Certification</h2>
        <p className="text-muted-foreground">
          Give buyers confidence in what they're buying. Higher tiers carry a badge shown on all your products.
        </p>
      </div>

      {isLoading ? (
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      ) : data ? (
        <>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Current Tier</p>
            <div className={`flex items-center gap-2 text-lg font-bold ${TIER_INFO[data.currentTier]?.color ?? ''}`}>
              {TIER_INFO[data.currentTier]?.icon}
              {TIER_INFO[data.currentTier]?.label ?? data.currentTier}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{TIER_INFO[data.currentTier]?.description}</p>
          </div>

          {nextTier && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-bold text-foreground flex items-center gap-2">
                    {TIER_INFO[nextTier]?.icon}
                    Apply for {TIER_INFO[nextTier]?.label}
                  </p>
                  <p className="text-sm text-muted-foreground">{TIER_INFO[nextTier]?.description}</p>
                </div>
                {!showForm && !hasPending && (
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-highlight text-foreground rounded-xl text-sm font-bold hover:bg-secondary transition-colors"
                  >
                    Apply
                  </button>
                )}
              </div>

              {hasPending && (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  You have a pending application -- an admin will review it soon.
                </p>
              )}

              {showForm && !hasPending && (
                <div className="space-y-3">
                  <textarea
                    value={documentation}
                    onChange={(e) => setDocumentation(e.target.value)}
                    placeholder="Provenance statement, sourcing details, artisan lineage -- tell us how your products are made and where they come from."
                    rows={5}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-foreground text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 border border-border rounded-xl text-sm font-bold hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => applyMutation.mutate()}
                      disabled={applyMutation.isPending || documentation.trim().length < 20}
                      className="flex-1 py-2 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {applyMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      Submit Application
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {data.applications.length > 0 && (
            <div>
              <h3 className="font-bold text-foreground mb-2">Application History</h3>
              <div className="bg-card border border-border rounded-xl divide-y divide-border">
                {data.applications.map((a) => (
                  <div key={a.id} className="p-4 space-y-1">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <p className="font-bold text-foreground">
                        {TIER_INFO[a.requestedTier]?.label ?? a.requestedTier}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_STYLE[a.status]}`}>
                        {a.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Applied {new Date(a.createdAt).toLocaleDateString()}
                      {a.reviewedAt ? ` · Reviewed ${new Date(a.reviewedAt).toLocaleDateString()}` : ''}
                    </p>
                    {a.status === 'DECLINED' && a.declineReason && (
                      <p className="text-sm text-red-600 dark:text-red-400">Reason: {a.declineReason}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default VendorCertificationTab;
