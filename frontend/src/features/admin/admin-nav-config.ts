import {
  Activity, AlertTriangle, Award, BarChart3, BookOpen, Building2, Crown,
  DollarSign, Flag, Hash, Lock, Mail, Megaphone, MessageSquare, RotateCcw,
  ScrollText, Settings, Shield, ShieldAlert, Star, Store, Tag, TrendingUp,
  Users, type LucideIcon,
} from 'lucide-react';

export type AdminTab =
  | 'morning-brief' | 'overview' | 'verification' | 'temples' | 'vendors'
  | 'disputes' | 'withdrawals' | 'analytics' | 'fraud'
  | 'content' | 'users' | 'circles' | 'quality' | 'health'
  | 'admin-management' | 'payment-verification' | 'subscriptions'
  | 'forum-reports' | 'forum-management' | 'audit-log' | 'sacred-content'
  | 'inactive-practitioners' | 'financial-command'
  | 'practitioners' | 'featured' | 'complaints' | 'announcements'
  | 'trust-scores' | 'refunds' | 'cultural-content' | 'featured-content' | 'community' | 'forum-intelligence' | 'integrity'
  | 'campaigns' | 'promos' | 'referrals' | 'market-intelligence' | 'forecasting' | 'lifecycle' | 'security' | 'cultural-quiz'
  | 'trust-score-audit' | 'platform-settings' | 'marketplace-admin' | 'academy-admin' | 'compliance' | 'crisis-alerts';

export interface AdminNavItem {
  id: AdminTab;
  label: string;
  icon: LucideIcon;
}

export interface AdminNavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: AdminNavItem[];
}

/**
 * Grouped admin navigation. Previously this was a single flat array of 51
 * tabs rendered as a horizontally-scrolling pill strip -- with that many
 * entries you could never see (or fit) all of them, and 3 were already dead
 * links no one had noticed: 'forum' (duplicate of 'forum-management', which
 * was the only one with a case in the content switch), 'roles' (pointed at
 * role-management-tab.tsx, deleted in an earlier cleanup pass and never
 * restored), and 'settings' (AdminSettingsTab, a near-duplicate of
 * 'platform-settings'/AdminPlatformSettingsTab -- both edit the exact same
 * `/admin/platform-settings` singleton resource; platform-settings is the
 * more complete of the two, so it's the one kept here).
 */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'command-center',
    label: 'Command Center',
    icon: BarChart3,
    items: [
      { id: 'morning-brief', label: 'Morning Brief', icon: Activity },
      { id: 'overview', label: 'Overview', icon: BarChart3 },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'health', label: 'Platform Health', icon: Activity },
    ],
  },
  {
    id: 'people-trust',
    label: 'People & Trust',
    icon: Users,
    items: [
      { id: 'users', label: 'User Management', icon: Users },
      { id: 'verification', label: 'Verification Queue', icon: Shield },
      { id: 'admin-management', label: 'Admin Management', icon: Shield },
      { id: 'trust-scores', label: 'Trust Score Management', icon: Shield },
      { id: 'trust-score-audit', label: 'Trust Score Audit', icon: Shield },
      { id: 'security', label: 'Security & Sessions', icon: Shield },
      { id: 'compliance', label: 'Data & Compliance', icon: Shield },
      { id: 'lifecycle', label: 'User Lifecycle Analytics', icon: TrendingUp },
    ],
  },
  {
    id: 'practitioners',
    label: 'Practitioners',
    icon: Activity,
    items: [
      { id: 'practitioners', label: 'Practitioner Performance', icon: Activity },
      { id: 'featured', label: 'Featured Practitioners', icon: Crown },
      { id: 'complaints', label: 'Practitioner Complaints', icon: AlertTriangle },
      { id: 'inactive-practitioners', label: 'Inactive Practitioners', icon: Activity },
    ],
  },
  {
    id: 'community-forum',
    label: 'Community & Forum',
    icon: Hash,
    items: [
      { id: 'circles', label: 'Circle Management', icon: Users },
      { id: 'forum-management', label: 'Forum Management', icon: Hash },
      { id: 'forum-reports', label: 'Forum Reports', icon: Flag },
      { id: 'forum-intelligence', label: 'Forum Intelligence', icon: BarChart3 },
      { id: 'community', label: 'Community Recognition', icon: Award },
      { id: 'integrity', label: 'Cultural Integrity', icon: ShieldAlert },
      { id: 'crisis-alerts', label: 'Crisis Alerts', icon: AlertTriangle },
    ],
  },
  {
    id: 'content-culture',
    label: 'Content & Culture',
    icon: BookOpen,
    items: [
      { id: 'content', label: 'Content Moderation', icon: MessageSquare },
      { id: 'sacred-content', label: 'Sacred Content', icon: Lock },
      { id: 'cultural-content', label: 'Cultural Content', icon: BookOpen },
      { id: 'cultural-quiz', label: 'Cultural Quiz', icon: BookOpen },
      { id: 'featured-content', label: 'Featured Content', icon: Star },
      { id: 'academy-admin', label: 'Academy', icon: BookOpen },
    ],
  },
  {
    id: 'temples-marketplace',
    label: 'Temples & Marketplace',
    icon: Building2,
    items: [
      { id: 'temples', label: 'Temple Management', icon: Building2 },
      { id: 'vendors', label: 'Vendor Review', icon: Store },
      { id: 'marketplace-admin', label: 'Marketplace', icon: Store },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    items: [
      { id: 'financial-command', label: 'Financial Command', icon: DollarSign },
      { id: 'withdrawals', label: 'Payout Approvals', icon: DollarSign },
      { id: 'payment-verification', label: 'Payment Verification', icon: DollarSign },
      { id: 'refunds', label: 'Refund Management', icon: RotateCcw },
      { id: 'subscriptions', label: 'Subscriptions', icon: Crown },
      { id: 'market-intelligence', label: 'Market Intelligence', icon: TrendingUp },
      { id: 'forecasting', label: 'Revenue Forecasting', icon: BarChart3 },
    ],
  },
  {
    id: 'growth-marketing',
    label: 'Growth & Marketing',
    icon: Mail,
    items: [
      { id: 'campaigns', label: 'Email Campaigns', icon: Mail },
      { id: 'promos', label: 'Promo Codes', icon: Tag },
      { id: 'referrals', label: 'Referral Program', icon: Users },
      { id: 'announcements', label: 'Announcements', icon: Megaphone },
    ],
  },
  {
    id: 'governance-safety',
    label: 'Governance & Safety',
    icon: AlertTriangle,
    items: [
      { id: 'disputes', label: 'Dispute Center', icon: AlertTriangle },
      { id: 'fraud', label: 'Fraud Alerts', icon: AlertTriangle },
      { id: 'quality', label: 'Quality Assurance', icon: BarChart3 },
      { id: 'audit-log', label: 'Audit Log', icon: ScrollText },
    ],
  },
  {
    id: 'system',
    label: 'System',
    icon: Settings,
    items: [
      { id: 'platform-settings', label: 'Platform Settings', icon: Settings },
    ],
  },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap(g => g.items);

export function findAdminNavGroupId(tab: AdminTab): string | undefined {
  return ADMIN_NAV_GROUPS.find(g => g.items.some(i => i.id === tab))?.id;
}
