import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lightbulb, Star, Truck, RotateCcw, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface Insight {
  productId: string;
  productName: string;
  type: 'NO_REVIEWS' | 'RESTOCK' | 'STALE' | 'BUNDLE_SUGGESTION';
  message: string;
}

interface VendorInsights {
  insights: Insight[];
  scorecard: {
    avgDaysToShip: number | null;
    ratingAverage: number | null;
    returnRate: number;
    overall: 'TOP_VENDOR' | 'GOOD_STANDING' | 'NEEDS_ATTENTION' | 'AT_RISK';
  };
}

interface VendorInsightsPanelProps {
  vendorId: string;
  activeTab: string;
}

const OVERALL_CONFIG: Record<VendorInsights['scorecard']['overall'], { label: string; emoji: string; cls: string }> = {
  TOP_VENDOR: { label: 'Top Vendor', emoji: '🌟', cls: 'text-amber-600' },
  GOOD_STANDING: { label: 'Good Standing', emoji: '✅', cls: 'text-green-600' },
  NEEDS_ATTENTION: { label: 'Needs Attention', emoji: '⚠️', cls: 'text-orange-600' },
  AT_RISK: { label: 'At Risk', emoji: '🔴', cls: 'text-red-600' },
};

const INSIGHT_ICON: Record<Insight['type'], React.ReactNode> = {
  NO_REVIEWS: <Star size={16} className="text-amber-600" />,
  RESTOCK: <Truck size={16} className="text-blue-600" />,
  STALE: <RotateCcw size={16} className="text-orange-600" />,
  BUNDLE_SUGGESTION: <Lightbulb size={16} className="text-purple-600" />,
};

// VENDOR_BACKLOG.md VND-014
const VendorInsightsPanel: React.FC<VendorInsightsPanelProps> = ({ vendorId, activeTab }) => {
  const isActive = activeTab === 'insights';

  const { data, isLoading } = useQuery<VendorInsights>({
    queryKey: ['vendor-insights', vendorId],
    queryFn: async () => (await api.get(`/marketplace/vendors/${vendorId}/insights`)).data,
    enabled: !!vendorId && isActive,
  });

  if (!isActive) return null;

  const overall = data ? OVERALL_CONFIG[data.scorecard.overall] : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Insights & Scorecard</h2>
        <p className="text-muted-foreground">What to do to sell more, and how your store is doing</p>
      </div>

      {isLoading || !data ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Scorecard */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-bold text-foreground">Monthly Scorecard</h3>
              {overall && (
                <span className={`text-lg font-bold ${overall.cls}`}>{overall.emoji} {overall.label}</span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Avg. Days to Ship</p>
                <p className="text-xl font-bold text-foreground">
                  {data.scorecard.avgDaysToShip !== null ? data.scorecard.avgDaysToShip.toFixed(1) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Rating Average</p>
                <p className="text-xl font-bold text-foreground">
                  {data.scorecard.ratingAverage !== null ? `${data.scorecard.ratingAverage.toFixed(1)}★` : 'No reviews yet'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Return Rate</p>
                <p className="text-xl font-bold text-foreground">{(data.scorecard.returnRate * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {data.insights.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-50" />
                No suggestions right now — your listings look healthy.
              </div>
            ) : (
              data.insights.map((insight, i) => (
                <div key={`${insight.productId}-${insight.type}-${i}`} className="p-4 flex items-start gap-3">
                  <div className="mt-0.5">{INSIGHT_ICON[insight.type]}</div>
                  <p className="text-sm text-foreground">{insight.message}</p>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VendorInsightsPanel;
