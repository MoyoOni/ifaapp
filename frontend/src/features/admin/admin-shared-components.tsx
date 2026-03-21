import React from 'react';
import { motion } from 'framer-motion';
import { Shield, LogIn } from 'lucide-react';
import { VerificationTier } from '@common';
import VerificationBadge from '@/shared/components/verification-badge';
import { MaskedValue } from '@/shared/components';

export interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: string;
    verified: boolean;
    hasOnboarded: boolean;
    createdAt: string;
    culturalLevel?: string;
}

export interface VerificationApplication {
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

export const StatCard: React.FC<{
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
}> = ({ label, value, icon: Icon, color }) => (
    <motion.div
        whileHover={{ scale: 1.02, translateY: -5 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-card rounded-2xl p-6 border shadow-sm hover:shadow-md transition-shadow ${color}`}
    >
        <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-muted">
                <Icon size={24} className="opacity-80" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight">{value.toLocaleString()}</span>
        </div>
        <p className="text-sm font-bold text-muted-foreground mt-4 uppercase tracking-widest">{label}</p>
    </motion.div>
);

export const UserListItem: React.FC<{
    user: AdminUser;
    onImpersonate?: (userId: string) => void;
}> = ({ user, onImpersonate }) => (
    <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: 5 }}
        className="flex items-center justify-between bg-muted/50 rounded-xl p-4 border border-border hover:border-highlight/50 transition-all group"
    >
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-highlight/20 flex items-center justify-center text-highlight font-bold">
                {user.name.charAt(0)}
            </div>
            <div>
                <p className="font-bold text-foreground group-hover:text-highlight transition-colors">{user.name}</p>
                <MaskedValue
                    value={user.email}
                    entityType="USER"
                    entityId={user.id}
                    label="Email"
                    className="text-muted-foreground group-hover:text-foreground"
                />
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-foreground uppercase tracking-tighter">{user.role}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter ${user.verified ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                        {user.verified ? 'Verified' : 'Pending'}
                    </span>
                </div>
            </div>
        </div>
        <div className="text-right">
            <p className="text-xs text-muted-foreground font-medium">Joined</p>
            <p className="text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</p>
            {onImpersonate && (
                <button
                    onClick={() => onImpersonate(user.id)}
                    className="mt-2 p-1.5 rounded-lg bg-muted hover:bg-highlight/20 text-muted-foreground hover:text-highlight transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ml-auto"
                    title="Impersonate User"
                >
                    <LogIn size={14} />
                    Impersonate
                </button>
            )}
        </div>
    </motion.div>
);

export const VerificationListItem: React.FC<{ app: VerificationApplication }> = ({ app }) => (
    <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: 5 }}
        className="bg-muted/50 rounded-xl p-4 border border-border hover:border-highlight/50 transition-all group"
    >
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Shield size={20} className="text-highlight" />
                </div>
                <div>
                    <h3 className="font-bold text-foreground group-hover:text-highlight transition-colors">{app.user.name}</h3>
                    <p className="text-xs text-muted-foreground font-medium">{app.user.email}</p>
                </div>
            </div>
            <div className="text-right space-y-1">
                <VerificationBadge verified={false} tier={app.tier as VerificationTier} />
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Stage: {app.currentStage}</p>
            </div>
        </div>
    </motion.div>
);
