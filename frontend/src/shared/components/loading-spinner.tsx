import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Optional message to display below spinner */
  message?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to center in container */
  centered?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const paddingClasses = {
  sm: 'py-4',
  md: 'py-8',
  lg: 'py-12',
  xl: 'py-16',
};

/**
 * Unified loading spinner component
 *
 * @example
 * ```tsx
 * // Simple spinner
 * <LoadingSpinner />
 *
 * // With message
 * <LoadingSpinner size="lg" message="Loading courses..." />
 *
 * // Inline (not centered)
 * <LoadingSpinner size="sm" centered={false} />
 * ```
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'lg',
  message,
  className = '',
  centered = true,
}) => {
  const spinnerElement = (
    <Loader2 className={`${sizeClasses[size]} animate-spin text-highlight`} />
  );

  if (!centered) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        {spinnerElement}
        {message && <span className="text-stone-500 text-sm">{message}</span>}
      </span>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${paddingClasses[size]} ${className}`}>
      {spinnerElement}
      {message && (
        <p className="mt-3 text-stone-500 text-sm font-medium">{message}</p>
      )}
    </div>
  );
};

/**
 * Full-page loading state
 */
export const PageLoading: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <LoadingSpinner size="xl" message={message} />
  </div>
);

/**
 * Card/section loading state
 */
export const CardLoading: React.FC<{ message?: string }> = ({ message }) => (
  <div className="bg-white rounded-2xl border border-stone-100 p-8">
    <LoadingSpinner size="lg" message={message} />
  </div>
);

export default LoadingSpinner;
