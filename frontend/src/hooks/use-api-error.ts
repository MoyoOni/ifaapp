import { useState, useCallback } from 'react';
import errorHandler from '../utils/error-handler.util';

interface ApiError {
  message: string;
  status?: number;
  details?: string;
}

const useApiError = () => {
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleApiCall = useCallback(async <T,>(
    apiFunction: () => Promise<T>,
    options?: {
      onError?: (error: ApiError) => void;
      onSuccess?: (result: T) => void;
      customErrorMessage?: string;
    }
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiFunction();
      
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      
      setIsLoading(false);
      return result;
    } catch (err: any) {
      let apiError: ApiError;

      // Handle different types of errors
      if (err.status || err.response?.status) {
        const status = err.status || err.response.status;
        const statusText = err.statusText || err.response?.statusText || 'Unknown Error';
        
        apiError = {
          message: options?.customErrorMessage || statusText,
          status,
          details: err.message || err.response?.data?.message,
        };
      } else if (err instanceof Error) {
        apiError = {
          message: options?.customErrorMessage || err.message || 'An unknown error occurred',
          details: err.message,
        };
      } else {
        apiError = {
          message: options?.customErrorMessage || 'An unknown error occurred',
          details: String(err),
        };
      }

      setError(apiError);
      errorHandler.handleError(err, { 
        apiError, 
        customErrorMessage: options?.customErrorMessage 
      });

      if (options?.onError) {
        options.onError(apiError);
      }

      setIsLoading(false);
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Expose setError for testing purposes
  const setErrorInternal = useCallback((newError: ApiError | null) => {
    setError(newError);
  }, []);

  return {
    error,
    isLoading,
    handleApiCall,
    clearError,
    setError: setErrorInternal, // Only exposed for testing
  };
};

export default useApiError;