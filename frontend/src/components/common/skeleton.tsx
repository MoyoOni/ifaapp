import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
  showAnimation?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  children, 
  showAnimation = true 
}) => {
  return (
    <div
      className={cn(
        'rounded-md bg-muted',
        showAnimation && 'animate-pulse',
        className
      )}
    >
      {children}
    </div>
  );
};

export { Skeleton };