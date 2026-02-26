import { useEffect, useRef } from 'react';
import { FocusTrapUtil } from '../utils/focus-trap.util';

/**
 * React hook to manage focus trapping in modals, drawers, and other overlays
 */
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const focusTrap = new FocusTrapUtil(containerRef.current);
    focusTrap.activate();

    return () => {
      focusTrap.deactivate();
    };
  }, [isActive]);

  return containerRef;
};