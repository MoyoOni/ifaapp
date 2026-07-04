import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Hash, Pin, Lock, Unlock, Plus, Loader2, CheckCircle2,
    MessageSquare, LayoutList, Archive, ChevronUp, ChevronDown,
    Edit3, Trash2, Move, Merge
} from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import {
    Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from '@/shared/components/ui/select';

interface ForumCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    order: number;
    isActive: boolean;
    isTeachings?: boolean;
    _count?: { threads: number };
}

interface ForumThread {
    id: string;
    title: string;
    status: string;
    isPinned: boolean;
    isLocked: boolean;
    createdAt: string;
    categoryId: string;
    category: { id: string; name: string };
    author: { name: string };
    _count: { posts: number };
}

interface ForumStats {
    totalCategories: number;
    totalThreads: number;
    totalPosts: number;
    lockedThreads: number;
    pinnedThreads: number;
}

const AdminForumManagementTab: React.FC = () => {
    const [view, setView] = useState<'categories' | 'threads'>('categories');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDesc, setNewCategoryDesc] = useState('');
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ForumCategory | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<{ category: ForumCategory; confirmText: string } | null>(null);
    const [movingThread, setMovingThread] = useState<{ thread: ForumThread; targetCategoryId?: string } | null>(null);
    const [mergingThreads, setMergingThreads] = useState<{ primaryId?: string; secondaryId?: string } | null>(null);
    const toast = useToast();
    const qc = useQueryClient();

    const { data: categories = [], isLoading: catsLoading } = useQuery<ForumCategory[]>({
        queryKey: ['admin-forum-categories'],
        queryFn: async () => {
            const res = await api.get('/forum/admin/categories');
            return res.data ?? [];
        },
        staleTime: 60000,
    });

    const { data: threads = [], isLoading: threadsLoading } = useQuery<ForumThread[]>({
        queryKey: ['admin-forum-threads'],
        queryFn: async () => {
            const res = await api.get('/forum/threads');
            return res.data ?? [];
        },
        enabled: view === 'threads',
        staleTime: 30000,
    });

    const { data: stats } = useQuery<ForumStats>({
        queryKey: ['admin-forum-management-stats'],
        queryFn: async () => {
            const res = await api.get('/forum/admin/management-stats');
            return res.data;
        },
        staleTime: 60000,
    });

    const { mutate: createCategory, isPending: creating } = useMutation({
        mutationFn: async () => {
            await api.post('/forum/admin/categories', {
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
            qc.invalidateQueries({ queryKey: ['admin-forum-management-stats'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message ?? 'Failed to create category');
        },
    });

    const { mutate: updateCategory, isPending: updating } = useMutation({
        mutationFn: async (data: Partial<ForumCategory>) => {
            if (!editingCategory) return;
            await api.patch(`/forum/admin/categories/${editingCategory.id}`, data);
        },
        onSuccess: () => {
            toast.success('Category updated');
            setEditingCategory(null);
            qc.invalidateQueries({ queryKey: ['admin-forum-categories'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message ?? 'Failed to update category');
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

    const { mutate: deleteCategory, isPending: deleting } = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/forum/admin/categories/${id}`);
        },
        onSuccess: () => {
            toast.success('Category deleted');
            setDeletingCategory(null);
            qc.invalidateQueries({ queryKey: ['admin-forum-categories'] });
            qc.invalidateQueries({ queryKey: ['admin-forum-management-stats'] });
        },
        onError: (err: any) => {
            // Backend guards against deleting a category that still has threads
            toast.error(err?.response?.data?.message ?? 'Failed to delete category');
        },
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

    const { mutate: moveThread, isPending: movingThreadOp } = useMutation({
        mutationFn: async ({ threadId, targetCategoryId }: { threadId: string; targetCategoryId: string }) => {
            await api.patch(`/forum/admin/threads/${threadId}/move`, { targetCategoryId });
        },
        onSuccess: () => {
            toast.success('Thread moved');
            setMovingThread(null);
            qc.invalidateQueries({ queryKey: ['admin-forum-threads'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message ?? 'Failed to move thread');
        },
    });

    const { mutate: mergeThreads, isPending: mergingThreadsOp } = useMutation({
        mutationFn: async ({ primaryId, secondaryId }: { primaryId: string; secondaryId: string }) => {
            await api.post('/forum/admin/threads/merge', { primaryThreadId: primaryId, secondaryThreadId: secondaryId });
        },
        onSuccess: () => {
            toast.success('Threads merged');
            setMergingThreads(null);
            qc.invalidateQueries({ queryKey: ['admin-forum-threads'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message ?? 'Failed to merge threads (they must be in the same category)');
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

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                        { label: 'Categories', value: stats.totalCategories },
                        { label: 'Threads', value: stats.totalThreads },
                        { label: 'Posts', value: stats.totalPosts },
                        { label: 'Locked', value: stats.lockedThreads },
                        { label: 'Pinned', value: stats.pinnedThreads },
                    ].map((s) => (
                        <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
                            <p className="text-xl font-bold text-foreground">{s.value}</p>
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

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
                                        <button type="button" onClick={() => setEditingCategory(cat)} className="p-1 rounded text-muted-foreground hover:bg-muted" title="Edit">
                                            <Edit3 size={14} />
                                        </button>
                                        <button type="button" onClick={() => archiveCategory({ id: cat.id, isActive: !cat.isActive })} className="p-1 rounded text-muted-foreground hover:bg-muted" title={cat.isActive ? 'Archive' : 'Restore'}>
                                            <Archive size={14} />
                                        </button>
                                        <button type="button" onClick={() => setDeletingCategory({ category: cat, confirmText: '' })} className="ml-auto p-1 rounded text-destructive hover:bg-destructive/10" title="Delete">
                                            <Trash2 size={14} />
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
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => setMergingThreads({})}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl border border-border hover:bg-muted transition-colors"
                        >
                            <Merge size={14} /> Merge Threads
                        </button>
                    </div>
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
                                                    <button
                                                        type="button"
                                                        onClick={() => setMovingThread({ thread })}
                                                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                                                        title="Move to another category"
                                                    >
                                                        <Move size={11} /> Move
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

            {/* Edit Category Modal */}
            {editingCategory && (
                <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Category</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Name</label>
                                <Input
                                    value={editingCategory.name}
                                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Description</label>
                                <Textarea
                                    value={editingCategory.description || ''}
                                    onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Teachings category?</label>
                                <Switch
                                    checked={!!editingCategory.isTeachings}
                                    onCheckedChange={(checked) => setEditingCategory({ ...editingCategory, isTeachings: checked })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <button type="button" onClick={() => setEditingCategory(null)} className="px-4 py-2 text-sm font-medium rounded-xl border border-border hover:bg-muted transition-colors">
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={updating || !editingCategory.name.trim()}
                                onClick={() => updateCategory({
                                    name: editingCategory.name,
                                    description: editingCategory.description,
                                    isTeachings: editingCategory.isTeachings,
                                })}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {updating ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Delete Category Modal */}
            {deletingCategory && (
                <Dialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Category</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <p className="text-sm">
                                Delete "<strong>{deletingCategory.category.name}</strong>"? This cannot be undone.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Categories with existing threads can't be deleted — move the threads first.
                            </p>
                            <div className="text-sm">
                                Type "<strong>DELETE</strong>" to confirm:
                                <Input
                                    value={deletingCategory.confirmText}
                                    onChange={(e) => setDeletingCategory({ ...deletingCategory, confirmText: e.target.value })}
                                    className="mt-2"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <button type="button" onClick={() => setDeletingCategory(null)} className="px-4 py-2 text-sm font-medium rounded-xl border border-border hover:bg-muted transition-colors">
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deletingCategory.confirmText !== 'DELETE' || deleting}
                                onClick={() => deleteCategory(deletingCategory.category.id)}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-destructive text-white hover:bg-destructive/90 transition-colors disabled:opacity-50"
                            >
                                {deleting ? <Loader2 size={14} className="animate-spin" /> : 'Delete'}
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Move Thread Modal */}
            {movingThread && (
                <Dialog open={!!movingThread} onOpenChange={(open) => !open && setMovingThread(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Move Thread</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <p className="text-sm">
                                Moving "<strong>{movingThread.thread.title}</strong>" from "{movingThread.thread.category?.name}"
                            </p>
                            <div>
                                <label className="text-sm font-medium">Target Category</label>
                                <Select
                                    value={movingThread.targetCategoryId}
                                    onValueChange={(value) => setMovingThread({ ...movingThread, targetCategoryId: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select target category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories
                                            .filter(cat => cat.id !== movingThread.thread.categoryId && cat.isActive)
                                            .map(category => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <button type="button" onClick={() => setMovingThread(null)} className="px-4 py-2 text-sm font-medium rounded-xl border border-border hover:bg-muted transition-colors">
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={!movingThread.targetCategoryId || movingThreadOp}
                                onClick={() => moveThread({ threadId: movingThread.thread.id, targetCategoryId: movingThread.targetCategoryId! })}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {movingThreadOp ? <Loader2 size={14} className="animate-spin" /> : 'Move Thread'}
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Merge Threads Modal */}
            {mergingThreads && (
                <Dialog open={!!mergingThreads} onOpenChange={(open) => !open && setMergingThreads(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Merge Threads</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                All posts from the secondary thread move to the primary thread; the secondary thread is then removed. Both threads must be in the same category.
                            </p>
                            <div>
                                <label className="text-sm font-medium">Primary Thread (keep)</label>
                                <Select
                                    value={mergingThreads.primaryId}
                                    onValueChange={(value) => setMergingThreads({ ...mergingThreads, primaryId: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select primary thread" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {threads.map(thread => (
                                            <SelectItem key={thread.id} value={thread.id}>{thread.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Secondary Thread (removed)</label>
                                <Select
                                    value={mergingThreads.secondaryId}
                                    onValueChange={(value) => setMergingThreads({ ...mergingThreads, secondaryId: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select secondary thread" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {threads
                                            .filter(t => t.id !== mergingThreads.primaryId)
                                            .map(thread => (
                                                <SelectItem key={thread.id} value={thread.id}>{thread.title}</SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <button type="button" onClick={() => setMergingThreads(null)} className="px-4 py-2 text-sm font-medium rounded-xl border border-border hover:bg-muted transition-colors">
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={!mergingThreads.primaryId || !mergingThreads.secondaryId || mergingThreadsOp}
                                onClick={() => mergeThreads({ primaryId: mergingThreads.primaryId!, secondaryId: mergingThreads.secondaryId! })}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-destructive text-white hover:bg-destructive/90 transition-colors disabled:opacity-50"
                            >
                                {mergingThreadsOp ? <Loader2 size={14} className="animate-spin" /> : 'Merge Threads'}
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default AdminForumManagementTab;
