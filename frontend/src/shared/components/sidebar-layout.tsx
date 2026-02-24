import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu,
    X,
    User,
    LogOut,
    Wallet,
    Bell,
    Search,
    ChevronDown,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    Settings,
    HelpCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/use-auth';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from './language-switcher';
import { ModeToggle } from './mode-toggle';
import NotificationDropdown from './notification-dropdown';
import api from '@/lib/api';
import { getNavItemsForRole, getRoleDisplayName, getRoleBadgeColor, type NavItem } from '../config/navigation';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarLayoutProps {
    children: React.ReactNode;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
    children
}) => {
    console.log('[SidebarLayout] Render');
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

    // Fetch unread notification count for bell badge
    const { data: unreadCount } = useQuery<{ count: number }>({
        queryKey: ['notifications-unread-count', user?.id],
        queryFn: async () => {
            const response = await api.get('/notifications/unread-count');
            return response.data;
        },
        enabled: !!user,
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    // Get role-based navigation items
    const allNavItems = getNavItemsForRole(user?.role);
    const navItems = allNavItems.filter(item => {
        if (user?.role !== 'ADMIN' || !item.requiredAdminSubRoles) return true;
        if (user?.adminSubRole === 'SUPER') return true;
        return item.requiredAdminSubRoles.includes(user?.adminSubRole as any);
    });

    const roleDisplayName = getRoleDisplayName(user?.role);
    const roleBadgeColor = getRoleBadgeColor(user?.role);

    // Persist sidebar state
    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved !== null) {
            setIsSidebarCollapsed(saved === 'true');
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !isSidebarCollapsed;
        setIsSidebarCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', String(newState));
    };

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const handleNavClick = (path: string) => {
        navigate(path);
        setIsMobileMenuOpen(false);
        setIsProfileMenuOpen(false); // Close profile menu when navigating
    };

    // Close profile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isProfileMenuOpen) {
                const target = event.target as HTMLElement;
                if (!target.closest('[data-profile-menu]')) {
                    setIsProfileMenuOpen(false);
                }
            }
        };

        if (isProfileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isProfileMenuOpen]);

    // Show expanded sidebar if hovering over collapsed sidebar
    const showExpanded = !isSidebarCollapsed || isHovering;

    const NavLink = ({ item, isMobile = false, showLabel = true }: { item: NavItem, isMobile?: boolean, showLabel?: boolean }) => {
        const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);

        return (
            <button
                onClick={() => handleNavClick(item.path)}
                className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group w-full text-left relative",
                    isActive
                        ? "bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5"
                        : "text-muted-foreground hover:bg-secondary/10 hover:text-foreground",
                    isMobile && "py-4 text-lg",
                    !showLabel && "justify-center px-3"
                )}
                title={!showLabel ? item.label : undefined}
            >
                <item.icon
                    size={isMobile ? 24 : 20}
                    className={cn(
                        "transition-colors flex-shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                />
                {showLabel && (
                    <>
                        <span className="truncate">{item.label}</span>
                        {isActive && (
                            <motion.div
                                layoutId="activeIndicator"
                                className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                            />
                        )}
                    </>
                )}
                {isActive && !showLabel && (
                    <motion.div
                        layoutId="activeIndicatorCollapsed"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-primary"
                    />
                )}
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-background flex font-sans text-foreground">

            {/* Desktop Sidebar (Left) - Collapsible */}
            <aside
                className={cn(
                    "hidden lg:flex flex-col bg-card border-r border-border h-screen sticky top-0 shadow-xl shadow-border/50 z-40 transition-all duration-300 ease-out",
                    showExpanded ? "w-72" : "w-20"
                )}
                onMouseEnter={() => !isSidebarCollapsed && setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                {/* Brand Header */}
                <div className={cn("p-6 pb-4 border-b border-border/50", !showExpanded && "px-3")}>
                    <div className="flex items-center gap-3 justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl brand-font shadow-lg shadow-primary/20 flex-shrink-0">
                                IA
                            </div>
                            <AnimatePresence mode="wait">
                                {showExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <h1 className="text-xl font-bold brand-font text-foreground tracking-tight whitespace-nowrap">
                                            Ìlú <span className="text-primary">Àṣẹ</span>
                                        </h1>
                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                                            Digital Heritage Sanctuary
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {showExpanded && (
                            <button
                                onClick={toggleSidebar}
                                className="p-1.5 rounded-lg hover:bg-secondary/10 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                                title="Collapse sidebar"
                            >
                                <ChevronLeft size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Navigation Items */}
                <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <NavLink key={item.id} item={item} showLabel={showExpanded} />
                    ))}
                </div>

                {/* Collapse/Expand Button (when collapsed) */}
                {!showExpanded && (
                    <div className="p-3 border-t border-border/50">
                        <button
                            onClick={toggleSidebar}
                            className="w-full p-2 rounded-lg hover:bg-secondary/10 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                            title="Expand sidebar"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                )}

                {/* User Profile Hub (Bottom Fixed) */}
                {showExpanded && (
                    <div className="p-4 border-t border-border/50 bg-card/50" data-profile-menu>
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                className={cn(
                                    "flex items-center gap-3 w-full p-3 rounded-xl transition-all border",
                                    isProfileMenuOpen
                                        ? "bg-background border-primary/30 shadow-md"
                                        : "bg-transparent border-transparent hover:bg-background hover:shadow-sm"
                                )}
                            >
                                <div className="w-10 h-10 rounded-full bg-secondary/20 overflow-hidden border-2 border-primary/20 shadow-sm flex-shrink-0">
                                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                                        {user?.name?.charAt(0) || 'U'}
                                    </div>
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <p className="text-sm font-bold truncate text-foreground">{user?.name || 'User'}</p>
                                    <span className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide inline-block mt-1",
                                        roleBadgeColor
                                    )}>
                                        {roleDisplayName}
                                    </span>
                                </div>
                                <ChevronDown size={16} className={cn("text-muted-foreground transition-transform flex-shrink-0", isProfileMenuOpen && "rotate-180")} />
                            </button>

                            {/* Profile Dropdown Menu */}
                            <AnimatePresence>
                                {isProfileMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute bottom-full left-0 w-full mb-2 bg-popover rounded-2xl shadow-elevation-2 border border-border overflow-hidden p-2 z-[60]"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="space-y-1">
                                            <button
                                                onClick={() => handleNavClick('/profile')}
                                                className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-secondary/10 text-sm font-medium text-foreground transition-colors"
                                            >
                                                <User size={16} className="text-highlight" />
                                                My Profile
                                            </button>
                                            <button
                                                onClick={() => handleNavClick('/messages')}
                                                className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-secondary/10 text-sm font-medium text-foreground transition-colors"
                                            >
                                                <MessageSquare size={16} className="text-primary" />
                                                Messages
                                                <span className="ml-auto bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">3</span>
                                            </button>
                                            <button
                                                onClick={() => handleNavClick('/wallet')}
                                                className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-secondary/10 text-sm font-medium text-foreground transition-colors"
                                            >
                                                <Wallet size={16} className="text-secondary" />
                                                Wallet
                                            </button>
                                            <div className="h-px bg-border my-1" />
                                            <button
                                                onClick={() => handleNavClick('/settings')}
                                                className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-secondary/10 text-sm font-medium text-foreground transition-colors"
                                            >
                                                <Settings size={16} className="text-muted-foreground" />
                                                Settings
                                            </button>
                                            <button
                                                onClick={() => handleNavClick('/help')}
                                                className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-secondary/10 text-sm font-medium text-foreground transition-colors"
                                            >
                                                <HelpCircle size={16} className="text-muted-foreground" />
                                                Help & Support
                                            </button>
                                            <div className="h-px bg-border my-1" />
                                            <button
                                                onClick={logout}
                                                className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-error/10 text-error transition-colors"
                                            >
                                                <LogOut size={16} />
                                                Log Out
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}

                {/* Collapsed User Avatar */}
                {!showExpanded && (
                    <div className="p-3 border-t border-border/50" data-profile-menu>
                        <button
                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                            className="w-full p-2 rounded-lg hover:bg-secondary/10 transition-colors flex items-center justify-center relative"
                            title={user?.name || 'User'}
                        >
                            <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden border-2 border-primary/20 shadow-sm">
                                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                            </div>
                            {isProfileMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-popover rounded-2xl shadow-elevation-2 border border-border overflow-hidden p-2 z-[60]"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="space-y-1">
                                        <div className="px-3 py-2 border-b border-border">
                                            <p className="text-sm font-bold text-foreground">{user?.name || 'User'}</p>
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide inline-block mt-1", roleBadgeColor)}>
                                                {roleDisplayName}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleNavClick('/profile')}
                                            className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-secondary/10 text-sm font-medium text-foreground transition-colors"
                                        >
                                            <User size={16} className="text-highlight" />
                                            My Profile
                                        </button>
                                        <button
                                            onClick={() => handleNavClick('/messages')}
                                            className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-secondary/10 text-sm font-medium text-foreground transition-colors"
                                        >
                                            <MessageSquare size={16} className="text-primary" />
                                            Messages
                                        </button>
                                        <button
                                            onClick={() => handleNavClick('/wallet')}
                                            className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-secondary/10 text-sm font-medium text-foreground transition-colors"
                                        >
                                            <Wallet size={16} className="text-secondary" />
                                            Wallet
                                        </button>
                                        <div className="h-px bg-border my-1" />
                                        <button
                                            onClick={() => handleNavClick('/settings')}
                                            className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-secondary/10 text-sm font-medium text-foreground transition-colors"
                                        >
                                            <Settings size={16} className="text-muted-foreground" />
                                            Settings
                                        </button>
                                        <button
                                            onClick={() => handleNavClick('/help')}
                                            className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-secondary/10 text-sm font-medium text-foreground transition-colors"
                                        >
                                            <HelpCircle size={16} className="text-muted-foreground" />
                                            Help & Support
                                        </button>
                                        <div className="h-px bg-border my-1" />
                                        <button
                                            onClick={logout}
                                            className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-error/10 text-error transition-colors"
                                        >
                                            <LogOut size={16} />
                                            Log Out
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </button>
                    </div>
                )}
            </aside>

            {/* Mobile Sidebar (Drawer) - Enhanced Burger Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={toggleMobileMenu}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-card z-50 lg:hidden flex flex-col shadow-elevation-3"
                        >
                            {/* Mobile Header */}
                            <div className="p-6 border-b border-border flex items-center justify-between bg-primary/5">
                                <div>
                                    <h2 className="brand-font text-2xl font-bold text-foreground">Ìlú <span className="text-primary">Àṣẹ</span></h2>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">Menu</p>
                                </div>
                                <button
                                    onClick={toggleMobileMenu}
                                    className="p-2 rounded-xl hover:bg-secondary/10 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Mobile Navigation */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                                {navItems.map((item) => (
                                    <NavLink key={item.id} item={item} isMobile />
                                ))}
                            </div>

                            {/* Mobile Footer */}
                            <div className="p-4 border-t border-border bg-card/50">
                                <div className="mb-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                                    <p className="text-sm font-bold text-foreground">{user?.name || 'User'}</p>
                                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide inline-block mt-1", roleBadgeColor)}>
                                        {roleDisplayName}
                                    </span>
                                </div>

                                {/* Quick Actions - Profile, Messages, Wallet, Settings, Help */}
                                <div className="mb-3 space-y-1">
                                    <button
                                        onClick={() => handleNavClick('/profile')}
                                        className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-secondary/10 text-foreground transition-colors text-left"
                                    >
                                        <User size={18} className="text-highlight" />
                                        <span className="text-sm font-medium">My Profile</span>
                                    </button>
                                    <button
                                        onClick={() => handleNavClick('/messages')}
                                        className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-secondary/10 text-foreground transition-colors text-left"
                                    >
                                        <MessageSquare size={18} className="text-primary" />
                                        <span className="text-sm font-medium">Messages</span>
                                    </button>
                                    <button
                                        onClick={() => handleNavClick('/wallet')}
                                        className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-secondary/10 text-foreground transition-colors text-left"
                                    >
                                        <Wallet size={18} className="text-secondary" />
                                        <span className="text-sm font-medium">Wallet</span>
                                    </button>
                                    <div className="h-px bg-border my-1" />
                                    <button
                                        onClick={() => handleNavClick('/settings')}
                                        className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-secondary/10 text-foreground transition-colors text-left"
                                    >
                                        <Settings size={18} className="text-muted-foreground" />
                                        <span className="text-sm font-medium">Settings</span>
                                    </button>
                                    <button
                                        onClick={() => handleNavClick('/help')}
                                        className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-secondary/10 text-foreground transition-colors text-left"
                                    >
                                        <HelpCircle size={18} className="text-muted-foreground" />
                                        <span className="text-sm font-medium">Help & Support</span>
                                    </button>
                                </div>

                                <button
                                    onClick={logout}
                                    className="flex items-center gap-3 w-full p-4 rounded-xl bg-error/10 text-error font-medium hover:bg-error/20 transition-colors"
                                >
                                    <LogOut size={20} />
                                    Log Out
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                {/* Mobile Header - Enhanced Burger Button */}
                <header className="bg-card/80 backdrop-blur-md sticky top-0 z-30 px-4 py-3 flex items-center justify-between border-b border-border lg:hidden shadow-sm">
                    <button
                        onClick={toggleMobileMenu}
                        className="p-2 -ml-2 rounded-xl text-foreground hover:bg-secondary/10 active:scale-95 transition-all relative"
                        aria-label="Toggle menu"
                    >
                        <motion.div
                            animate={isMobileMenuOpen ? { rotate: 90 } : { rotate: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Menu size={24} />
                        </motion.div>
                    </button>
                    <h1 className="text-lg font-bold brand-font text-foreground">
                        Ìlú <span className="text-primary">Àṣẹ</span>
                    </h1>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                            className="p-2 rounded-xl hover:bg-secondary/10 text-muted-foreground hover:text-foreground transition-colors relative"
                        >
                            <Bell size={20} />
                            {(unreadCount?.count ?? 0) > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error border-2 border-card"></span>
                            )}
                        </button>
                        {showNotificationDropdown && (
                            <NotificationDropdown onClose={() => setShowNotificationDropdown(false)} />
                        )}
                    </div>
                </header>

                {/* Desktop Header / Top Bar */}
                <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-card/50 backdrop-blur-sm sticky top-0 z-30 border-b border-border shadow-sm">
                    {/* Context Title */}
                    <div className="flex items-center gap-4">
                        {isSidebarCollapsed && (
                            <button
                                onClick={toggleSidebar}
                                className="p-2 rounded-lg hover:bg-secondary/10 text-muted-foreground hover:text-foreground transition-colors"
                                title="Expand sidebar"
                            >
                                <ChevronRight size={20} />
                            </button>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold brand-font text-foreground capitalize">
                                {location.pathname === '/' ? 'Home' : location.pathname.substring(1).split('/')[0].replace(/-/g, ' ')}
                            </h2>
                            <p className="text-sm text-muted-foreground">Monday, October 24th • Odu: Eji Ogbe</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-secondary transition-colors pointer-events-none" size={18} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-10 pr-4 py-2.5 rounded-full bg-background border border-border focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-sm w-64 outline-none placeholder:text-muted-foreground"
                            />
                        </div>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                                className="p-2.5 rounded-full bg-background border border-border shadow-sm text-muted-foreground hover:text-primary hover:border-primary/30 transition-all relative"
                            >
                                <Bell size={20} />
                                {(unreadCount?.count ?? 0) > 0 && (
                                    <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-error border-2 border-card"></span>
                                )}
                            </button>
                            {showNotificationDropdown && (
                                <NotificationDropdown onClose={() => setShowNotificationDropdown(false)} />
                            )}
                        </div>
                        <LanguageSwitcher />
                        <ModeToggle />
                    </div>
                </header>

                {/* Scrollable View Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto pb-20">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};
