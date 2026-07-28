import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Inbox, Star } from 'lucide-react';
import api from '@/lib/api';
import { Skeleton } from '@/shared/components/ui';

interface QualityMetrics {
  openReviewItems: number;
  resolvedReviewItems: number;
  avgResolutionHours: number | null;
  slaThresholdHours: number;
  resolvedWithinSlaPercent: number | null;
  averagePractitionerRating: number | null;
  totalReviewsCounted: number;
}

// Was 100% hardcoded fake numbers (98.4% SLA compliance, 4.8/5.0 satisfaction,
// etc). Now computed from real Dispute/PractitionerComplaint/UserReport
// resolution timestamps and BabalawoReview ratings. The 48h "SLA" threshold
// is a reporting yardstick chosen for this view, not an existing documented
// policy -- labelled as such rather than implying an official commitment.
const QualityAssuranceView: React.FC = () => {
  const { data, isLoading } = useQuery<QualityMetrics>({
    queryKey: ['admin-quality-metrics'],
    queryFn: async () => (await api.get('/admin/quality-metrics')).data,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="bg-card rounded-2xl p-6 border border-border space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  // Static class strings, not interpolated -- Tailwind's JIT compiler can't
  // see dynamically-built class names like `bg-${color}/20`, so it never
  // generates the CSS for them and the color silently never applies.
  const stats = [
    {
      label: 'Avg. Resolution Time',
      value: data.avgResolutionHours !== null ? `${data.avgResolutionHours.toFixed(1)}h` : 'No data yet',
      sub: `Across disputes, complaints & user reports`,
      icon: Clock,
      iconClass: 'bg-highlight/20 text-highlight',
    },
    {
      label: `Resolved within ${data.slaThresholdHours}h`,
      value: data.resolvedWithinSlaPercent !== null ? `${data.resolvedWithinSlaPercent.toFixed(0)}%` : 'No data yet',
      sub: `${data.resolvedReviewItems} resolved total`,
      icon: CheckCircle,
      iconClass: 'bg-green-500/20 text-green-500',
    },
    {
      label: 'Avg. Practitioner Rating',
      value: data.averagePractitionerRating !== null ? `${data.averagePractitionerRating.toFixed(1)}/5.0` : 'No reviews yet',
      sub: `${data.totalReviewsCounted} reviews`,
      icon: Star,
      iconClass: 'bg-blue-500/20 text-blue-500',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-card rounded-2xl p-6 border border-border shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${item.iconClass}`}>
                <item.icon size={24} />
              </div>
            </div>
            <h3 className="text-muted-foreground font-bold text-sm uppercase tracking-widest">{item.label}</h3>
            <p className="text-3xl font-bold text-foreground mt-1">{item.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{item.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-card rounded-2xl p-6 border border-border flex items-center gap-4">
        <div className="p-3 bg-highlight/20 rounded-xl text-highlight">
          <Inbox size={24} />
        </div>
        <div>
          <h3 className="text-muted-foreground font-bold text-sm uppercase tracking-widest">Open Review Queue</h3>
          <p className="text-2xl font-bold text-foreground">{data.openReviewItems} awaiting resolution</p>
        </div>
      </div>
    </div>
  );
};

export default QualityAssuranceView;
