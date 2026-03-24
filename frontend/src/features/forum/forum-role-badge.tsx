import React from 'react';
import { Crown } from 'lucide-react';

interface ForumRoleBadgeProps {
  role?: string | null;
  verified?: boolean;
  subscriptionStatus?: string | null;
  culturalLevel?: string | null;
  isCommunityBuilder?: boolean;
}

/**
 * Displays a single cultural/role badge for a forum author.
 * Priority: Verified Babalawo > Moderator/Admin > Babalawo > Community Builder > Devoted > Cultural Level
 */
const ForumRoleBadge: React.FC<ForumRoleBadgeProps> = ({
  role,
  verified,
  subscriptionStatus,
  culturalLevel,
  isCommunityBuilder,
}) => {
  if (role === 'BABALAWO' && verified) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500 text-white whitespace-nowrap">
        ✓ Verified Babaláwo
      </span>
    );
  }

  if (role === 'ADMIN') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white whitespace-nowrap">
        Moderator
      </span>
    );
  }

  if (role === 'BABALAWO') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border border-stone-400 text-stone-600 dark:text-stone-300 whitespace-nowrap">
        Babaláwo
      </span>
    );
  }

  // F9-703: Community Builder badge — between Devoted and cultural level in priority
  if (isCommunityBuilder) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border border-teal-400 text-teal-600 dark:text-teal-400 whitespace-nowrap">
        🏗️ Community Builder
      </span>
    );
  }

  if (subscriptionStatus === 'DEVOTED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border border-amber-400 text-amber-600 dark:text-amber-400 whitespace-nowrap">
        <Crown size={10} />
        Devoted
      </span>
    );
  }

  if (culturalLevel && culturalLevel !== 'Omo Ilé') {
    const isTopLevel = culturalLevel === 'Omo Awo';
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${
          isTopLevel
            ? 'border-purple-400 text-purple-600 dark:text-purple-400'
            : 'border-stone-300 text-stone-500 dark:text-stone-400'
        }`}
      >
        {culturalLevel}
      </span>
    );
  }

  return null;
};

export default ForumRoleBadge;
