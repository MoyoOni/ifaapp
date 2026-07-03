import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | number;
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'highlight';
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

const variantClasses = {
  default: 'text-foreground',
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  highlight: 'text-highlight',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className = '',
  label = 'Loading...',
}) => {
  const sizeClass = typeof size === 'string' ? sizeClasses[size] : `w-${size} h-${size}`;
  const variantClass = variantClasses[variant];

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <Loader2 
        className={`animate-spin ${sizeClass} ${variantClass} ${className}`}
        aria-label={label}
      />
      {label && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
    </div>
  );
};

export default LoadingSpinner;