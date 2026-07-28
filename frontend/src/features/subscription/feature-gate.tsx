import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Crown } from 'lucide-react';
import { useSubscription } from './use-subscription';

interface UpgradePromptProps {
  message?: string;
}

// V8-202: gentle, not aggressive -- no countdown timers, no dark patterns.
export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  message = 'This is a Devoted-only feature.',
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center text-center gap-3 py-8 px-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
      <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
        <Lock size={20} className="text-amber-600 dark:text-amber-400" />
      </div>
      <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      <button
        type="button"
        onClick={() => navigate('/pricing')}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors"
      >
        <Crown size={16} />
        Become Devoted — ₦25,000 / 3 months
      </button>
    </div>
  );
};

interface FeatureGateProps {
  feature: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

// V8-202: consistent Devoted-tier gate wrapper. `feature` is descriptive
// only (for future analytics/logging), not used to look anything up --
// gating decisions live entirely in useSubscription()'s isDevoted/isFree.
export const FeatureGate: React.FC<FeatureGateProps> = ({ feature, fallback, children }) => {
  const { isDevoted, isLoading } = useSubscription();

  if (isLoading) return null;
  if (isDevoted) return <>{children}</>;
  return <>{fallback ?? <UpgradePrompt />}</>;
};
