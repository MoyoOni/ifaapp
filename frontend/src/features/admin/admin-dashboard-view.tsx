import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Shield, CheckCircle, MessageSquare, Calendar,
  Link as LinkIcon, AlertTriangle, DollarSign, BarChart3,
  Building2, Store, Activity, LogIn, XCircle
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import { VerificationTier } from '@common';
import api from '@/lib/api';
import VerificationBadge from '@/shared/components/verification-badge';
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
import { logger } from '@/shared/utils/logger';
import { getDemoAdminStats, getAllDemoUsers, getDemoVerifications } from '@/demo';

interface PlatformStats {
  totalUsers: number;
  verifiedBabalawos: number;
  pendingVerifications: number;
  activeRelationships: number;
  totalAppointments: number;
  totalMessages: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  verified: boolean;
  hasOnboarded: boolean;
  createdAt: string;
  culturalLevel?: string;
}

interface VerificationApplication {
  id: string;
  userId: string;
  currentStage: string;
  tier?: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  history: Array<{
    stage: string;
    status: string;
    timestamp: number;
  }>;
}

type AdminTab = 'overview' | 'verification' | 'temples' | 'vendors' | 'disputes' | 'withdrawals' | 'analytics' | 'fraud' | 'content' | 'users' | 'circles' | 'quality' | 'health';

// Internal components for better organization and performance
const StatCard: React.FC<{
  label: string;
  value: number;
  icon: any;
  color: string;
}> = ({ label, value, icon: Icon, color }) => (
  <motion.div
    whileHover={{ scale: 1.02, translateY: -5 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white/5 backdrop-blur-sm rounded-2xl p-6 border ${color} shadow-lg transition-shadow hover:shadow-xl`}
  >
    <div className="flex items-center justify-between">
      <div className="p-3 rounded-xl bg-white/10">
        <Icon size={24} className="opacity-90" />
      </div>
      <span className="text-3xl font-extrabold tracking-tight">{value.toLocaleString()}</span>
    </div>
    <p className="text-sm font-bold text-stone-400 mt-4 uppercase tracking-widest">{label}</p>
  </motion.div>
);

import { MaskedValue } from '@/shared/components';

const UserListItem: React.FC<{ user: User; onImpersonate?: (userId: string) => void }> = ({ user, onImpersonate }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    whileHover={{ x: 5 }}
    className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10 hover:border-highlight/50 transition-all group"
  >
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-highlight/20 flex items-center justify-center text-highlight font-bold">
        {user.name.charAt(0)}
      </div>
      <div>
        <p className="font-bold text-white group-hover:text-highlight transition-colors">{user.name}</p>
        <MaskedValue
          value={user.email}
          entityType="USER"
          entityId={user.id}
          label="Email"
          className="text-stone-400 group-hover:text-stone-300"
        />
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 uppercase tracking-tighter">{user.role}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter ${user.verified ? 'bg-green-500/20 text-green-400' : 'bg-stone-500/20 text-stone-400'}`}>
            {user.verified ? 'Verified' : 'Pending'}
          </span>
        </div>
      </div>
    </div>
    <div className="text-right">
      <p className="text-xs text-stone-500 font-medium">Joined</p>
      <p className="text-xs text-white/50">{new Date(user.createdAt).toLocaleDateString()}</p>
      {onImpersonate && (
        <button
          onClick={() => onImpersonate(user.id)}
          className="mt-2 p-1.5 rounded-lg bg-white/10 hover:bg-highlight/20 text-stone-400 hover:text-highlight transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ml-auto"
          title="Impersonate User"
        >
          <LogIn size={14} />
          Impersonate
        </button>
      )}
    </div>
  </motion.div>
);

const VerificationListItem: React.FC<{ app: VerificationApplication }> = ({ app }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    whileHover={{ x: 5 }}
    className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-highlight/50 transition-all group"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
          <Shield size={20} className="text-highlight" />
        </div>
        <div>
          <h3 className="font-bold text-white group-hover:text-highlight transition-colors">{app.user.name}</h3>
          <p className="text-xs text-muted font-medium">{app.user.email}</p>
        </div>
      </div>
      <div className="text-right space-y-1">
        <VerificationBadge
          verified={false}
          tier={app.tier as VerificationTier}
        />
        <p className="text-[10px] text-muted font-bold uppercase tracking-wider opacity-60">Stage: {app.currentStage}</p>
      </div>
    </div>
  </motion.div>
);

/**
 * Admin Dashboard View
 * Platform governance and oversight tools
 * NOTE: Only accessible to ADMIN role users
 */
interface AdminDashboardViewProps {
  initialTab?: AdminTab;
}

const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ initialTab }) => {
  const { user: currentUser, impersonate, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab || 'overview');
  const [showAllVerifications, setShowAllVerifications] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);

  const handleImpersonate = async (userId: string) => {
    const reason = window.prompt('Please provide a reason for impersonating this user (Audited):');
    if (!reason) return;

    try {
      await impersonate(userId, reason);
    } catch (error: any) {
      alert(`Impersonation failed: ${error.message}`);
    }
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Fetch platform statistics
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

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
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

  // Fetch pending verification applications
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

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    {
      label: 'Verified Babalawos',
      value: stats?.verifiedBabalawos || 0,
      icon: Shield,
      color: 'bg-green-500/20 text-green-300 border-green-500/30',
    },
    {
      label: 'Pending Verifications',
      value: stats?.pendingVerifications || 0,
      icon: CheckCircle,
      color: 'bg-highlight/20 text-highlight border-highlight/30',
    },
    {
      label: 'Active Relationships',
      value: stats?.activeRelationships || 0,
      icon: LinkIcon,
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    {
      label: 'Total Appointments',
      value: stats?.totalAppointments || 0,
      icon: Calendar,
      color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    },
    {
      label: 'Total Messages',
      value: stats?.totalMessages || 0,
      icon: MessageSquare,
      color: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    },
  ];

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

  // Render component based on active tab with fallback for missing components
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            {/* Statistics Cards */}
            {statsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((stat) => (
                  <StatCard
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    icon={stat.icon}
                    color={stat.color}
                  />
                ))}
              </div>
            )}

            {/* Pending Verifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 space-y-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Shield size={20} className="text-highlight" />
                  Verification Queue ({verifications.length})
                </h2>
                <button
                  onClick={() => setActiveTab('verification')}
                  className="text-xs font-bold text-highlight hover:underline decoration-2"
                >
                  View Full Queue
                </button>
              </div>

              {verificationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : verifications.length === 0 ? (
                <p className="text-muted text-center py-8">No pending verifications.</p>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {(showAllVerifications ? verifications : verifications.slice(0, 5)).map((app) => (
                      <VerificationListItem key={app.id} app={app} />
                    ))}
                  </AnimatePresence>

                  {verifications.length > 5 && (
                    <div className="text-center pt-2">
                      <button
                        onClick={() => setShowAllVerifications(!showAllVerifications)}
                        className="text-highlight hover:text-yellow-600 text-xs font-bold uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5 hover:border-highlight/30 transition-all"
                      >
                        {showAllVerifications ? 'Show Less' : `+${verifications.length - 5} More Applications`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Recent Users */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 space-y-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users size={20} className="text-highlight" />
                  Recent User Activity ({users.length})
                </h2>
                <button
                  onClick={() => setActiveTab('users')}
                  className="text-xs font-bold text-highlight hover:underline decoration-2"
                >
                  Manage Users
                </button>
              </div>

              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {(showAllUsers ? users : users.slice(0, 10)).map((user) => (
                      <UserListItem key={user.id} user={user} onImpersonate={handleImpersonate} />
                    ))}
                  </AnimatePresence>

                  {users.length > 10 && (
                    <div className="text-center pt-4">
                      <button
                        onClick={() => setShowAllUsers(!showAllUsers)}
                        className="text-highlight hover:text-yellow-600 text-xs font-bold uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5 hover:border-highlight/30 transition-all"
                      >
                        {showAllUsers ? 'Show Less' : `+${users.length - 10} More Users`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        );
      case 'verification':
        return <VerificationQueueView />;
      case 'users':
        return (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users size={24} />
              User Management
            </h2>
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : users.length === 0 ? (
              <p className="text-muted text-center py-8">No users found.</p>
            ) : (
              <div className="space-y-2">
                {(showAllUsers ? users : users.slice(0, 15)).map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white/5 rounded-xl p-4 border border-white/10 hover:border-highlight transition-all"
                  >
                    <div>
                      <p className="font-bold text-white">{user.name}</p>
                      <p className="text-sm text-muted">{user.email}</p>
                      <p className="text-xs text-muted mt-1">
                        {user.role} • {user.verified ? 'Verified' : 'Unverified'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => handleImpersonate(user.id)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-highlight/20 text-stone-400 hover:text-highlight transition-all"
                        title="Impersonate User"
                      >
                        <LogIn size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {users.length > 15 && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() => setShowAllUsers(!showAllUsers)}
                      className="text-highlight hover:text-yellow-600 text-sm font-bold uppercase tracking-wide"
                    >
                      {showAllUsers ? 'Show Less' : 'Show All Users'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case 'temples':
        try {
          return <TempleManagementView />;
        } catch (e) {
          return (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Building2 size={24} />
                Temple Management
              </h2>
              <p className="text-muted py-8 text-center">Temple management feature coming soon</p>
            </div>
          );
        }
      case 'vendors':
        try {
          return <VendorReviewView />;
        } catch (e) {
          return (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Store size={24} />
                Vendor Review
              </h2>
              <p className="text-muted py-8 text-center">Vendor review feature coming soon</p>
            </div>
          );
        }
      case 'circles':
        try {
          return <CircleManagementView />;
        } catch (e) {
          return (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users size={24} />
                Circle Management
              </h2>
              <p className="text-muted py-8 text-center">Circle management feature coming soon</p>
            </div>
          );
        }
      case 'disputes':
        try {
          return <DisputeCenterView />;
        } catch (e) {
          return (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <AlertTriangle size={24} />
                Dispute Center
              </h2>
              <p className="text-muted py-8 text-center">Dispute center feature coming soon</p>
            </div>
          );
        }
      case 'withdrawals':
        try {
          return <PayoutApprovalsView />;
        } catch (e) {
          return (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <DollarSign size={24} />
                Payout Approvals
              </h2>
              <p className="text-muted py-8 text-center">Payout approvals feature coming soon</p>
            </div>
          );
        }
      case 'content':
        try {
          return <ReportedContentView />;
        } catch (e) {
          return (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <MessageSquare size={24} />
                Content Moderation
              </h2>
              <p className="text-muted py-8 text-center">Content moderation feature coming soon</p>
            </div>
          );
        }
      case 'analytics':
        try {
          return <AnalyticsDashboardView />;
        } catch (e) {
          return (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <BarChart3 size={24} />
                Analytics
              </h2>
              <p className="text-muted py-8 text-center">Analytics dashboard coming soon</p>
            </div>
          );
        }
      case 'quality':
        return <QualityAssuranceView />;
      case 'health':
        return <PlatformHealthView />;
      case 'fraud':
        try {
          return <FraudAlertsView />;
        } catch (e) {
          return (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <AlertTriangle size={24} />
                Fraud Alerts
              </h2>
              <p className="text-muted py-8 text-center">Fraud alerts feature coming soon</p>
            </div>
          );
        }
      default:
        // Fallback for any undefined tabs
        return (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white">Page Not Found</h2>
            <p className="text-muted py-8">The requested section does not exist or is under construction.</p>
            <button
              onClick={() => setActiveTab('overview')}
              className="px-4 py-2 bg-highlight text-white rounded-xl font-medium hover:bg-yellow-600 transition-colors"
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
          <h1 className="text-5xl font-bold brand-font text-highlight">Admin Dashboard</h1>
          <p className="text-stone-400 text-lg">Platform governance and oversight</p>
        </div>

        {/* Impersonation Banner */}
        {currentUser?.isImpersonated && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/20 border border-red-500/50 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md"
          >
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="animate-pulse" />
              <div>
                <p className="font-bold">IMPERSONATION MODE ACTIVE</p>
                <p className="text-xs opacity-80">You are currently viewing the platform as <strong>{currentUser.name}</strong>. All actions are audited.</p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors flex items-center gap-2"
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
                className={`px-4 py-3 flex items-center gap-2 font-medium transition-colors border-b-2 ${activeTab === tab.id
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