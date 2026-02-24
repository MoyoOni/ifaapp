import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Loading component for suspense fallback
const LoadingComponent = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-stone-500" />
  </div>
);

// Utility function to create lazy-loaded components with proper typing
export const lazyLoad = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(importFunc);
  
  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback || <LoadingComponent />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Pre-defined lazy-loaded components for heavy features
// Commenting out missing components temporarily
/*
export const LazyAdminDashboard = lazyLoad(() => import('@/features/admin/AdminDashboard'));
export const LazyMessagesPage = lazyLoad(() => import('@/pages/MessagesPage'));
export const LazyVideoCall = lazyLoad(() => import('@/features/video-call/VideoCall'));
export const LazyMarketplacePage = lazyLoad(() => import('@/pages/MarketplacePage'));
export const LazyAcademyView = lazyLoad(() => import('@/features/academy/AcademyView'));
export const LazyEventsPage = lazyLoad(() => import('@/pages/EventsPage'));
export const LazyForumHome = lazyLoad(() => import('@/features/forum/ForumHome'));
export const LazyWalletDashboard = lazyLoad(() => import('@/features/wallet/WalletDashboard'));

// Heavy utility components
export const LazyRichTextEditor = lazyLoad(() => import('@/components/common/RichTextEditor'));
export const LazyImageUploader = lazyLoad(() => import('@/components/common/ImageUploader'));
export const LazyCalendar = lazyLoad(() => import('@/components/common/Calendar'));
*/

// Export the loading component
export { LoadingComponent };