import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { UserRole, AdminSubRole } from '@common';
import { LoadingSpinner } from './loading-spinner';
import { logger } from '@/shared/utils/logger';
import { useQueryClient } from '@tanstack/react-query';
import { CloudOff } from 'lucide-react';
import { useServerUnreachable } from '@/shared/utils/server-reachability';

/**
 * A signed-in member whose profile couldn't be loaded because the server is
 * unreachable. Both route guards used to treat that as "not signed in" and
 * redirect to /login during any outage -- to a login page that couldn't work
 * either. The session is still there; show that, with a way to retry.
 */
const ConnectionLostNotice: React.FC = () => {
  const queryClient = useQueryClient();
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <CloudOff size={44} className="mx-auto text-muted-foreground" />
        <h2 className="text-xl font-bold text-foreground">We can't reach Ìlú Àṣẹ right now</h2>
        <p className="text-muted-foreground">You're still signed in. This page will load once the connection is back.</p>
        <button
          type="button"
          onClick={() => queryClient.refetchQueries({ type: 'active' })}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: (UserRole | string)[];
  allowedAdminRoles?: AdminSubRole[];
  redirectTo?: string;
}

/**
 * A route wrapper that restricts access based on user roles.
 * Redirects unauthorized users to the specified path (default: home).
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  allowedAdminRoles,
  redirectTo = '/'
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();
  const unreachable = useServerUnreachable();

  // Show loading state while checking auth
  if (isLoading) {
    logger.info('[ProtectedRoute] Loading...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user && isAuthenticated && unreachable) {
    return <ConnectionLostNotice />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    logger.info('[ProtectedRoute] No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user role is in allowed roles
  let hasAccess = allowedRoles.includes(user.role as UserRole);

  // Granular Admin Sub-role Check
  if (user.role === UserRole.ADMIN && allowedAdminRoles && allowedAdminRoles.length > 0) {
    // SUPER admin always has access
    if (user.adminSubRole === AdminSubRole.SUPER) {
      hasAccess = true;
    } else {
      hasAccess = allowedAdminRoles.includes(user.adminSubRole as AdminSubRole);
    }
  }

  logger.info(`[ProtectedRoute] User: ${user.id}, Role: ${user.role}, SubRole: ${user.adminSubRole}, Allowed: ${allowedRoles.join(',')}, Access: ${hasAccess}`);

  if (!hasAccess) {
    logger.info(`[ProtectedRoute] Access denied. Redirecting to ${redirectTo}`);
    // Redirect to unauthorized page or home
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

/**
 * Helper for routes restricted to specific admin specialties
 */
export const AdminSpecialtyRoute: React.FC<{
  children: React.ReactNode;
  allowedSubRoles: AdminSubRole[];
}> = ({ children, allowedSubRoles }) => (
  <ProtectedRoute
    allowedRoles={[UserRole.ADMIN]}
    allowedAdminRoles={allowedSubRoles}
  >
    {children}
  </ProtectedRoute>
);

/**
 * Helper to create role-specific route guards
 */
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ADVISORY_BOARD_MEMBER]}>
    {children}
  </ProtectedRoute>
);

export const BabalawoRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={[UserRole.BABALAWO, UserRole.ADMIN]}>
    {children}
  </ProtectedRoute>
);

export const VendorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={[UserRole.VENDOR, UserRole.ADMIN]}>
    {children}
  </ProtectedRoute>
);

/**
 * For pages that need a logged-in user but aren't role-specific (wallet,
 * profile, member directory...). Sends anonymous visitors to login, passing the
 * intended location in router state like ProtectedRoute does.
 */
export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();
  const unreachable = useServerUnreachable();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user && isAuthenticated && unreachable) {
    return <ConnectionLostNotice />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
