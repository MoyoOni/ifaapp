import React, { useState } from 'react';
import { Users, ChevronDown, UserCheck, Ban, RotateCcw, AlertTriangle, Loader2, Clock, UserX, Shield } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminUser } from './admin-shared-components';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/components/ui/select';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/components/toast';
import api from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Textarea } from '@/shared/components/ui/textarea';

interface AdminUserManagementTabProps {
    users: AdminUser[];
    onImpersonate: (userId: string) => void;
}

const ROLES = ['CLIENT', 'BABALAWO', 'VENDOR', 'ADMIN'];
const ADMIN_SUB_ROLES = ['SUPER', 'FINANCE', 'COMPLIANCE', 'SUPPORT', 'MODERATOR'];

const roleBadgeClass: Record<string, string> = {
    CLIENT: 'bg-primary/10 text-primary',
    BABALAWO: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    VENDOR: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    ADMIN: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

const AdminUserManagementTab: React.FC<AdminUserManagementTabProps> = ({
    users,
    onImpersonate,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [activeUserId, setActiveUserId] = useState<string | null>(null);
    const [suspendReason, setSuspendReason] = useState('');
    const [warningMessage, setWarningMessage] = useState('');
    const [banReason, setBanReason] = useState('');
    const [selectedDuration, setSelectedDuration] = useState<number>(7);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [showBanModal, setShowBanModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [pendingRole, setPendingRole] = useState<{ userId: string; fromRole: string; toRole: string } | null>(null);
    const [roleChangeReason, setRoleChangeReason] = useState('');
    const [selectedAdminSubRole, setSelectedAdminSubRole] = useState('SUPPORT');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    
    const toast = useToast();
    const qc = useQueryClient();

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = !roleFilter || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const { mutate: changeRole, isPending: roleChanging } = useMutation({
        mutationFn: async ({ userId, role, reason, adminSubRole }: { userId: string; role: string; reason?: string; adminSubRole?: string }) => {
            await api.patch(`/admin/users/${userId}/role`, { role, reason, adminSubRole });
        },
        onSuccess: (_, { role }) => {
            toast.success(`Role changed to ${role}`);
            qc.invalidateQueries({ queryKey: ['admin-users'] });
            setActiveUserId(null);
            setShowRoleModal(false);
            setPendingRole(null);
            setRoleChangeReason('');
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message ?? 'Failed to change role');
        },
    });

    const handleRoleChangeClick = (userId: string, fromRole: string, toRole: string) => {
        setPendingRole({ userId, fromRole, toRole });
        setRoleChangeReason('');
        setSelectedAdminSubRole('SUPPORT');
        setShowRoleModal(true);
    };

    const handleConfirmRoleChange = () => {
        if (!pendingRole) return;
        changeRole({
            userId: pendingRole.userId,
            role: pendingRole.toRole,
            reason: roleChangeReason || undefined,
            adminSubRole: pendingRole.toRole === 'ADMIN' ? selectedAdminSubRole : undefined,
        });
    };

    const { mutate: toggleSuspend, isPending: suspending } = useMutation({
        mutationFn: async ({ userId, suspend, reason, durationDays }: { 
            userId: string; 
            suspend: boolean; 
            reason?: string;
            durationDays?: number;
        }) => {
            if (suspend) {
                await api.post(`/admin/users/${userId}/suspend`, { 
                    durationDays: durationDays || 7,
                    reason: reason || 'Administrative suspension'
                });
            } else {
                await api.post(`/admin/users/${userId}/unban`, { reason });
            }
        },
        onSuccess: (_, { suspend }) => {
            toast.success(suspend ? 'User suspended' : 'User unsuspended');
            qc.invalidateQueries({ queryKey: ['admin-users'] });
            setActiveUserId(null);
            setSuspendReason('');
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message ?? 'Failed to update suspension');
        },
    });

    const { mutate: warnUser, isPending: warning } = useMutation({
        mutationFn: async ({ userId, message }: { userId: string; message: string }) => {
            await api.post(`/admin/users/${userId}/warn`, { message });
        },
        onSuccess: () => {
            toast.success('Warning sent to user');
            setShowWarningModal(false);
            setWarningMessage('');
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message ?? 'Failed to send warning');
        },
    });

    const { mutate: banUser, isPending: banning } = useMutation({
        mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
            await api.post(`/admin/users/${userId}/ban`, { reason });
        },
        onSuccess: () => {
            toast.success('User banned');
            setShowBanModal(false);
            setBanReason('');
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message ?? 'Failed to ban user');
        },
    });

    const { mutate: unbanUser, isPending: unbanning } = useMutation({
        mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
            await api.post(`/admin/users/${userId}/unban`, { reason });
        },
        onSuccess: () => {
            toast.success('User unbanned');
            qc.invalidateQueries({ queryKey: ['admin-users'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message ?? 'Failed to unban user');
        },
    });

    const handleShowWarningModal = (userId: string) => {
        setCurrentUserId(userId);
        setShowWarningModal(true);
    };

    const handleSendWarning = () => {
        if (currentUserId && warningMessage.trim()) {
            warnUser({ userId: currentUserId, message: warningMessage });
        }
    };

    const handleShowSuspendModal = (userId: string) => {
        setCurrentUserId(userId);
        setShowSuspendModal(true);
    };

    const handleSuspendWithModal = () => {
        if (currentUserId) {
            toggleSuspend({ 
                userId: currentUserId, 
                suspend: true, 
                reason: suspendReason || undefined, 
                durationDays: selectedDuration 
            });
            setShowSuspendModal(false);
        }
    };

    const handleShowBanModal = (userId: string) => {
        setCurrentUserId(userId);
        setShowBanModal(true);
    };

    const handleBanUser = () => {
        if (currentUserId) {
            banUser({ userId: currentUserId, reason: banReason || 'Administrative ban' });
            setShowBanModal(false);
        }
    };

    const handleUnbanUser = (userId: string) => {
        unbanUser({ userId, reason: 'Manual unban by admin' });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Users size={22} />
                User Management
            </h2>

            <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <Input
                        placeholder="Search by name or email…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="text-sm flex-1"
                    />
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="text-sm w-40">
                            <SelectValue placeholder="All roles" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Roles</SelectItem>
                            {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            <SelectItem value="ADMIN">ADMIN</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {filteredUsers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">No users found</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                                    <th className="text-left py-3 pr-4">User</th>
                                    <th className="text-left py-3 pr-4">Role</th>
                                    <th className="text-left py-3 pr-4">Status</th>
                                    <th className="text-left py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => {
                                    const isOpen = activeUserId === user.id;
                                    const canEditRole = user.role !== 'ADMIN';
                                    return (
                                        <React.Fragment key={user.id}>
                                            <tr className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors">
                                                <td className="py-3 pr-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                            <span className="text-xs font-bold text-primary">
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-foreground leading-tight">{user.name}</p>
                                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 pr-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${roleBadgeClass[user.role] ?? 'bg-muted text-foreground'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="py-3 pr-4">
                                                    {user.isBanned ? (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 flex items-center gap-1">
                                                            <Ban size={10} /> Banned
                                                        </span>
                                                    ) : user.isSuspended ? (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 flex items-center gap-1">
                                                            <Clock size={10} /> Suspended
                                                        </span>
                                                    ) : user.verified ? (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                                            Verified
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground">
                                                            Unverified
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => onImpersonate(user.id)}
                                                        >
                                                            Impersonate
                                                        </Button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveUserId(isOpen ? null : user.id)}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors"
                                                        >
                                                            Manage <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Inline management panel */}
                                            {isOpen && (
                                                <tr>
                                                    <td colSpan={4} className="pb-4 pt-1">
                                                        <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-4">
                                                            {/* Change Role */}
                                                            {canEditRole && (
                                                                <div className="space-y-2">
                                                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                                                        <UserCheck size={12} /> Change Role
                                                                    </p>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {ROLES.filter(r => r !== user.role).map(r => (
                                                                            <button
                                                                                key={r}
                                                                                type="button"
                                                                                disabled={roleChanging}
                                                                                onClick={() => handleRoleChangeClick(user.id, user.role, r)}
                                                                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors disabled:opacity-50 ${
                                                                                    r === 'ADMIN'
                                                                                        ? 'border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10'
                                                                                        : 'border-border hover:bg-card'
                                                                                }`}
                                                                            >
                                                                                {r === 'ADMIN' && <Shield size={11} />}
                                                                                → {r}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Suspension/Warn/Ban controls */}
                                                            <div className="space-y-2">
                                                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                                                    <AlertTriangle size={12} /> Moderation Actions
                                                                </p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleShowWarningModal(user.id)}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
                                                                    >
                                                                        <AlertTriangle size={11} />
                                                                        Warn
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleShowSuspendModal(user.id)}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                                                                    >
                                                                        <Clock size={11} />
                                                                        Suspend
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleShowBanModal(user.id)}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                                                                    >
                                                                        <Ban size={11} />
                                                                        Ban
                                                                    </button>
                                                                    {user.isSuspended && (
                                                                        <button
                                                                            type="button"
                                                                            disabled={unbanning}
                                                                            onClick={() => handleUnbanUser(user.id)}
                                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                                                                        >
                                                                            {unbanning ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                                                                            Unsuspend
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Warning Modal */}
            <Dialog open={showWarningModal} onOpenChange={setShowWarningModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send Warning to User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            This will send a warning notification to the user.
                        </p>
                        <Textarea
                            value={warningMessage}
                            onChange={(e) => setWarningMessage(e.target.value)}
                            placeholder="Enter warning message..."
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowWarningModal(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSendWarning}
                            disabled={warning || !warningMessage.trim()}
                        >
                            {warning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Warning'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Suspend Modal */}
            <Dialog open={showSuspendModal} onOpenChange={setShowSuspendModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Suspend User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Select duration and reason for suspension.
                        </p>
                        
                        <div>
                            <label className="text-sm font-medium">Duration (days)</label>
                            <Select value={selectedDuration.toString()} onValueChange={(v) => setSelectedDuration(Number(v))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 day</SelectItem>
                                    <SelectItem value="3">3 days</SelectItem>
                                    <SelectItem value="7">7 days</SelectItem>
                                    <SelectItem value="14">14 days</SelectItem>
                                    <SelectItem value="30">30 days</SelectItem>
                                    <SelectItem value="90">90 days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium">Reason</label>
                            <Textarea
                                value={suspendReason}
                                onChange={(e) => setSuspendReason(e.target.value)}
                                placeholder="Enter reason for suspension..."
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSuspendModal(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSuspendWithModal}
                            disabled={suspending}
                        >
                            {suspending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Suspend User'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Role Change Modal */}
            <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserCheck size={18} />
                            Change User Role
                        </DialogTitle>
                    </DialogHeader>
                    {pendingRole && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-sm">
                                <span className="font-bold">{pendingRole.fromRole}</span>
                                <span className="text-muted-foreground">→</span>
                                <span className={`font-bold ${pendingRole.toRole === 'ADMIN' ? 'text-red-600 dark:text-red-400' : ''}`}>
                                    {pendingRole.toRole}
                                </span>
                            </div>
                            {pendingRole.toRole === 'ADMIN' && (
                                <div>
                                    <label className="text-sm font-medium">Admin Sub-Role</label>
                                    <Select value={selectedAdminSubRole} onValueChange={setSelectedAdminSubRole}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ADMIN_SUB_ROLES.map(r => (
                                                <SelectItem key={r} value={r}>{r}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-medium">Reason <span className="text-muted-foreground font-normal">(logged in audit trail)</span></label>
                                <Textarea
                                    value={roleChangeReason}
                                    onChange={(e) => setRoleChangeReason(e.target.value)}
                                    placeholder="Enter reason for this role change…"
                                    rows={3}
                                    className="mt-1"
                                />
                            </div>
                            {pendingRole.toRole === 'ADMIN' && (
                                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-700 dark:text-red-400">
                                    <Shield size={14} className="mt-0.5 shrink-0" />
                                    This grants admin access. Ensure the reason is documented.
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRoleModal(false)}>Cancel</Button>
                        <Button
                            onClick={handleConfirmRoleChange}
                            disabled={roleChanging}
                            variant={pendingRole?.toRole === 'ADMIN' ? 'destructive' : 'default'}
                        >
                            {roleChanging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Confirm Role Change
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Ban Modal */}
            <Dialog open={showBanModal} onOpenChange={setShowBanModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ban User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                            <UserX className="text-destructive mt-0.5 flex-shrink-0" size={16} />
                            <div>
                                <p className="text-sm font-medium text-destructive">Permanent Action</p>
                                <p className="text-xs text-muted-foreground">
                                    Banning is permanent and cannot be undone without manual database intervention.
                                </p>
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium">Reason</label>
                            <Textarea
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                                placeholder="Enter reason for ban..."
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBanModal(false)}>
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive"
                            onClick={handleBanUser}
                            disabled={banning}
                        >
                            {banning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ban User Permanently'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminUserManagementTab;