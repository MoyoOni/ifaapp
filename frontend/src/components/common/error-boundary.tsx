import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    resetErrorBoundary: () => void;
  }>;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultFallback;
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

const DefaultFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Something went wrong</h2>
          <p className="text-muted-foreground">
            We've encountered an unexpected error. Don't worry, we're working to fix it.
          </p>
        </div>
        
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 text-left">
          <p className="text-sm font-medium text-destructive mb-1">Error details:</p>
          <p className="text-sm text-destructive/80 break-words">
            {error.message}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button 
            variant="default" 
            onClick={resetErrorBoundary}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </Button>
          
          <Link to="/">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export { ErrorBoundary };