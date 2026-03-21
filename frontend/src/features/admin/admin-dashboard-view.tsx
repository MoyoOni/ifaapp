import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Shield, MessageSquare,
  AlertTriangle, DollarSign, BarChart3,
  Building2, Store, Activity, XCircle
} from 'lucide-react';
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

type AdminTab =
  | 'overview' | 'verification' | 'temples' | 'vendors'
  | 'disputes' | 'withdrawals' | 'analytics' | 'fraud'
  | 'content' | 'users' | 'circles' | 'quality' | 'health'
  | 'admin-management' | 'payment-verification';

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

  const tabs = [
    { id: 'overview' as AdminTab, label: 'Overview', icon: BarChart3 },
    { id: 'verification' as AdminTab, label: 'Verification Queue', icon: Shield },
    { id: 'users' as AdminTab, label: 'User Management', icon: Users },
    { id: 'temples' as AdminTab, label: 'Temple Management', icon: Building2 },
    { id: 'vendors' as AdminTab, label: 'Vendor Review', icon: Store },
    { id: 'circles' as AdminTab, label: 'Circle Management', icon: Users },
    { id: 'disputes' as AdminTab, label: 'Dispute Center', icon: AlertTriangle },
    { id: 'withdrawals' as AdminTab, label: 'Payout Approvals', icon: DollarSign },
    { id: 'content' as AdminTab, label: 'Content Moderation', icon: MessageSquare },
    { id: 'quality' as AdminTab, label: 'Quality Assurance', icon: BarChart3 },
    { id: 'health' as AdminTab, label: 'Platform Health', icon: Activity },
    { id: 'analytics' as AdminTab, label: 'Analytics', icon: BarChart3 },
    { id: 'fraud' as AdminTab, label: 'Fraud Alerts', icon: AlertTriangle },
    { id: 'admin-management' as AdminTab, label: 'Admin Management', icon: Shield },
    { id: 'payment-verification' as AdminTab, label: 'Payment Verification', icon: DollarSign },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
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
      default:
        return (
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-[1.125rem] font-[700] text-foreground">Page Not Found</h2>
            <p className="text-muted-foreground text-sm py-8">The requested section does not exist or is under construction.</p>
            <button
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-[1.5rem] font-[700] text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-[0.875rem] text-muted-foreground">Platform governance and oversight</p>
          {activeTab !== 'overview' && (
            <Breadcrumb items={[
              { label: 'Admin', onClick: () => setActiveTab('overview') },
              { label: tabs.find(t => t.id === activeTab)?.label || activeTab },
            ]} />
          )}
        </div>

        {/* Impersonation Banner */}
        {currentUser?.isImpersonated && (
          <ImpersonationBanner userName={currentUser.name} onStop={() => logout()} />
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 flex items-center gap-2 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id
                    ? 'border-highlight text-highlight'
                    : 'border-transparent text-foreground/60 hover:text-foreground'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
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
  );
};

export default AdminDashboardView;