import React, { useEffect } from 'react';
import { LoadingSpinner } from './loading-spinner';
import { BrandedLoadingScreen } from './branded-loading-screen';

// Route-level Suspense fallback. Until the first page has rendered, show the
// branded loader so a cold start goes splash → branded loader → page with no
// white flash in between. After that, in-app navigation keeps the light,
// in-page spinner — a dark full-screen flash mid-session would be jarring.
//
// Module-level on purpose: the ~119 route fallbacks are separate instances in
// separate Suspense boundaries, and "has any page rendered yet this session"
// is one fact shared by all of them. Don't move it into component state.
let firstPageRendered = false;

export const RouteFallback: React.FC = () => {
  // This fallback unmounts when its lazy page resolves, i.e. a page rendered.
  useEffect(() => () => { firstPageRendered = true; }, []);
  return firstPageRendered ? <LoadingSpinner /> : <BrandedLoadingScreen />;
};

export default RouteFallback;
