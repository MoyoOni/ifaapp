import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Shield, MessageSquare,
  AlertTriangle, DollarSign, BarChart3, TrendingUp,
  Building2, Store, Activity, XCircle, Crown, Flag, ScrollText, Lock, Hash, Megaphone, RotateCcw, Settings, BookOpen, Star, Award, ShieldAlert, Mail, Tag
} from 'lucide-react';
import { ADMIN_NAV_ITEMS, type AdminTab } from './admin-nav-config';
import { AdminSidebarNav } from './admin-sidebar-nav';
import { useAuth } from '@/shared/hooks/use-auth';
import { usePrompt } from '@/hooks/use-prompt';
import api from '@/lib/api';
import VerificationQueueView from './verification-queue-view';
import DisputeCenterView from './dispute-center-view';
import PayoutApprovalsView from './payout-approvals-view';
import AnalyticsDashboardView from './analytics-dashboard-view';
import FraudAlertsView from './fraud-alerts-view';
import TempleManagementView from './temple-management-view';
import VendorReviewView from './vendor-review-view';
import ReportedContentView from './reported-content-view';
import CircleManagementView from './circle-management-view';
import QualityAssuranceView from './quality-assurance-view';
import PlatformHealthView from './platform-health-view';
import AdminOverviewTab from './admin-overview-tab';
import AdminUserManagementTab from './admin-user-management-tab';
import AdminManagementView from './admin-management-view';
import PaymentVerificationView from './payment-verification-view';
import AdminSubscriptionTab from './admin-subscription-tab';
import AdminForumReportsTab from './admin-forum-reports-tab';
import AdminForumManagementTab from './admin-forum-management-tab';
import AdminAnnouncementsTab from './admin-announcements-tab';
import FeaturedPractitionersTab from './featured-practitioners-tab'; // Added new import for Featured Practitioners tab
import AdminAuditLogTab from './admin-audit-log-tab';
import AdminSacredContentTab from './admin-sacred-content-tab';
import PractitionerPerformanceTab from './practitioner-performance-tab'; // New import for Practitioner Performance tab
import PractitionerComplaintsTab from './practitioner-complaints-tab'; // New import for Practitioner Complaints tab
import InactivePractitionerTab from './inactive-practitioner-tab'; // New import for Inactive Practitioner tab
import FinancialCommandCentreTab from './financial-command-centre-tab'; // New import for Financial Command Centre tab
import TrustScoreManagementTab from './trust-score-management-tab';
import AdminMorningBriefTab from './admin-morning-brief-tab';
import AdminRefundsTab from './admin-refunds-tab';
import AdminCulturalContentTab from './admin-cultural-content-tab';
import { AdminFeaturedContentTab } from './admin-featured-content-tab';
import { AdminCommunityTab } from './admin-community-tab';
import { AdminForumIntelligenceTab } from './admin-forum-intelligence-tab';
import { AdminIntegrityTab } from './admin-integrity-tab';
import { AdminCampaignsTab } from './admin-campaigns-tab';
import { AdminPromosTab } from './admin-promos-tab';
import { AdminReferralsTab } from './admin-referrals-tab';
import { AdminMarketIntelligenceTab } from './admin-market-intelligence-tab';
import { AdminForecastingTab } from './admin-forecasting-tab';
import { AdminLifecycleTab } from './admin-lifecycle-tab'; // New import for User Lifecycle Analytics tab
import AdminSecurityTab from './admin-security-tab';
import AdminCulturalQuizTab from './admin-cultural-quiz-tab';
import AdminTrustScoreAuditTab from './admin-trust-score-audit-tab';
import AdminPlatformSettingsTab from './admin-platform-settings-tab';
import AdminMarketplaceTab from './admin-marketplace-tab';
import AdminAcademyTab from './admin-academy-tab';
import AdminComplianceTab from './admin-compliance-tab';
import AdminCrisisAlertsTab from './admin-crisis-alerts-tab';

import { AdminUser, VerificationApplication } from './admin-shared-components';
import { useToast } from '@/shared/components/toast';
import { TabErrorBoundary } from '@/shared/components/tab-error-boundary';
import { Breadcrumb } from '@/shared/components/breadcrumb';

interface PlatformStats {
  totalUsers: number;
  verifiedBabalawos: number;
  pendingVerifications: number;
  activeRelationships: number;
  totalAppointments: number;
  totalMessages: number;
}

interface AdminDashboardViewProps {
  initialTab?: AdminTab;
}

/** Fallback shown when a tab crashes or is unavailable */
const TabFallback: React.FC<{ icon: React.ElementType; label: string }> = ({ icon: Icon, label }) => (
  <div className="bg-card rounded-2xl p-6 border border-border">
    <h2 className="text-[1.125rem] font-[700] text-foreground flex items-center gap-2">
      <Icon size={24} /> {label}
    </h2>
    <p className="text-muted-foreground text-sm py-8 text-center">This section encountered an error. Refresh the page to try again.</p>
  </div>
);

/** Impersonation banner with elapsed timer */
const ImpersonationBanner: React.FC<{ userName: string; onStop: () => void }> = ({ userName, onStop }) => {
  const [elapsed, setElapsed] = React.useState('');
  React.useEffect(() => {
    const startStr = localStorage.getItem('impersonationStartedAt');
    if (!startStr) return;
    const start = new Date(startStr).getTime();
    const tick = () => {
      const diff = Math.floor((Date.now() - start) / 1000);
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setElapsed(`${m}m ${s.toString().padStart(2, '0')}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-destructive/20 border border-destructive/50 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md"
    >
      <div className="flex items-center gap-3 text-warning">
        <AlertTriangle className="animate-pulse" />
        <div>
          <p className="text-[0.875rem] font-bold">IMPERSONATION MODE ACTIVE</p>
          <p className="text-[0.75rem] opacity-80">
            Viewing as <strong>{userName}</strong>{elapsed ? ` — ${elapsed}` : ''}. All actions are audited.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onStop}
        className="px-4 py-2 bg-destructive text-white rounded-xl font-bold text-sm hover:bg-error transition-colors flex items-center gap-2"
      >
        <XCircle size={16} />
        Stop Impersonating
      </button>
    </motion.div>
  );
};

/**
 * Admin Dashboard View
 * Platform governance and oversight tools
 * NOTE: Only accessible to ADMIN role users
 */
const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ initialTab }) => {
  const { user: currentUser, impersonate, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab || 'overview');

  const { success, error } = useToast();
  const { PromptDialog, prompt: promptInput } = usePrompt();

  const impersonateUser = async (id: string, name: string) => {
    try {
      const reason = await promptInput({
        title: 'User Impersonation (Audited)',
        message: 'Please provide a mandatory reason for impersonating this user. This action will be logged.',
        placeholder: 'Reason for impersonation...',
        confirmText: 'Impersonate',
        required: true,
      });
      if (!reason) return;
      await impersonate(id, reason);
      success(`Impersonating ${name}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      error(`Impersonation failed: ${msg}`);
    }
  };

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const { data: stats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/stats');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Admin stats refresh every 5 minutes
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await api.get('/admin/users');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: verifications = [], isLoading: verificationsLoading } = useQuery<VerificationApplication[]>({
    queryKey: ['admin-verifications'],
    queryFn: async () => {
      const response = await api.get('/admin/verification-applications');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'morning-brief':
        return <AdminMorningBriefTab onNavigate={(tab) => setActiveTab(tab as AdminTab)} />;
      case 'overview':
        return (
          <AdminOverviewTab
            stats={stats}
            statsLoading={statsLoading}
            users={users}
            usersLoading={usersLoading}
            verifications={verifications}
            verificationsLoading={verificationsLoading}
            onNavigateToVerification={() => setActiveTab('verification')}
            onNavigateToUsers={() => setActiveTab('users')}
            onImpersonate={(userId) => impersonateUser(userId, '')}
          />
        );
      case 'verification': return <VerificationQueueView />;
      case 'users':
        return (
          <AdminUserManagementTab
            users={users}
            onImpersonate={(userId) => impersonateUser(userId, '')}
          />
        );
      case 'temples':
        return <TabErrorBoundary fallback={<TabFallback icon={Building2} label="Temple Management" />} tabName="temples"><TempleManagementView /></TabErrorBoundary>;
      case 'vendors':
        return <TabErrorBoundary fallback={<TabFallback icon={Store} label="Vendor Review" />} tabName="vendors"><VendorReviewView /></TabErrorBoundary>;
      case 'circles':
        return <TabErrorBoundary fallback={<TabFallback icon={Users} label="Circle Management" />} tabName="circles"><CircleManagementView /></TabErrorBoundary>;
      case 'disputes':
        return <TabErrorBoundary fallback={<TabFallback icon={AlertTriangle} label="Dispute Center" />} tabName="disputes"><DisputeCenterView /></TabErrorBoundary>;
      case 'withdrawals':
        return <TabErrorBoundary fallback={<TabFallback icon={DollarSign} label="Payout Approvals" />} tabName="withdrawals"><PayoutApprovalsView /></TabErrorBoundary>;
      case 'content':
        return <TabErrorBoundary fallback={<TabFallback icon={MessageSquare} label="Content Moderation" />} tabName="content"><ReportedContentView /></TabErrorBoundary>;
      case 'analytics':
        return <TabErrorBoundary fallback={<TabFallback icon={BarChart3} label="Analytics" />} tabName="analytics"><AnalyticsDashboardView /></TabErrorBoundary>;
      case 'quality':
        return <TabErrorBoundary fallback={<TabFallback icon={BarChart3} label="Quality Assurance" />} tabName="quality"><QualityAssuranceView /></TabErrorBoundary>;
      case 'health':
        return <TabErrorBoundary fallback={<TabFallback icon={Activity} label="Platform Health" />} tabName="health"><PlatformHealthView /></TabErrorBoundary>;
      case 'fraud':
        return <TabErrorBoundary fallback={<TabFallback icon={AlertTriangle} label="Fraud Alerts" />} tabName="fraud"><FraudAlertsView /></TabErrorBoundary>;
      case 'admin-management':
        return <TabErrorBoundary fallback={<TabFallback icon={Shield} label="Admin Management" />} tabName="admin-management"><AdminManagementView /></TabErrorBoundary>;
      case 'payment-verification':
        return <TabErrorBoundary fallback={<TabFallback icon={DollarSign} label="Payment Verification" />} tabName="payment-verification"><PaymentVerificationView /></TabErrorBoundary>;
      case 'subscriptions':
        return <TabErrorBoundary fallback={<TabFallback icon={Crown} label="Subscriptions" />} tabName="subscriptions"><AdminSubscriptionTab /></TabErrorBoundary>;
      case 'forum-reports':
        return <TabErrorBoundary fallback={<TabFallback icon={Flag} label="Forum Reports" />} tabName="forum-reports"><AdminForumReportsTab /></TabErrorBoundary>;
      case 'forum-management':
        return <TabErrorBoundary fallback={<TabFallback icon={Hash} label="Forum Management" />} tabName="forum-management"><AdminForumManagementTab /></TabErrorBoundary>;
      case 'sacred-content':
        return <TabErrorBoundary fallback={<TabFallback icon={Lock} label="Sacred Content" />} tabName="sacred-content"><AdminSacredContentTab /></TabErrorBoundary>;
      case 'announcements':
        return <TabErrorBoundary fallback={<TabFallback icon={Megaphone} label="Announcements" />} tabName="announcements"><AdminAnnouncementsTab /></TabErrorBoundary>;
      case 'audit-log':
        return <TabErrorBoundary fallback={<TabFallback icon={ScrollText} label="Audit Log" />} tabName="audit-log"><AdminAuditLogTab /></TabErrorBoundary>;
      case 'practitioners':
        return <TabErrorBoundary fallback={<TabFallback icon={Activity} label="Practitioner Performance" />} tabName="practitioners"><PractitionerPerformanceTab /></TabErrorBoundary>;
      case 'featured':
        return <TabErrorBoundary fallback={<TabFallback icon={Crown} label="Featured Practitioners" />} tabName="featured"><FeaturedPractitionersTab /></TabErrorBoundary>;
      case 'complaints':
        return <TabErrorBoundary fallback={<TabFallback icon={AlertTriangle} label="Practitioner Complaints" />} tabName="complaints"><PractitionerComplaintsTab /></TabErrorBoundary>;
      case 'inactive-practitioners':
        return <TabErrorBoundary fallback={<TabFallback icon={Activity} label="Inactive Practitioners" />} tabName="inactive-practitioners"><InactivePractitionerTab /></TabErrorBoundary>;
      case 'financial-command':
        return <TabErrorBoundary fallback={<TabFallback icon={DollarSign} label="Financial Command" />} tabName="financial-command"><FinancialCommandCentreTab /></TabErrorBoundary>;
      case 'trust-scores':
        return <TabErrorBoundary fallback={<TabFallback icon={Shield} label="Trust Score Management" />} tabName="trust-scores"><TrustScoreManagementTab /></TabErrorBoundary>;
      case 'refunds':
        return <TabErrorBoundary fallback={<TabFallback icon={RotateCcw} label="Refund Management" />} tabName="refunds"><AdminRefundsTab /></TabErrorBoundary>;
      case 'cultural-content':
        return <TabErrorBoundary fallback={<TabFallback icon={BookOpen} label="Cultural Content" />} tabName="cultural-content"><AdminCulturalContentTab /></TabErrorBoundary>;
      case 'featured-content':
        return <TabErrorBoundary fallback={<TabFallback icon={Star} label="Featured Content" />} tabName="featured-content"><AdminFeaturedContentTab /></TabErrorBoundary>;
      case 'community':
        return <TabErrorBoundary fallback={<TabFallback icon={Award} label="Community Recognition" />} tabName="community"><AdminCommunityTab /></TabErrorBoundary>;
      case 'forum-intelligence':
        return <TabErrorBoundary fallback={<TabFallback icon={BarChart3} label="Forum Intelligence" />} tabName="forum-intelligence"><AdminForumIntelligenceTab /></TabErrorBoundary>;
      case 'integrity':
        return <TabErrorBoundary fallback={<TabFallback icon={ShieldAlert} label="Cultural Integrity" />} tabName="integrity"><AdminIntegrityTab /></TabErrorBoundary>;
      case 'campaigns':
        return <TabErrorBoundary fallback={<TabFallback icon={Mail} label="Email Campaigns" />} tabName="campaigns"><AdminCampaignsTab /></TabErrorBoundary>;
      case 'promos':
        return <TabErrorBoundary fallback={<TabFallback icon={Tag} label="Promo Codes" />} tabName="promos"><AdminPromosTab /></TabErrorBoundary>;
      case 'referrals':
        return <TabErrorBoundary fallback={<TabFallback icon={Users} label="Referral Program" />} tabName="referrals"><AdminReferralsTab /></TabErrorBoundary>;
      case 'market-intelligence':
        return <TabErrorBoundary fallback={<TabFallback icon={TrendingUp} label="Market Intelligence" />} tabName="market-intelligence"><AdminMarketIntelligenceTab /></TabErrorBoundary>;
      case 'forecasting':
        return <TabErrorBoundary fallback={<TabFallback icon={BarChart3} label="Revenue Forecasting" />} tabName="forecasting"><AdminForecastingTab /></TabErrorBoundary>;
      case 'lifecycle':
        return <TabErrorBoundary fallback={<TabFallback icon={TrendingUp} label="User Lifecycle Analytics" />} tabName="lifecycle"><AdminLifecycleTab /></TabErrorBoundary>;
      case 'security':
        return <TabErrorBoundary fallback={<TabFallback icon={Shield} label="Security & Sessions" />} tabName="security"><AdminSecurityTab /></TabErrorBoundary>;
      case 'cultural-quiz':
        return <TabErrorBoundary fallback={<TabFallback icon={BookOpen} label="Cultural Quiz" />} tabName="cultural-quiz"><AdminCulturalQuizTab /></TabErrorBoundary>;
      case 'trust-score-audit':
        return <TabErrorBoundary fallback={<TabFallback icon={Shield} label="Trust Score Audit" />} tabName="trust-score-audit"><AdminTrustScoreAuditTab /></TabErrorBoundary>;
      case 'platform-settings':
        return <TabErrorBoundary fallback={<TabFallback icon={Settings} label="Platform Settings" />} tabName="platform-settings"><AdminPlatformSettingsTab /></TabErrorBoundary>;
      case 'marketplace-admin':
        return <TabErrorBoundary fallback={<TabFallback icon={Store} label="Marketplace" />} tabName="marketplace-admin"><AdminMarketplaceTab /></TabErrorBoundary>;
      case 'academy-admin':
        return <TabErrorBoundary fallback={<TabFallback icon={BookOpen} label="Academy" />} tabName="academy-admin"><AdminAcademyTab /></TabErrorBoundary>;
      case 'compliance':
        return <TabErrorBoundary fallback={<TabFallback icon={Shield} label="Data & Compliance" />} tabName="compliance"><AdminComplianceTab /></TabErrorBoundary>;
      case 'crisis-alerts':
        return <TabErrorBoundary fallback={<TabFallback icon={AlertTriangle} label="Crisis Alerts" />} tabName="crisis-alerts"><AdminCrisisAlertsTab /></TabErrorBoundary>;
      default:
        return (
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-[1.125rem] font-[700] text-foreground">Page Not Found</h2>
            <p className="text-muted-foreground text-sm py-8">The requested section does not exist or is under construction.</p>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="px-4 py-2 bg-highlight text-white rounded-xl font-medium hover:bg-warning transition-colors"
            >
              Return to Overview
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <PromptDialog />
      <div className="max-w-[100rem] mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-[1.5rem] font-[700] text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-[0.875rem] text-muted-foreground">Platform governance and oversight</p>
          {activeTab !== 'overview' && (
            <Breadcrumb items={[
              { label: 'Admin', onClick: () => setActiveTab('overview') },
              { label: ADMIN_NAV_ITEMS.find(t => t.id === activeTab)?.label || activeTab },
            ]} />
          )}
        </div>

        {/* Impersonation Banner */}
        {currentUser?.isImpersonated && (
          <ImpersonationBanner userName={currentUser.name} onStop={() => logout()} />
        )}

        {/* Sidebar navigation + tab content */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <AdminSidebarNav activeTab={activeTab} onSelectTab={setActiveTab} />

          <div className="flex-1 min-w-0 w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-6"
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardView;