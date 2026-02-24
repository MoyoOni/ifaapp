import React from 'react';
import { AlertCircle, Clock, BookOpen } from 'lucide-react';

interface GracePeriodBannerProps {
  gracePeriodStart: string;
  gracePeriodEnd: string;
  daysRemaining: number;
  isActive: boolean;
}

/**
 * Grace Period Banner Component
 * Displays warning and countdown for Personal Awo grace period
 * NOTE: 14-day grace period before switching Personal Awo
 */
const GracePeriodBanner: React.FC<GracePeriodBannerProps> = ({
  gracePeriodStart: _gracePeriodStart,
  gracePeriodEnd,
  daysRemaining,
  isActive,
}) => {
  if (!isActive) return null;

  const getUrgencyColor = () => {
    if (daysRemaining <= 3) return 'border-red-500/50 bg-red-500/10 text-red-300';
    if (daysRemaining <= 7) return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300';
    return 'border-blue-500/50 bg-blue-500/10 text-blue-300';
  };

  return (
    <div className={`border rounded-lg p-4 ${getUrgencyColor()}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium">Grace Period Active</p>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-bold">{daysRemaining} days remaining</span>
            </div>
          </div>
          <p className="text-sm opacity-90">
            You are in a 14-day grace period before your Personal Awo relationship change takes effect.
            This time is for reflection and ensuring your decision is thoughtful.
          </p>
          <div className="pt-2 border-t border-current/20">
            <div className="flex items-center gap-2 text-xs">
              <BookOpen className="w-3 h-3" />
              <span>
                Grace period ends: {new Date(gracePeriodEnd).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GracePeriodBanner;
