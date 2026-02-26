import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Users, Shield, CheckCircle, MessageSquare, Calendar,
    Link as LinkIcon
} from 'lucide-react';
import { StatCard, UserListItem, VerificationListItem, AdminUser, VerificationApplication } from './admin-shared-components';

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

    const statCards = [
        { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'bg-primary/20 text-primary/60 border-primary/30' },
        { label: 'Verified Babalawos', value: stats?.verifiedBabalawos || 0, icon: Shield, color: 'bg-green-500/20 text-green-300 border-green-500/30' },
        { label: 'Pending Verifications', value: stats?.pendingVerifications || 0, icon: CheckCircle, color: 'bg-highlight/20 text-highlight border-highlight/30' },
        { label: 'Active Relationships', value: stats?.activeRelationships || 0, icon: LinkIcon, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
        { label: 'Total Appointments', value: stats?.totalAppointments || 0, icon: Calendar, color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
        { label: 'Total Messages', value: stats?.totalMessages || 0, icon: MessageSquare, color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
    ];

    return (
        <>
            {/* Statistics Cards */}
            {statsLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {statCards.map((stat) => (
                        <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} color={stat.color} />
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
                    <button onClick={onNavigateToVerification} className="text-xs font-bold text-highlight hover:underline decoration-2">
                        View Full Queue
                    </button>
                </div>

                {verificationsLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="w-8 h-8 border-4 border-highlight border-t-transparent rounded-full animate-spin" />
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
                    <button onClick={onNavigateToUsers} className="text-xs font-bold text-highlight hover:underline decoration-2">
                        Manage Users
                    </button>
                </div>

                {usersLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="w-8 h-8 border-4 border-highlight border-t-transparent rounded-full animate-spin" />
                    </div>
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
};

export default AdminOverviewTab;
