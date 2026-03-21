import React from 'react';
import { Shield, Award, Crown } from 'lucide-react';
import { VerificationTier } from '@common';

interface VerificationBadgeProps {
  verified: boolean;
  tier?: VerificationTier | null;
  stage?: string;
  className?: string;
}

/**
 * Verification Badge Component
 * Displays verification status and tier for Babalawos
 * NOTE: Culturally significant - shows tier (JUNIOR, SENIOR, MASTER)
 */
const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  verified,
  tier,
  stage: _stage,
  className = '',
}) => {
  if (!verified) {
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-muted/60 text-muted-foreground ${className}`}>
        <Shield size={14} />
        Unverified
      </span>
    );
  }

  const tierConfig = {
    [VerificationTier.JUNIOR]: {
      icon: Shield,
      label: 'Junior Babalawo',
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    [VerificationTier.SENIOR]: {
      icon: Award,
      label: 'Senior Babalawo',
      color: 'bg-highlight text-white',
      iconColor: 'text-white',
    },
    [VerificationTier.MASTER]: {
      icon: Crown,
      label: 'Master Babalawo',
      color: 'bg-primary text-white',
      iconColor: 'text-white',
    },
  };

  const config = tier ? tierConfig[tier] : {
    icon: Shield,
    label: 'Verified',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    iconColor: 'text-green-600 dark:text-green-400',
  };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${config.color} ${className}`}>
      <Icon size={14} className={config.iconColor} />
      {config.label}
    </span>
  );
};

export default VerificationBadge;
