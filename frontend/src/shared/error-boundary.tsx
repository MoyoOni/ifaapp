import React from 'react';
import { RotateCcw } from 'lucide-react';
import { logger, getLogContext } from '@/shared/utils/logger';
import { captureException } from '@/shared/config/sentry';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Error caught by boundary:', error, errorInfo);
    const logCtx = getLogContext();
    captureException(error, {
      componentStack: errorInfo.componentStack,
      traceId: logCtx.traceId,
      userId: logCtx.userId,
    });
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback
        ? this.props.fallback
        : DefaultErrorFallback;

      return (
        <FallbackComponent
          error={this.state.error!}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    return this.props.children;
  }
}

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const DefaultErrorFallback: React.FC<FallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200 shadow-lg text-center">
        <div className="w-16 h-16 mx-auto bg-highlight/10 rounded-full flex items-center justify-center mb-6">
          <div className="text-highlight text-2xl">⚠️</div>
        </div>
        
        <h2 className="text-2xl font-bold brand-font text-stone-800 mb-2">
          Something went wrong
        </h2>
        
        <p className="text-stone-500 mb-6">
          We encountered an unexpected issue. Our team has been notified.
        </p>
        
        {error && (
          <details className="text-left text-xs text-stone-400 bg-stone-50 p-3 rounded-lg mb-6">
            <summary className="cursor-pointer">Error details</summary>
            {error.message}
          </details>
        )}
        
        <button
          onClick={resetErrorBoundary}
          className="px-6 py-3 bg-highlight text-white rounded-xl font-bold hover:bg-yellow-600 transition-colors flex items-center gap-2 mx-auto"
        >
          <RotateCcw size={16} />
          Try Again
        </button>
      </div>
    </div>
  );
};

export default ErrorBoundary;