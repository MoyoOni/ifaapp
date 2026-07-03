import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface ProfileCompletenessProps {
  score: number; // 0-100
  role: string;
  onViewMissing?: () => void;
}

export const ProfileCompleteness: React.FC<ProfileCompletenessProps> = ({ score, role, onViewMissing }) => {
  // Color based on score
  let color = 'text-red-500';
  let bgColor = 'bg-red-50 dark:bg-red-950/30';
  let borderColor = 'border-red-200 dark:border-red-800';
  let textColor = 'text-red-700 dark:text-red-400';
  
  if (score >= 70) {
    color = 'text-green-500';
    bgColor = 'bg-green-50 dark:bg-green-950/30';
    borderColor = 'border-green-200 dark:border-green-800';
    textColor = 'text-green-700 dark:text-green-400';
  } else if (score >= 40) {
    color = 'text-amber-500';
    bgColor = 'bg-amber-50 dark:bg-amber-950/30';
    borderColor = 'border-amber-200 dark:border-amber-800';
    textColor = 'text-amber-700 dark:text-amber-400';
  }

  const getCompletionMessage = () => {
    if (score >= 90) return `Your ${role === 'BABALAWO' ? 'practice' : 'profile'} is nearly complete`;
    if (score >= 70) return `Your ${role === 'BABALAWO' ? 'practice' : 'profile'} is ${100 - score}% away from complete`;
    if (score >= 40) return `Complete ${100 - score} more % to unlock better visibility`;
    return `Complete your ${role === 'BABALAWO' ? 'practice' : 'profile'} to appear higher in search`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-5 border ${bgColor} ${borderColor} flex items-center gap-4`}
    >
      {/* Circular Progress */}
      <div className="flex-shrink-0 relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted dark:text-muted-foreground opacity-30" />
          <circle
            cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3"
            strokeDasharray={`${(score / 100) * 94} 94`}
            className={`${color} transition-all duration-500`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
          {Math.round(score)}%
        </span>
      </div>

      {/* Text */}
      <div className="flex-1">
        <p className={`text-sm font-bold ${textColor}`}>
          {getCompletionMessage()}
        </p>
        {onViewMissing && score < 100 && (
          <button
            type="button"
            onClick={onViewMissing}
            className={`text-xs font-semibold ${textColor} hover:underline mt-1 flex items-center gap-1`}
          >
            View missing items <ArrowRight size={12} />
          </button>
        )}
      </div>
    </motion.div>
  );
};
