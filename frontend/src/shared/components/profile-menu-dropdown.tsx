import React from 'react';
import { motion } from 'framer-motion';
import { User, Settings, HelpCircle, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { User as UserType } from '@common';

interface ProfileMenuDropdownProps {
    user: UserType | null;
    onNavigate: (path: string) => void;
    onLogout: () => void;
    roleDisplayName: string;
    roleBadgeColor: string;
    className?: string;
    showUserInfo?: boolean;
}

export const ProfileMenuDropdown: React.FC<ProfileMenuDropdownProps> = ({
    user,
    onNavigate,
    onLogout,
    roleDisplayName,
    roleBadgeColor,
    className,
    showUserInfo = false
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "absolute bottom-full left-0 w-full mb-2 bg-popover rounded-2xl shadow-elevation-2 border border-border overflow-hidden p-2 z-[60]",
                className
            )}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="space-y-1">
                {showUserInfo && (
                    <div className="px-3 py-2 border-b border-border mb-1">
                        <p className="text-sm font-bold text-foreground truncate">{user?.name || 'User'}</p>
                        <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide inline-block mt-1",
                            roleBadgeColor
                        )}>
                            {roleDisplayName}
                        </span>
                    </div>
                )}

                <button
                    onClick={() => onNavigate('/profile')}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-secondary/10 text-sm font-medium text-foreground transition-colors"
                >
                    <User size={16} className="text-highlight" />
                    My Profile
                </button>

                <div className="h-px bg-border my-1" />

                <button
                    onClick={() => onNavigate('/settings')}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-secondary/10 text-sm font-medium text-foreground transition-colors"
                >
                    <Settings size={16} className="text-muted-foreground" />
                    Settings
                </button>

                <button
                    onClick={() => onNavigate('/help')}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-secondary/10 text-sm font-medium text-foreground transition-colors"
                >
                    <HelpCircle size={16} className="text-muted-foreground" />
                    Help & Support
                </button>

                <div className="h-px bg-border my-1" />

                <button
                    onClick={onLogout}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-error/10 text-error transition-colors"
                >
                    <LogOut size={16} />
                    Log Out
                </button>
            </div>
        </motion.div>
    );
};
