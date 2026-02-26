import * as Sentry from '@sentry/react';
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        Sentry.captureException(error, {
            extra: {
                componentStack: errorInfo.componentStack,
            },
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-muted">
                    <div className="text-center max-w-md px-6">
                        <div className="mb-6">
                            <svg
                                className="mx-auto h-16 w-16 text-warning"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-[1.5rem] font-[700] text-foreground mb-4">
                            Something went wrong
                        </h1>
                        <p className="text-[0.875rem] text-muted-foreground mb-6">
                            We've been notified and are working on a fix. Please try refreshing the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-warning text-warning-foreground rounded-lg hover:bg-warning/90 transition-colors font-[500]"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default Sentry.withErrorBoundary(ErrorBoundary, {
    fallback: (
        <div className="min-h-screen flex items-center justify-center bg-muted">
            <div className="text-center">
                <p className="text-muted-foreground">An error occurred</p>
            </div>
        </div>
    ),
});
