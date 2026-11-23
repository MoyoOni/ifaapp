import { flushSync } from 'react-dom';

/**
 * Animated route changes via the browser View Transitions API.
 *
 * React Router's own `viewTransition` option only works with a data router
 * (createBrowserRouter); this app uses <BrowserRouter>, where it is silently
 * ignored. So we start the transition ourselves and flush the navigation
 * synchronously inside it.
 *
 * CSS in index.css keys off `html[data-nav-transition]`:
 *   - 'tab'  : cross-fade (switching sections: tab bar, menu)
 *   - 'push' : slide in from the right (drilling into a detail screen)
 * Browsers without the API, or with reduced motion, navigate instantly.
 */
export type NavTransition = 'tab' | 'push';

export function markNavTransition(kind: NavTransition): void {
  document.documentElement.dataset.navTransition = kind;
}

export function navigateWithTransition(
  navigate: (to: string) => void,
  to: string,
  kind: NavTransition = 'tab',
): void {
  const reduceMotion =
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof document.startViewTransition !== 'function' || reduceMotion) {
    navigate(to);
    return;
  }
  markNavTransition(kind);
  // The page content gets its view-transition-name only while a transition
  // runs (index.css: html.vt-active [data-vt-page]). A permanent name would
  // make it a stacking context and trap in-page overlays under the tab bar.
  const root = document.documentElement;
  root.classList.add('vt-active');
  const transition = document.startViewTransition(() => {
    flushSync(() => navigate(to));
  });
  transition.finished.finally(() => root.classList.remove('vt-active'));
}
