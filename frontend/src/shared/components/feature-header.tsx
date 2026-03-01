import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { getFeatureColors } from '@/shared/config/feature-colors';

interface FeatureHeaderProps {
  feature: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
}

export const FeatureHeader: React.FC<FeatureHeaderProps> = ({
  feature,
  title,
  subtitle,
  icon: Icon,
  children,
}) => {
  const colors = getFeatureColors(feature);

  return (
    <div className={`${colors.gradient} rounded-2xl p-6 mb-6 border border-black/5`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`p-2 rounded-xl ${colors.iconBg}`}>
            <Icon size={24} />
          </div>
        )}
        <div>
          <h1 className={`text-2xl font-bold ${colors.textColor}`}>{title}</h1>
          {subtitle && (
            <p className={`text-sm ${colors.subtextColor}`}>{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};
