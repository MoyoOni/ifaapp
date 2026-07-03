import { useEffect, useRef } from 'react';

/**
 * Performance measurement hook to measure rendering performance
 * @param componentName Name of the component being measured
 * @param condition Condition to determine whether to measure
 */
export const usePerformanceMeasure = (componentName: string, condition: boolean = true) => {
  const renderStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (!condition) return;

    // Measure initial render time
    renderStartRef.current = performance.now();

    return () => {
      if (renderStartRef.current !== null) {
        const renderTime = performance.now() - renderStartRef.current;
        
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Performance] ${componentName} render time: ${renderTime.toFixed(2)}ms`);
        }
        
        // Send to analytics in production if needed
        if (process.env.NODE_ENV === 'production' && renderTime > 100) {
          // Report slow renders to analytics service
          // analytics.track('slow_render', {
          //   component: componentName,
          //   renderTime,
          //   timestamp: Date.now()
          // });
        }
        
        renderStartRef.current = null;
      }
    };
  }, [componentName, condition]);
};

/**
 * Hook to measure expensive calculations or operations
 * @param operationName Name of the operation being measured
 * @returns Function to call when operation starts and finishes
 */
export const useOperationMeasurement = (operationName: string) => {
  const startTimeRef = useRef<number | null>(null);

  const start = () => {
    startTimeRef.current = performance.now();
  };

  const end = () => {
    if (startTimeRef.current !== null) {
      const duration = performance.now() - startTimeRef.current;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${operationName} took: ${duration.toFixed(2)}ms`);
      }
      
      // Report to analytics in production if needed
      if (process.env.NODE_ENV === 'production' && duration > 50) {
        // analytics.track('slow_operation', {
        //   operation: operationName,
        //   duration,
        //   timestamp: Date.now()
        // });
      }
      
      startTimeRef.current = null;
    }
  };

  return { start, end };
};

/**
 * Hook to measure API call performance
 * @param apiCallName Name of the API call being measured
 * @returns Function to call when API call starts and finishes
 */
export const useApiPerformanceMeasure = (apiCallName: string) => {
  const startTimeRef = useRef<number | null>(null);

  const start = () => {
    startTimeRef.current = performance.now();
  };

  const end = (status: 'success' | 'error' = 'success') => {
    if (startTimeRef.current !== null) {
      const duration = performance.now() - startTimeRef.current;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${apiCallName} (${status}) took: ${duration.toFixed(2)}ms`);
      }
      
      // Report to analytics in production
      if (process.env.NODE_ENV === 'production') {
        // analytics.track('api_call', {
        //   api: apiCallName,
        //   status,
        //   duration,
        //   timestamp: Date.now()
        // });
      }
      
      startTimeRef.current = null;
    }
  };

  return { start, end };
};