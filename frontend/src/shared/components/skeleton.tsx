import React from 'react';

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', children }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted min-h-4 ${className}`}
    >
      {children}
    </div>
  );
};

export const SkeletonCircle: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div 
      className={`animate-pulse rounded-full bg-muted ${className}`}
    />
  );
};

const SKELETON_TEXT_WIDTHS = ['w-3/4', 'w-4/5', 'w-2/3', 'w-5/6', 'w-3/5'] as const;

export const SkeletonText: React.FC<SkeletonTextProps> = ({ lines = 1, className = '' }) => {
  const textLines = Array.from({ length: lines }).map((_, idx) => (
    <div
      key={idx}
      className={`animate-pulse rounded-md bg-muted h-4 mb-2 last:mb-0 ${SKELETON_TEXT_WIDTHS[idx % SKELETON_TEXT_WIDTHS.length]} ${className}`}
    />
  ));

  return <div>{textLines}</div>;
};

// Skeleton page layouts for common pages
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="bg-card p-6 rounded-xl shadow-sm">
            <Skeleton className="h-6 w-24 mb-4" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card p-6 rounded-xl shadow-sm">
          <Skeleton className="h-6 w-40 mb-6" />
          <div className="space-y-4">
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className="flex items-center space-x-4">
                <SkeletonCircle className="h-10 w-10" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-xl shadow-sm">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="p-4 bg-muted rounded-lg">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <div className="bg-card rounded-2xl p-6 shadow-sm text-center">
            <SkeletonCircle className="h-24 w-24 mx-auto mb-4" />
            <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
            <Skeleton className="h-4 w-1/2 mx-auto mb-4" />
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        
        <div className="md:w-2/3 space-y-6">
          <div className="bg-card rounded-2xl p-6 shadow-sm">
            <Skeleton className="h-6 w-40 mb-4" />
            <SkeletonText lines={3} />
          </div>
          
          <div className="bg-card rounded-2xl p-6 shadow-sm">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="text-center">
                  <Skeleton className="h-8 w-16 mx-auto mb-2" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-card rounded-2xl p-6 shadow-sm">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-4">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <SkeletonCircle className="h-10 w-10" />
                    <div>
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24 mt-1" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TempleDirectorySkeleton: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-48 mt-2" />
        </div>
        <Skeleton className="h-12 w-40" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, idx) => (
          <div key={idx} className="bg-card rounded-2xl overflow-hidden shadow-sm">
            <Skeleton className="h-48 w-full" />
            <div className="p-6">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <SkeletonText lines={2} className="mb-4" />
              <div className="flex justify-between">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const BabalawoDirectorySkeleton: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-48 mt-2" />
        </div>
        <Skeleton className="h-12 w-40" />
      </div>
      
      <div className="space-y-6">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="bg-card rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row">
            <SkeletonCircle className="h-20 w-20 mb-4 sm:mb-0" />
            <div className="sm:ml-6 flex-1">
              <div className="flex flex-wrap justify-between">
                <Skeleton className="h-6 w-48 mb-2" />
                <div className="flex items-center">
                  <Skeleton className="h-4 w-12 mr-2" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <SkeletonText lines={2} className="my-3" />
              <div className="flex flex-wrap gap-2">
                {[...Array(3)].map((_, idx) => (
                  <Skeleton key={idx} className="h-6 w-16" />
                ))}
              </div>
            </div>
            <div className="mt-4 sm:mt-0">
              <Skeleton className="h-10 w-full sm:w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MarketplaceSkeleton: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-48 mt-2" />
        </div>
        <Skeleton className="h-12 w-40" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, idx) => (
          <div key={idx} className="bg-card rounded-2xl overflow-hidden shadow-sm">
            <Skeleton className="h-48 w-full" />
            <div className="p-4">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-3" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MessagesSkeleton: React.FC = () => {
  return (
    <div className="flex h-[calc(100vh-120px)]">
      <div className="w-1/3 border-r border-border">
        <div className="p-4">
          <Skeleton className="h-10 w-full mb-4" />
        </div>
        <div className="space-y-2 px-2">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="flex items-center p-3 rounded-lg hover:bg-muted cursor-pointer">
              <SkeletonCircle className="h-12 w-12 mr-3" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="border-b border-border p-4">
          <Skeleton className="h-6 w-1/2" />
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className={`flex ${idx % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className={`${idx % 2 === 0 ? 'bg-muted' : 'bg-primary text-primary-foreground'} rounded-2xl p-4 max-w-xs`}>
                  <SkeletonText lines={1 + (idx % 3)} />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="border-t border-border p-4">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
};

// Additional skeleton layouts for other pages
export const TempleDetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <Skeleton className="h-8 w-1/3 mb-6" />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-96 w-full rounded-2xl" />
          
          <div className="bg-card p-6 rounded-2xl">
            <Skeleton className="h-6 w-1/4 mb-4" />
            <SkeletonText lines={6} />
          </div>
          
          <div className="bg-card p-6 rounded-2xl">
            <Skeleton className="h-6 w-1/4 mb-4" />
            <div className="space-y-4">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <SkeletonCircle className="h-12 w-12" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-1/4 mb-2" />
                    <SkeletonText lines={2} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-2xl">
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-10 w-full" />
          </div>
          
          <div className="bg-card p-6 rounded-2xl">
            <Skeleton className="h-6 w-1/2 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AcademySkeleton: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-48 mt-2" />
        </div>
        <Skeleton className="h-12 w-40" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[...Array(8)].map((_, idx) => (
          <div key={idx} className="bg-card p-4 rounded-xl">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, idx) => (
          <div key={idx} className="bg-card rounded-2xl overflow-hidden">
            <Skeleton className="h-40 w-full" />
            <div className="p-4">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-3" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AdminDashboardSkeleton: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-48" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(8)].map((_, idx) => (
          <div key={idx} className="bg-card p-6 rounded-xl">
            <Skeleton className="h-4 w-3/4 mb-3" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-xl">
          <Skeleton className="h-6 w-1/3 mb-6" />
          <div className="space-y-4">
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <SkeletonCircle className="h-10 w-10" />
                  <div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-xl">
          <Skeleton className="h-6 w-1/3 mb-6" />
          <div className="space-y-4">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="p-4 bg-muted rounded-lg">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/** Reusable card skeleton for list items */
export const SkeletonCard: React.FC = () => (
  <div className="animate-pulse bg-muted rounded-xl p-4 space-y-3">
    <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
    <div className="h-3 bg-muted-foreground/20 rounded w-1/2" />
    <div className="h-3 bg-muted-foreground/20 rounded w-2/3" />
  </div>
);

/** Reusable stat card skeleton */
export const SkeletonStat: React.FC = () => (
  <div className="animate-pulse bg-muted rounded-xl p-4">
    <div className="h-8 bg-muted-foreground/20 rounded w-20 mb-2" />
    <div className="h-3 bg-muted-foreground/20 rounded w-16" />
  </div>
);

/** Reusable table skeleton */
export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="animate-pulse h-12 bg-muted rounded-lg" />
    ))}
  </div>
);