import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { getDashboardPathForRole } from '../config/navigation';

/**
 * Redirects users to their role-appropriate dashboard.
 * Used as the default landing page after login.
 *
 * - ADMIN/ADVISORY_BOARD_MEMBER → /admin
 * - BABALAWO → /practitioner/dashboard
 * - VENDOR → /vendor/dashboard
 * - CLIENT → / (stays on home)
 */
export const RoleBasedRedirect: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const dashboardPath = getDashboardPathForRole(user.role);

  // For all roles, redirect to their specific dashboard
  return <Navigate to={dashboardPath} replace />;
};

/**
 * A wrapper component that shows role-appropriate content on the home route.
 * For clients: redirects to client dashboard
 * For other roles: redirects to their dashboard
 */
export const RoleBasedHome: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // For all users, redirect to their dashboard
  const dashboardPath = getDashboardPathForRole(user.role);
  return <Navigate to={dashboardPath} replace />;
};
