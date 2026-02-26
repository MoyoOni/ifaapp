import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Shield, MessageSquare, Calendar,
  AlertTriangle, DollarSign, BarChart3,
  Building2, Store, Activity, LogIn, Link as LinkIcon, CheckCircle, XCircle
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
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
import { AdminUser, VerificationApplication } from './admin-shared-components';
import { logger } from '@/shared/utils/logger';
import { getDemoAdminStats, getAllDemoUsers, getDemoVerifications } from '@/demo';
import { useToast } from '@/components/common/ToastProvider';

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
  | 'content' | 'users' | 'circles' | 'quality' | 'health';

interface AdminDashboardViewProps {
  initialTab?: AdminTab;
}

/** Fallback wrapper for sub-views that may fail to render */
const TabFallback: React.FC<{ icon: React.ElementType; label: string }> = ({ icon: Icon, label }) => (
  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
    <h2 className="text-[1.125rem] font-[700] text-white flex items-center gap-2">
      <Icon size={24} /> {label}
    </h2>
    <p className="text-muted text-sm py-8 text-center">{label} feature coming soon</p>
  </div>
);

/**
 * Admin Dashboard View
 * Platform governance and oversight tools
 * NOTE: Only accessible to ADMIN role users
 */
const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ initialTab }) => {
  const { user: currentUser, impersonate, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab || 'overview');

  const { showToast } = useToast();

  const impersonateUser = async (id: string, name: string) => {
    try {
      const reason = window.prompt('Please provide a reason for impersonating this user (Audited):');
      if (!reason) return;
      await impersonate(id, reason);
      showToast(`Impersonating ${name}`, 'success');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Unknown error';
      showToast(`Impersonation failed: ${msg}`, 'error');
    }
  };

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const { data: stats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/stats');
        return response.data;
      } catch (e) {
        logger.warn('Using demo admin stats');
        return getDemoAdminStats();
      }
    },
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/users');
        return response.data;
      } catch (e) {
        logger.warn('Using demo users');
        return getAllDemoUsers();
      }
    },
  });

  const { data: verifications = [], isLoading: verificationsLoading } = useQuery<VerificationApplication[]>({
    queryKey: ['admin-verifications'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/verification-applications');
        return response.data;
      } catch (e) {
        logger.warn('Using demo verifications');
        return getDemoVerifications();
      }
    },
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
            onImpersonate={impersonateUser}
          />
        );
      case 'verification': return <VerificationQueueView />;
      case 'users':
        return (
          <AdminUserManagementTab
            users={users}
            usersLoading={usersLoading}
            onImpersonate={impersonateUser}
          />
        );
      case 'temples':
        try { return <TempleManagementView />; } catch { return <TabFallback icon={Building2} label="Temple Management" />; }
      case 'vendors':
        try { return <VendorReviewView />; } catch { return <TabFallback icon={Store} label="Vendor Review" />; }
      case 'circles':
        try { return <CircleManagementView />; } catch { return <TabFallback icon={Users} label="Circle Management" />; }
      case 'disputes':
        try { return <DisputeCenterView />; } catch { return <TabFallback icon={AlertTriangle} label="Dispute Center" />; }
      case 'withdrawals':
        try { return <PayoutApprovalsView />; } catch { return <TabFallback icon={DollarSign} label="Payout Approvals" />; }
      case 'content':
        try { return <ReportedContentView />; } catch { return <TabFallback icon={MessageSquare} label="Content Moderation" />; }
      case 'analytics':
        try { return <AnalyticsDashboardView />; } catch { return <TabFallback icon={BarChart3} label="Analytics" />; }
      case 'quality': return <QualityAssuranceView />;
      case 'health': return <PlatformHealthView />;
      case 'fraud':
        try { return <FraudAlertsView />; } catch { return <TabFallback icon={AlertTriangle} label="Fraud Alerts" />; }
      default:
        return (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-[1.125rem] font-[700] text-white">Page Not Found</h2>
            <p className="text-muted text-sm py-8">The requested section does not exist or is under construction.</p>
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
    <div className="min-h-screen bg-background text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-[1.5rem] font-[700] text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-[0.875rem] text-muted-foreground">Platform governance and oversight</p>
        </div>

        {/* Impersonation Banner */}
        {currentUser?.isImpersonated && (
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
                  You are currently viewing the platform as <strong>{currentUser.name}</strong>. All actions are audited.
                </p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="px-4 py-2 bg-destructive text-white rounded-xl font-bold text-sm hover:bg-error transition-colors flex items-center gap-2"
            >
              <XCircle size={16} />
              Stop Impersonating
            </button>
          </motion.div>
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
                    : 'border-transparent text-muted hover:text-white'
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