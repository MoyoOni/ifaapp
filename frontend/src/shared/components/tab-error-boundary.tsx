import React from 'react';
import { logger } from '@/shared/utils/logger';

interface TabErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  tabName?: string;
}

interface TabErrorBoundaryState {
  hasError: boolean;
}

/**
 * Error boundary for admin dashboard tabs.
 * Catches React rendering errors so a single broken tab
 * does not crash the entire admin dashboard.
 */
export class TabErrorBoundary extends React.Component<TabErrorBoundaryProps, TabErrorBoundaryState> {
  constructor(props: TabErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): TabErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error(`[TabErrorBoundary] Tab "${this.props.tabName ?? 'unknown'}" crashed:`, error, info.componentStack);
  }

  // Reset when switching to a different tab (children change)
  componentDidUpdate(prevProps: TabErrorBoundaryProps) {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return <>{this.props.fallback}</>;
    }
    return <>{this.props.children}</>;
  }
}
