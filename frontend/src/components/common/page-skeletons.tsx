import React from 'react';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

interface PageSkeletonProps {
  type: 'dashboard' | 'profile' | 'listing' | 'detail' | 'form';
  className?: string;
}

const PageSkeleton: React.FC<PageSkeletonProps> = ({ type, className }) => {
  switch (type) {
    case 'dashboard':
      return (
        <div className={cn('p-6 space-y-6', className)}>
          <Skeleton className="h-10 w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      );
      
    case 'profile':
      return (
        <div className={cn('p-6 space-y-6', className)}>
          <div className="flex items-start gap-6">
            <Skeleton className="w-24 h-24 rounded-full" />
            <div className="space-y-3 flex-1">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
      );
      
    case 'listing':
      return (
        <div className={cn('p-6 space-y-6', className)}>
          <Skeleton className="h-10 w-1/3" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      );
      
    case 'detail':
      return (
        <div className={cn('p-6 space-y-6', className)}>
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-48 md:col-span-2" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      );
      
    case 'form':
      return (
        <div className={cn('p-6 space-y-6', className)}>
          <Skeleton className="h-10 w-1/3" />
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-12 w-32" />
        </div>
      );
      
    default:
      return (
        <div className={cn('p-6 space-y-6', className)}>
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-96 w-full" />
        </div>
      );
  }
};

export { PageSkeleton };