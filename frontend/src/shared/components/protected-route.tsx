import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { UserRole, AdminSubRole } from '@common';
import { LoadingSpinner } from './loading-spinner';

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
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    console.log('[ProtectedRoute] Loading...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('[ProtectedRoute] No user, redirecting to login');
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

  console.log(`[ProtectedRoute] User: ${user.id}, Role: ${user.role}, SubRole: ${user.adminSubRole}, Allowed: ${allowedRoles.join(',')}, Access: ${hasAccess}`);

  if (!hasAccess) {
    console.log(`[ProtectedRoute] Access denied. Redirecting to ${redirectTo}`);
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
