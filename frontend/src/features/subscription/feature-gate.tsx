import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Sparkles } from 'lucide-react';
import { useSubscription } from './use-subscription';

// ─── UpgradePrompt ───────────────────────────────────────────────────────────

interface UpgradePromptProps {
  message?: string;
  compact?: boolean; // inline/small variant
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  message = 'This feature is available to Devoted members.',
  compact = false,
}) => {
  const navigate = useNavigate();

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => navigate('/pricing')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-full hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
      >
        <Lock size={10} /> Devoted only
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
      <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mb-4">
        <Lock size={22} className="text-amber-600 dark:text-amber-400" />
      </div>
      <p className="text-sm text-amber-800 dark:text-amber-300 mb-4 max-w-xs leading-relaxed">
        {message}
      </p>
      <button
        type="button"
        onClick={() => navigate('/pricing')}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors"
      >
        <Sparkles size={14} /> Become Devoted <ArrowRight size={14} />
      </button>
      <p className="text-xs text-amber-600 dark:text-amber-500 mt-3">
        ₦25,000 / 3 months · ₦100,000 / year
      </p>
    </div>
  );
};

// ─── FeatureGate ─────────────────────────────────────────────────────────────

interface FeatureGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  message?: string;
  compact?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  children,
  fallback,
  message,
  compact = false,
}) => {
  const { isDevoted, isLoading } = useSubscription();

  // While loading: show children (fail open — never flash a lock to Devoted users)
  if (isLoading) return <>{children}</>;

  if (isDevoted) return <>{children}</>;

  return (
    <>
      {fallback ?? <UpgradePrompt message={message} compact={compact} />}
    </>
  );
};

export default FeatureGate;
