import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Users, Shield, CheckCircle, MessageSquare, Calendar,
    Link as LinkIcon, Activity, Clock, Sun, Sunrise, Moon, AlertTriangle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { StatCard, UserListItem, VerificationListItem, AdminUser, VerificationApplication } from './admin-shared-components';
import { SkeletonStat, SkeletonTable } from '@/shared/components/skeleton';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { isDevModeActive } from '@/shared/utils/dev-mode';

function getGreeting(): { text: string; Icon: React.ElementType } {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', Icon: Sunrise };
    if (hour < 17) return { text: 'Good afternoon', Icon: Sun };
    return { text: 'Good evening', Icon: Moon };
}

const MorningBriefing: React.FC<{
    adminName: string;
    pendingVerifications: number;
    statsLoading: boolean;
}> = ({ adminName, pendingVerifications, statsLoading }) => {
    const { text: greeting, Icon: GreetingIcon } = getGreeting();
    const today = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

    const { data: openDisputes } = useQuery<number>({
        queryKey: ['admin-open-disputes-count'],
        queryFn: async () => {
            const res = await api.get('/admin/disputes');
            const disputes: Array<{ status: string }> = res.data?.disputes ?? res.data ?? [];
            return disputes.filter(d => d.status === 'OPEN' || d.status === 'DISPUTED').length;
        },
        enabled: !isDevModeActive(),
        staleTime: 120000,
    });

    const { data: reportedCount } = useQuery<number>({
        queryKey: ['admin-reported-content-count'],
        queryFn: async () => {
            const res = await api.get('/admin/reported-content');
            const items: unknown[] = res.data?.reports ?? res.data ?? [];
            return items.length;
        },
        enabled: !isDevModeActive(),
        staleTime: 120000,
    });

    const urgentItems = [
        pendingVerifications > 0 && { label: 'Pending verifications', count: pendingVerifications, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' },
        (openDisputes ?? 0) > 0 && { label: 'Open disputes', count: openDisputes!, color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' },
        (reportedCount ?? 0) > 0 && { label: 'Reported content', count: reportedCount!, color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20' },
    ].filter(Boolean) as Array<{ label: string; count: number; color: string }>;

    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6"
        >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <GreetingIcon size={20} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">
                            {greeting}, {adminName.split(' ')[0]}
                        </h2>
                        <p className="text-sm text-muted-foreground">{today}</p>
                    </div>
                </div>

                {!statsLoading && urgentItems.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {urgentItems.map(item => (
                            <div key={item.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${item.color}`}>
                                <AlertTriangle size={11} />
                                {item.count} {item.label}
                            </div>
                        ))}
                    </div>
                )}

                {!statsLoading && urgentItems.length === 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20">
                        <CheckCircle size={11} />
                        All clear — no urgent items
                    </div>
                )}
            </div>
        </motion.div>
    );
};

function formatRelativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

interface PlatformStats {
    totalUsers: number;
    verifiedBabalawos: number;
    pendingVerifications: number;
    activeRelationships: number;
    totalAppointments: number;
    totalMessages: number;
}

interface AdminOverviewTabProps {
    stats: PlatformStats | undefined;
    statsLoading: boolean;
    users: AdminUser[];
    usersLoading: boolean;
    verifications: VerificationApplication[];
    verificationsLoading: boolean;
    onNavigateToVerification: () => void;
    onNavigateToUsers: () => void;
    onImpersonate: (userId: string) => void;
}

const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
    stats,
    statsLoading,
    users,
    usersLoading,
    verifications,
    verificationsLoading,
    onNavigateToVerification,
    onNavigateToUsers,
    onImpersonate,
}) => {
    const [showAllVerifications, setShowAllVerifications] = useState(false);
    const [showAllUsers, setShowAllUsers] = useState(false);
    const { user } = useAuth();

    // Fetch recent audit logs for SUPER admins
    const { data: auditLogs, isLoading: auditLoading } = useQuery<Array<{
        id: string;
        userId: string;
        action: string;
        resourceType: string;
        resourceId?: string;
        createdAt: string;
    }>>({
        queryKey: ['admin-audit-logs-recent'],
        queryFn: async () => {
            const res = await api.get('/admin/audit-logs', { params: { limit: 5 } });
            return res.data;
        },
        enabled: user?.adminSubRole === 'SUPER' && !isDevModeActive(),
        staleTime: 60000,
    });

    const statCards = [
        { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, color: 'text-primary border-primary/30' },
        { label: 'Verified Babalawos', value: stats?.verifiedBabalawos ?? 0, icon: Shield, color: 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' },
        { label: 'Pending Verifications', value: stats?.pendingVerifications ?? 0, icon: CheckCircle, color: 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
        { label: 'Active Relationships', value: stats?.activeRelationships ?? 0, icon: LinkIcon, color: 'text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
        { label: 'Total Appointments', value: stats?.totalAppointments ?? 0, icon: Calendar, color: 'text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800' },
        { label: 'Total Messages', value: stats?.totalMessages ?? 0, icon: MessageSquare, color: 'text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800' },
    ];

    const adminName = user?.name ?? user?.email ?? 'Admin';

    return (
        <>
            {/* Morning Briefing */}
            <MorningBriefing
                adminName={adminName}
                pendingVerifications={stats?.pendingVerifications ?? 0}
                statsLoading={statsLoading}
            />

            {/* Statistics Cards */}
            {statsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => <SkeletonStat key={i} />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {statCards.map((stat) => (
                        <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} color={stat.color} />
                    ))}
                </div>
            )}

            {/* Recent Admin Activity (SUPER admin only) */}
            {user?.adminSubRole === 'SUPER' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-card rounded-2xl p-6 border border-border space-y-4 shadow-sm"
                >
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Activity size={20} className="text-highlight" />
                        Recent Admin Activity
                    </h2>

                    {auditLoading ? (
                        <SkeletonTable rows={3} />
                    ) : !auditLogs?.length ? (
                        <p className="text-muted-foreground text-center py-6">No recent admin activity.</p>
                    ) : (
                        <div className="space-y-2">
                            {auditLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/60"
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                        <Activity size={14} className="text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {log.action.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {log.resourceType}{log.resourceId ? ` · ${log.resourceId.slice(0, 8)}…` : ''}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                                        <Clock size={12} />
                                        {formatRelativeTime(log.createdAt)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Pending Verifications */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-2xl p-6 border border-border space-y-6 shadow-sm"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Shield size={20} className="text-highlight" />
                        Verification Queue ({verifications.length})
                    </h2>
                    <button onClick={onNavigateToVerification} className="text-xs font-bold text-highlight hover:underline decoration-2">
                        View Full Queue
                    </button>
                </div>

                {verificationsLoading ? (
                    <SkeletonTable rows={3} />
                ) : verifications.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No pending verifications.</p>
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
                                    className="text-highlight hover:text-yellow-600 dark:text-yellow-400 text-xs font-bold uppercase tracking-widest bg-muted px-4 py-2 rounded-full border border-border hover:border-highlight/30 transition-all"
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
                className="bg-card rounded-2xl p-6 border border-border space-y-6 shadow-sm"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Users size={20} className="text-highlight" />
                        Recent User Activity ({users.length})
                    </h2>
                    <button onClick={onNavigateToUsers} className="text-xs font-bold text-highlight hover:underline decoration-2">
                        Manage Users
                    </button>
                </div>

                {usersLoading ? (
                    <SkeletonTable rows={5} />
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence>
                            {(showAllUsers ? users : users.slice(0, 10)).map((user) => (
                                <UserListItem key={user.id} user={user} onImpersonate={onImpersonate} />
                            ))}
                        </AnimatePresence>
                        {users.length > 10 && (
                            <div className="text-center pt-4">
                                <button
                                    onClick={() => setShowAllUsers(!showAllUsers)}
                                    className="text-highlight hover:text-yellow-600 dark:text-yellow-400 text-xs font-bold uppercase tracking-widest bg-muted px-4 py-2 rounded-full border border-border hover:border-highlight/30 transition-all"
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
};

export default AdminOverviewTab;
