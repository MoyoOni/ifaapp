/**
 * Dashboard hooks facade (PB-203.1)
 * Re-exports from dashboard/ for backward compatibility.
 */

export {
  useClientDashboard,
  useBabalawoDashboard,
  useVendorDashboard,
  useMyDashboard,
} from './dashboard';

export type {
  ConsultationSummary,
  GuidancePlanSummary,
  TempleSummary,
  CircleSummary,
  ClientDashboardSummary,
  BabalawoDashboardSummary,
  VendorDashboardSummary,
} from './dashboard';
