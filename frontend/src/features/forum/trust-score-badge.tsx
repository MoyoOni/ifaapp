/**
 * Trust Score Badge Component (F9-901)
 * Displays practitioner trust score with tier and badge
 */

import { Badge } from '@/shared/components/ui/badge';

interface TrustScoreBadgeProps {
  trustScore?: number;
  tier?: string;
  badge?: string;
  compact?: boolean;
}

export const TrustScoreBadge = ({ trustScore = 0, tier = '', badge = '', compact = false }: TrustScoreBadgeProps) => {
  if (!tier || !badge) return null;

  const badgeColor =
    trustScore >= 75 ? 'bg-yellow-900/20 text-yellow-600' :
    trustScore >= 50 ? 'bg-emerald-900/20 text-emerald-600' :
    trustScore >= 30 ? 'bg-amber-900/20 text-amber-600' :
    'bg-gray-900/20 text-gray-400';

  if (compact) {
    return <span className="text-lg">{badge}</span>;
  }

  return (
    <Badge className={`${badgeColor} border-0`}>
      <span className="mr-1">{badge}</span>
      {tier}
      <span className="text-xs opacity-75 ml-1">({trustScore})</span>
    </Badge>
  );
};
