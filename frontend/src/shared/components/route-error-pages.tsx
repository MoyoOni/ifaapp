import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface RouteErrorPageProps {
  title: string;
  dashboardPath: string;
  dashboardLabel: string;
}

export const RouteErrorPage: React.FC<RouteErrorPageProps> = ({ title, dashboardPath, dashboardLabel }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
    <div className="text-center max-w-md">
      <AlertTriangle className="h-16 w-16 mx-auto text-destructive mb-6" />
      <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground mb-6">
        Something went wrong loading this page. Please try again or return to your dashboard.
      </p>
      <div className="space-y-3">
        <button
          onClick={() => window.location.reload()}
          className="block w-full px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-colors font-medium"
        >
          Refresh Page
        </button>
        <button
          onClick={() => window.location.assign(dashboardPath)}
          className="block w-full px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl transition-colors font-medium"
        >
          {dashboardLabel}
        </button>
      </div>
    </div>
  </div>
);

export const AdminErrorPage: React.FC = () => (
  <RouteErrorPage title="Admin Page Error" dashboardPath="/admin" dashboardLabel="Return to Admin Dashboard" />
);

export const PractitionerErrorPage: React.FC = () => (
  <RouteErrorPage title="Practice Center Error" dashboardPath="/practitioner/dashboard" dashboardLabel="Return to Practice Center" />
);

export const VendorErrorPage: React.FC = () => (
  <RouteErrorPage title="Shop Error" dashboardPath="/vendor/dashboard" dashboardLabel="Return to My Shop" />
);

export const ClientErrorPage: React.FC = () => (
  <RouteErrorPage title="Page Error" dashboardPath="/client/dashboard" dashboardLabel="Return to Dashboard" />
);
