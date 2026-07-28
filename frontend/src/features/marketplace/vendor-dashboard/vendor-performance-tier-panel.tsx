import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface PerformanceStatus {
  tier: 'NEW_VENDOR' | 'ESTABLISHED' | 'TRUSTED_VENDOR' | 'SACRED_ARTISAN';
  metrics: {
    salesCount: number;
    ratingAverage: number | null;
    returnRate: number;
    monthsSinceVerified: number;
  };
  nextTierProgress: { nextTier: string; gaps: string[] } | null;
  // VENDOR_BACKLOG.md VND-026 tier benefit: the real discount
  // walletService.releaseEscrow() applies when this vendor's order escrows
  // release, not an estimate.
  commission: { baseCommissionPct: number; commissionDiscountPct: number; effectiveCommissionPct: number };
}

interface VendorPerformanceTierPanelProps {
  vendorId: string;
  activeTab: string;
}

const TIER_CONFIG: Record<PerformanceStatus['tier'], { emoji: string; label: string; cls: string }> = {
  NEW_VENDOR: { emoji: '🌱', label: 'New Vendor', cls: 'text-green-600' },
  ESTABLISHED: { emoji: '⭐', label: 'Established', cls: 'text-blue-600' },
  TRUSTED_VENDOR: { emoji: '🌟', label: 'Trusted Vendor', cls: 'text-amber-600' },
  SACRED_ARTISAN: { emoji: '🔮', label: 'Sacred Artisan', cls: 'text-purple-600' },
};

const NEXT_TIER_LABEL: Record<string, string> = {
  ESTABLISHED: 'Established',
  TRUSTED_VENDOR: 'Trusted Vendor',
  SACRED_ARTISAN: 'Sacred Artisan',
};

// VENDOR_BACKLOG.md VND-026
const VendorPerformanceTierPanel: React.FC<VendorPerformanceTierPanelProps> = ({ vendorId, activeTab }) => {
  const isActive = activeTab === 'insights';

  const { data, isLoading } = useQuery<PerformanceStatus>({
    queryKey: ['vendor-performance-tier', vendorId],
    queryFn: async () => (await api.get(`/marketplace/vendors/${vendorId}/performance-tier`)).data,
    enabled: !!vendorId && isActive,
  });

  if (!isActive) return null;
  if (isLoading || !data) {
    return isLoading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : null;
  }

  const tier = TIER_CONFIG[data.tier];

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-foreground">Vendor Tier</h3>
        <span className={`text-lg font-bold ${tier.cls}`}>{tier.emoji} {tier.label}</span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Sales</p>
          <p className="font-bold text-foreground">{data.metrics.salesCount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Rating</p>
          <p className="font-bold text-foreground">{data.metrics.ratingAverage?.toFixed(1) ?? 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Return Rate</p>
          <p className="font-bold text-foreground">{(data.metrics.returnRate * 100).toFixed(1)}%</p>
        </div>
      </div>
      <div className="pt-3 border-t border-border flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">Your commission rate</p>
        <p className="text-sm font-bold text-foreground">
          {data.commission.effectiveCommissionPct}%
          {data.commission.commissionDiscountPct > 0 && (
            <span className="ml-1.5 text-xs font-medium text-green-600">
              ({data.commission.commissionDiscountPct}% off the standard {data.commission.baseCommissionPct}%)
            </span>
          )}
        </p>
      </div>
      {data.nextTierProgress && (
        <div className="pt-3 border-t border-border">
          <p className="text-sm text-muted-foreground">
            To reach <span className="font-bold text-foreground">{NEXT_TIER_LABEL[data.nextTierProgress.nextTier] ?? data.nextTierProgress.nextTier}</span>, you need: {data.nextTierProgress.gaps.join(', ')}.
          </p>
        </div>
      )}
      {!data.nextTierProgress && (
        <p className="text-sm font-bold text-purple-600 pt-3 border-t border-border">You've reached the top tier — Sacred Artisan.</p>
      )}
    </div>
  );
};

export default VendorPerformanceTierPanel;
