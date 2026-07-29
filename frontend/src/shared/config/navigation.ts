import {
  ShoppingBag,
  GraduationCap,
  Users,
  Search,
  LayoutDashboard,
  Package,
  TrendingUp,
  Shield,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Building2,
  Wallet,
  User,
  BookOpen,
  Activity,
  MessagesSquare,
  UserPlus,
  ClipboardList,
  LifeBuoy,
  type LucideIcon
} from 'lucide-react';
import { UserRole, AdminSubRole } from '@common';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  badge?: string;
  requiredAdminSubRoles?: AdminSubRole[]; // New field for granular RBAC
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

// Client-specific navigation (now includes all necessary items)
const CLIENT_NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: User, path: '/client/dashboard' },
  { id: 'find-guide', label: 'Find My Guide', icon: Search, path: '/babalawo' },
  { id: 'temples', label: 'Temples', icon: Building2, path: '/client/temples' },
  { id: 'learning-path', label: 'Academy', icon: GraduationCap, path: '/academy' },
  { id: 'community-circles', label: 'Community Circles', icon: Users, path: '/circles' },
  { id: 'directory', label: 'Member Directory', icon: UserPlus, path: '/directory' },
  { id: 'forum', label: 'Forum', icon: MessagesSquare, path: '/forum' },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag, path: '/marketplace' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, path: '/wallet' },
  { id: 'profile', label: 'My Profile', icon: User, path: '/profile' },
];

// Babalawo/Practitioner-specific navigation
const BABALAWO_NAV_ITEMS: NavItem[] = [
  { id: 'practice-center', label: 'Practice Center', icon: LayoutDashboard, path: '/practitioner/dashboard' },
  { id: 'my-seekers', label: 'My Seekers', icon: Users, path: '/practitioner/my-seekers' },
  { id: 'service-offerings', label: 'Service Offerings', icon: BookOpen, path: '/practitioner/service-offering' },
  { id: 'temple-connection', label: 'Temple Connection', icon: Building2, path: '/practitioner/temple-connection' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, path: '/wallet' },
  { id: 'forum', label: 'Forum', icon: MessagesSquare, path: '/forum' },
  { id: 'professional-growth', label: 'Academy', icon: TrendingUp, path: '/academy' },
  // COMMUNITY_BACKLOG.md FOR-009: low-friction platform-usage help board,
  // distinct from spiritual Q&A -- elders ask, any community member answers.
  { id: 'tech-help', label: 'Tech Help', icon: LifeBuoy, path: '/tech-help' },
  { id: 'profile', label: 'My Profile', icon: User, path: '/profile' },
];

// Vendor-specific navigation
const VENDOR_NAV_ITEMS: NavItem[] = [
  { id: 'sacred-shop', label: 'My Sacred Shop', icon: LayoutDashboard, path: '/vendor/dashboard' },
  { id: 'product-workshop', label: 'Inventory', icon: Package, path: '/vendor/products' },
  // Whole-app audit loose end: /vendor/orders (VendorOrderListView) was
  // fully built and routed but had no sidebar entry anywhere -- the only
  // reachable "view my orders" UI was the dashboard's own Orders tab.
  { id: 'vendor-orders', label: 'Orders', icon: ClipboardList, path: '/vendor/orders' },
  { id: 'customer-care', label: 'Customer Care', icon: Users, path: '/vendor/support' },
  { id: 'community-market', label: 'Community Market', icon: ShoppingBag, path: '/marketplace' },
  { id: 'sales-insights', label: 'Revenue/Analytics', icon: BarChart3, path: '/vendor/insights' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, path: '/wallet' },
  { id: 'forum', label: 'Forum', icon: MessagesSquare, path: '/forum' },
  { id: 'academy', label: 'Academy', icon: TrendingUp, path: '/academy' },
  { id: 'profile', label: 'My Profile', icon: User, path: '/profile' },
];

// Admin-specific navigation
// All admin sub-pages are tabs within AdminDashboardView, routed via /admin/:tab
const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: 'community-stewardship', label: 'Community Stewardship', icon: Shield, path: '/admin' },
  {
    id: 'member-verification',
    label: 'Member Verification',
    icon: CheckCircle,
    path: '/admin/verification',
    requiredAdminSubRoles: [AdminSubRole.COMPLIANCE, AdminSubRole.SUPER]
  },
  {
    id: 'quality-assurance',
    label: 'Quality Assurance',
    icon: BarChart3,
    path: '/admin/quality',
    requiredAdminSubRoles: [AdminSubRole.MODERATOR, AdminSubRole.SUPER]
  },
  {
    id: 'content-moderation',
    label: 'Content Moderation',
    icon: AlertTriangle,
    path: '/admin/content',
    requiredAdminSubRoles: [AdminSubRole.MODERATOR, AdminSubRole.SUPER]
  },
  {
    id: 'platform-health',
    label: 'Platform Health',
    icon: Activity,
    path: '/admin/health',
    requiredAdminSubRoles: [AdminSubRole.COMPLIANCE, AdminSubRole.SUPER]
  },
  {
    id: 'sacred-finance',
    label: 'Sacred Finance',
    icon: Wallet,
    path: '/admin/withdrawals',
    requiredAdminSubRoles: [AdminSubRole.FINANCE, AdminSubRole.SUPER]
  },
  {
    id: 'fraud-monitoring',
    label: 'Fraud Monitoring',
    icon: AlertTriangle,
    path: '/admin/fraud',
    requiredAdminSubRoles: [AdminSubRole.COMPLIANCE, AdminSubRole.SUPER]
  },
  { id: 'forum', label: 'Forum', icon: MessagesSquare, path: '/forum' },
  { id: 'profile', label: 'My Profile', icon: User, path: '/profile' },
];

// Advisory board members only have backend access to the advisory-board
// voting endpoints (@Roles(ADMIN, ADVISORY_BOARD_MEMBER) in admin.controller.ts)
// -- the other 140+ admin endpoints are ADMIN-only. Reusing ADMIN_NAV_ITEMS
// here used to show this role every admin tab, each of which 403'd on click.
const ADVISORY_BOARD_NAV_ITEMS: NavItem[] = [
  { id: 'advisory-board', label: 'Advisory Board', icon: Shield, path: '/admin/advisory-board' },
  { id: 'forum', label: 'Forum', icon: MessagesSquare, path: '/forum' },
  { id: 'profile', label: 'My Profile', icon: User, path: '/profile' },
];

// Map roles to their navigation items
const ROLE_NAV_MAP: Record<UserRole, NavItem[]> = {
  [UserRole.CLIENT]: CLIENT_NAV_ITEMS,
  [UserRole.BABALAWO]: BABALAWO_NAV_ITEMS,
  [UserRole.VENDOR]: VENDOR_NAV_ITEMS,
  [UserRole.ADMIN]: ADMIN_NAV_ITEMS,
  [UserRole.ADVISORY_BOARD_MEMBER]: ADVISORY_BOARD_NAV_ITEMS,
};

/**
 * Get navigation items for a specific user role
 * Each role now has complete navigation including messages, notifications, and profile
 */
export function getNavItemsForRole(role: UserRole | string | undefined): NavItem[] {
  if (!role) {
    return [...CLIENT_NAV_ITEMS];
  }

  const roleKey = role as UserRole;
  const roleItems = ROLE_NAV_MAP[roleKey] || CLIENT_NAV_ITEMS;

  return [...roleItems];
}

/**
 * Get the default dashboard path for a role
 */
export function getDashboardPathForRole(role: UserRole | string | undefined): string {
  switch (role) {
    case UserRole.ADMIN:
      return '/admin';
    case UserRole.ADVISORY_BOARD_MEMBER:
      return '/admin/advisory-board';
    case UserRole.BABALAWO:
      return '/practitioner/dashboard';
    case UserRole.VENDOR:
      return '/vendor/dashboard';
    case UserRole.CLIENT:
    default:
      return '/client/dashboard'; // Changed to client dashboard
  }
}

/**
 * Get display label for a role
 */
export function getRoleDisplayName(role: UserRole | string | undefined): string {
  switch (role) {
    case UserRole.ADMIN:
      return 'Administrator';
    case UserRole.ADVISORY_BOARD_MEMBER:
      return 'Advisory Board';
    case UserRole.BABALAWO:
      return 'Babalawo';
    case UserRole.VENDOR:
      return 'Vendor';
    case UserRole.CLIENT:
    default:
      return 'Member';
  }
}

/**
 * Get role badge color class
 */
export function getRoleBadgeColor(role: UserRole | string | undefined): string {
  switch (role) {
    case UserRole.ADMIN:
    case UserRole.ADVISORY_BOARD_MEMBER:
      return 'bg-purple-100 text-purple-700';
    case UserRole.BABALAWO:
      return 'bg-highlight/20 text-highlight';
    case UserRole.VENDOR:
      return 'bg-blue-100 text-blue-700';
    case UserRole.CLIENT:
    default:
      return 'bg-primary/20 text-primary';
  }
}