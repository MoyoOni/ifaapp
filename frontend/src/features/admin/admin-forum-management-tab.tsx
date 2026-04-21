import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Hash, Pin, Lock, Unlock, Plus, Loader2, CheckCircle2, AlertTriangle,
    MessageSquare, LayoutList, Archive, ChevronUp, ChevronDown
} from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';

interface ForumCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
    _count?: { threads: number };
}

interface ForumThread {
    id: string;
    title: string;
    status: string;
    isPinned: boolean;
    isLocked: boolean;
    createdAt: string;
    category: { name: string };
    author: { name: string };
    _count: { posts: number };
}

const AdminForumManagementTab: React.FC = () => {
    const [view, setView] = useState<'categories' | 'threads'>('categories');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDesc, setNewCategoryDesc] = useState('');
    const [showNewCategory, setShowNewCategory] = useState(false);
    const toast = useToast();
    const qc = useQueryClient();

    const { data: categories = [], isLoading: catsLoading } = useQuery<ForumCategory[]>({
        queryKey: ['admin-forum-categories'],
        queryFn: async () => {
            const res = await api.get('/forum/categories');
            return res.data?.categories ?? res.data ?? [];
        },
        staleTime: 60000,
    });

    const { data: threads = [], isLoading: threadsLoading } = useQuery<ForumThread[]>({
        queryKey: ['admin-forum-threads'],
        queryFn: async () => {
            const res = await api.get('/forum/threads', { params: { limit: 50 } });
            return res.data?.threads ?? res.data ?? [];
        },
        enabled: view === 'threads',
        staleTime: 30000,
    });

    const { mutate: createCategory, isPending: creating } = useMutation({
        mutationFn: async () => {
            await api.post('/forum/categories', {
                name: newCategoryName.trim(),
                description: newCategoryDesc.trim() || undefined,
            });
        },
        onSuccess: () => {
            toast.success(`Category "${newCategoryName}" created`);
            setNewCategoryName('');
            setNewCategoryDesc('');
            setShowNewCategory(false);
            qc.invalidateQueries({ queryKey: ['admin-forum-categories'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message ?? 'Failed to create category');
        },
    });

    const { mutate: archiveCategory } = useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
            await api.patch(`/forum/admin/categories/${id}`, { isActive });
        },
        onSuccess: (_, { isActive }) => {
            toast.success(isActive ? 'Category restored' : 'Category archived');
            qc.invalidateQueries({ queryKey: ['admin-forum-categories'] });
        },
        onError: () => toast.error('Action failed'),
    });

    const { mutate: reorderCategory } = useMutation({
        mutationFn: async ({ id, newPosition }: { id: string; newPosition: number }) => {
            await api.patch(`/forum/admin/categories/${id}/reorder`, { newPosition });
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-forum-categories'] }),
        onError: () => toast.error('Reorder failed'),
    });

    const { mutate: moderateThread, isPending: moderating } = useMutation({
        mutationFn: async ({ threadId, action }: { threadId: string; action: string }) => {
            await api.patch(`/forum/threads/${threadId}/moderate/${action}`);
        },
        onSuccess: (_, { action }) => {
            toast.success(`Thread ${action}ned`);
            qc.invalidateQueries({ queryKey: ['admin-forum-threads'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message ?? 'Action failed');
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <MessageSquare size={22} />
                    Forum Management
                </h2>
                <div className="flex rounded-xl border border-border overflow-hidden text-sm">
                    <button
                        type="button"
                        onClick={() => setView('categories')}
                        className={`flex items-center gap-1.5 px-4 py-2 font-medium transition-colors ${view === 'categories' ? 'bg-primary text-white' : 'hover:bg-muted'}`}
                    >
                        <Hash size={14} /> Categories
                    </button>
                    <button
                        type="button"
                        onClick={() => setView('threads')}
                        className={`flex items-center gap-1.5 px-4 py-2 font-medium transition-colors ${view === 'threads' ? 'bg-primary text-white' : 'hover:bg-muted'}`}
                    >
                        <LayoutList size={14} /> Threads
                    </button>
                </div>
            </div>

            {/* ── Categories ── */}
            {view === 'categories' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => setShowNewCategory(!showNewCategory)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
                        >
                            <Plus size={14} /> New Category
                        </button>
                    </div>

                    {showNewCategory && (
                        <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">New Category</p>
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={e => setNewCategoryName(e.target.value)}
                                placeholder="Category name"
                                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <input
                                type="text"
                                value={newCategoryDesc}
                                onChange={e => setNewCategoryDesc(e.target.value)}
                                placeholder="Description (optional)"
                                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={creating || !newCategoryName.trim()}
                                    onClick={() => createCategory()}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {creating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                    Create
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowNewCategory(false)}
                                    className="px-4 py-2 text-sm font-medium rounded-xl border border-border hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {catsLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 size={24} className="animate-spin text-muted-foreground" />
                        </div>
                    ) : categories.length === 0 ? (
                        <p className="text-center text-muted-foreground py-10 text-sm">No categories found</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categories.map((cat, idx) => (
                                <div key={cat.id} className={`bg-card border rounded-xl p-4 space-y-2 ${cat.isActive ? 'border-border' : 'border-border/50 opacity-60'}`}>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-bold text-foreground text-sm truncate">{cat.name}</p>
                                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${cat.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                                            {cat.isActive ? 'Active' : 'Archived'}
                                        </span>
                                    </div>
                                    {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
                                    <p className="text-xs text-muted-foreground">{cat._count?.threads ?? 0} threads · /{cat.slug}</p>
                                    <div className="flex items-center gap-1 pt-1">
                                        <button type="button" onClick={() => reorderCategory({ id: cat.id, newPosition: idx - 1 })} disabled={idx === 0} className="p-1 rounded text-muted-foreground hover:bg-muted disabled:opacity-30" title="Move up">
                                            <ChevronUp size={14} />
                                        </button>
                                        <button type="button" onClick={() => reorderCategory({ id: cat.id, newPosition: idx + 1 })} disabled={idx === categories.length - 1} className="p-1 rounded text-muted-foreground hover:bg-muted disabled:opacity-30" title="Move down">
                                            <ChevronDown size={14} />
                                        </button>
                                        <button type="button" onClick={() => archiveCategory({ id: cat.id, isActive: !cat.isActive })} className="ml-auto p-1 rounded text-muted-foreground hover:bg-muted" title={cat.isActive ? 'Archive' : 'Restore'}>
                                            <Archive size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Threads ── */}
            {view === 'threads' && (
                <div className="space-y-3">
                    {threadsLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 size={24} className="animate-spin text-muted-foreground" />
                        </div>
                    ) : threads.length === 0 ? (
                        <p className="text-center text-muted-foreground py-10 text-sm">No threads found</p>
                    ) : (
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                                        <th className="text-left px-4 py-3">Thread</th>
                                        <th className="text-left px-4 py-3 hidden md:table-cell">Category</th>
                                        <th className="text-left px-4 py-3 hidden sm:table-cell">Status</th>
                                        <th className="text-left px-4 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {threads.map(thread => (
                                        <tr key={thread.id} className="border-b border-border/60 last:border-0 hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-foreground leading-tight line-clamp-1">{thread.title}</p>
                                                <p className="text-xs text-muted-foreground">{thread.author?.name} · {thread._count?.posts ?? 0} posts</p>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <span className="text-xs text-muted-foreground">{thread.category?.name}</span>
                                            </td>
                                            <td className="px-4 py-3 hidden sm:table-cell">
                                                <div className="flex gap-1 flex-wrap">
                                                    {thread.isPinned && (
                                                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">
                                                            <Pin size={10} /> Pinned
                                                        </span>
                                                    )}
                                                    {thread.isLocked && (
                                                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium">
                                                            <Lock size={10} /> Locked
                                                        </span>
                                                    )}
                                                    {!thread.isPinned && !thread.isLocked && (
                                                        <span className="text-xs text-muted-foreground">Open</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1.5 flex-wrap">
                                                    <button
                                                        type="button"
                                                        disabled={moderating}
                                                        onClick={() => moderateThread({ threadId: thread.id, action: thread.isPinned ? 'unpin' : 'pin' })}
                                                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
                                                        title={thread.isPinned ? 'Unpin' : 'Pin'}
                                                    >
                                                        <Pin size={11} />
                                                        {thread.isPinned ? 'Unpin' : 'Pin'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={moderating}
                                                        onClick={() => moderateThread({ threadId: thread.id, action: thread.isLocked ? 'unlock' : 'lock' })}
                                                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
                                                        title={thread.isLocked ? 'Unlock' : 'Lock'}
                                                    >
                                                        {thread.isLocked ? <Unlock size={11} /> : <Lock size={11} />}
                                                        {thread.isLocked ? 'Unlock' : 'Lock'}
                                                    </button>
                                                    {thread.status === 'PENDING' && (
                                                        <button
                                                            type="button"
                                                            disabled={moderating}
                                                            onClick={() => moderateThread({ threadId: thread.id, action: 'approve' })}
                                                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                                                        >
                                                            <CheckCircle2 size={11} /> Approve
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminForumManagementTab;
