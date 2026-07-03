import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Plus, X, Loader2, CheckCircle2, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';

interface Announcement {
    id: string;
    title: string;
    message: string;
    type: string;
    isActive: boolean;
    expiresAt?: string;
    createdAt: string;
}

const typeConfig: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
    info:     { label: 'Info',     icon: Info,          cls: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
    warning:  { label: 'Warning', icon: AlertTriangle,  cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
    success:  { label: 'Success', icon: CheckCircle2,   cls: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' },
    critical: { label: 'Critical', icon: AlertCircle,   cls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' },
};

const AdminAnnouncementsTab: React.FC = () => {
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'info' | 'warning' | 'success' | 'critical'>('info');
    const [expiresAt, setExpiresAt] = useState('');
    const toast = useToast();
    const qc = useQueryClient();

    const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
        queryKey: ['admin-announcements'],
        queryFn: async () => (await api.get('/admin/announcements')).data,
        staleTime: 30000,
    });

    const { mutate: create, isPending: creating } = useMutation({
        mutationFn: async () => {
            await api.post('/admin/announcements', {
                title: title.trim(),
                message: message.trim(),
                type,
                expiresAt: expiresAt || undefined,
            });
        },
        onSuccess: () => {
            toast.success('Announcement published');
            setTitle(''); setMessage(''); setType('info'); setExpiresAt('');
            setShowForm(false);
            qc.invalidateQueries({ queryKey: ['admin-announcements'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message ?? 'Failed to publish');
        },
    });

    const { mutate: deactivate, isPending: deactivating } = useMutation({
        mutationFn: async (id: string) => {
            await api.patch(`/admin/announcements/${id}/deactivate`);
        },
        onSuccess: () => {
            toast.success('Announcement deactivated');
            qc.invalidateQueries({ queryKey: ['admin-announcements'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message ?? 'Failed to deactivate');
        },
    });

    const active = announcements.filter(a => a.isActive);
    const past = announcements.filter(a => !a.isActive);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Megaphone size={22} />
                    Platform Announcements
                </h2>
                <button
                    type="button"
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                    <Plus size={14} /> New Announcement
                </button>
            </div>

            {/* Create form */}
            {showForm && (
                <div className="bg-muted/40 border border-border rounded-xl p-5 space-y-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">New Platform Announcement</p>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Announcement title"
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Message shown to all users…"
                        rows={3}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Type</label>
                            <select
                                value={type}
                                onChange={e => setType(e.target.value as typeof type)}
                                aria-label="Announcement type"
                                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                            >
                                {Object.entries(typeConfig).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Expires (optional)</label>
                            <input
                                type="datetime-local"
                                value={expiresAt}
                                onChange={e => setExpiresAt(e.target.value)}
                                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={creating || !title.trim() || !message.trim()}
                            onClick={() => create()}
                            className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {creating ? <Loader2 size={14} className="animate-spin" /> : <Megaphone size={14} />}
                            Publish to All Users
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 text-sm font-medium rounded-xl border border-border hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Active announcements */}
            <div className="space-y-3">
                <p className="text-sm font-bold text-foreground">Active ({active.length})</p>
                {isLoading ? (
                    <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-muted-foreground" /></div>
                ) : active.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6 bg-muted/30 rounded-xl">No active announcements</p>
                ) : (
                    active.map(a => {
                        const cfg = typeConfig[a.type] ?? typeConfig.info;
                        const Icon = cfg.icon;
                        return (
                            <div key={a.id} className={`border rounded-xl p-4 flex items-start gap-3 ${cfg.cls}`}>
                                <Icon size={18} className="shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm">{a.title}</p>
                                    <p className="text-sm mt-0.5">{a.message}</p>
                                    <p className="text-xs mt-1 opacity-70">
                                        Published {new Date(a.createdAt).toLocaleDateString('en-GB')}
                                        {a.expiresAt ? ` · Expires ${new Date(a.expiresAt).toLocaleDateString('en-GB')}` : ' · No expiry'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    disabled={deactivating}
                                    onClick={() => deactivate(a.id)}
                                    className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                                    title="Deactivate"
                                >
                                    {deactivating ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Past announcements */}
            {past.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-bold text-muted-foreground">Past ({past.length})</p>
                    {past.map(a => (
                        <div key={a.id} className="border border-border/60 rounded-xl px-4 py-3 flex items-center gap-3 opacity-60">
                            <p className="flex-1 text-sm font-medium text-foreground truncate">{a.title}</p>
                            <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString('en-GB')}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Inactive</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminAnnouncementsTab;
