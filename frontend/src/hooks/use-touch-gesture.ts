import { useEffect, useRef } from 'react';
import { TouchGestureUtil, SwipeGestureOptions, PullToRefreshOptions } from '../utils/touch-gesture.util';

/**
 * React hook to manage touch gestures for mobile interactions
 */
export const useTouchGesture = () => {
  const gestureUtilRef = useRef<TouchGestureUtil | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  // Initialize the gesture utility
  useEffect(() => {
    gestureUtilRef.current = new TouchGestureUtil();
    
    return () => {
      gestureUtilRef.current?.destroy();
    };
  }, []);

  const addSwipeGesture = (options: SwipeGestureOptions) => {
    if (gestureUtilRef.current && elementRef.current) {
      gestureUtilRef.current.addSwipeGesture({
        ...options,
        element: elementRef.current
      });
    }
  };

  const addPullToRefresh = (options: PullToRefreshOptions) => {
    if (gestureUtilRef.current && elementRef.current) {
      gestureUtilRef.current.addPullToRefresh({
        ...options,
        element: elementRef.current
      });
    }
  };

  return {
    ref: elementRef,
    addSwipeGesture,
    addPullToRefresh
  };
};