import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  ArrowUpDown, 
  Pin, 
  Lock, 
  Unlock, 
  FolderPlus, 
  MessageSquare, 
  Hash,
  Eye,
  EyeOff,
  Users,
  BarChart3,
  Loader2,
  X,
  Check,
  Move,
  Merge
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from '@/shared/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/shared/components/ui/dialog';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';

interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  isTeachings: boolean;
  threadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ForumThread {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  isPinned: boolean;
  isLocked: boolean;
  status: string;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

const ForumManagementTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'threads'>('categories');
  const [editingCategory, setEditingCategory] = useState<ForumCategory | null>(null);
  const [movingThread, setMovingThread] = useState<{ thread: ForumThread; targetCategoryId?: string } | null>(null);
  const [mergingThreads, setMergingThreads] = useState<{ 
    primaryThread?: ForumThread; 
    secondaryThread?: ForumThread;
    primaryId?: string;
    secondaryId?: string;
  } | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<{ category: ForumCategory; confirmText: string } | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: '',
    order: 0,
    isTeachings: false,
    isActive: true
  });
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [showMoveThreadModal, setShowMoveThreadModal] = useState(false);
  const [showMergeThreadsModal, setShowMergeThreadsModal] = useState(false);
  
  const toast = useToast();

  // Fetch forum categories
  const { data: categories = [], isLoading: categoriesLoading, refetch: refetchCategories } = useQuery({
    queryKey: ['forum-categories'],
    queryFn: async () => {
      const response = await api.get('/forum/admin/categories');
      return response.data as ForumCategory[];
    }
  });

  // Fetch forum threads
  const { data: threads = [], isLoading: threadsLoading, refetch: refetchThreads } = useQuery({
    queryKey: ['forum-threads'],
    queryFn: async () => {
      // Note: This endpoint doesn't exist yet in the backend
      // We'll need to create an endpoint to fetch all threads for admin management
      const response = await api.get('/forum/threads');
      return response.data.items as ForumThread[];
    }
  });

  // Fetch forum management stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['forum-stats'],
    queryFn: async () => {
      const response = await api.get('/forum/admin/management-stats');
      return response.data;
    }
  });

  const { mutateAsync: createCategory, isPending: creatingCategory } = useMutation({
    mutationFn: async (data: typeof newCategory) => {
      const response = await api.post('/forum/admin/categories', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Category created successfully');
      setNewCategory({
        name: '',
        description: '',
        icon: '',
        order: 0,
        isTeachings: false,
        isActive: true
      });
      setShowNewCategoryModal(false);
      refetchCategories();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create category');
    }
  });

  const { mutateAsync: updateCategory, isPending: updatingCategory } = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ForumCategory> }) => {
      const response = await api.patch(`/forum/admin/categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Category updated successfully');
      setEditingCategory(null);
      refetchCategories();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update category');
    }
  });

  const { mutateAsync: deleteCategory, isPending: deletingCategoryOp } = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/forum/admin/categories/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Category deleted successfully');
      setDeletingCategory(null);
      refetchCategories();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete category');
    }
  });

  const { mutateAsync: moveThread, isPending: movingThreadOp } = useMutation({
    mutationFn: async ({ threadId, targetCategoryId }: { threadId: string; targetCategoryId: string }) => {
      const response = await api.patch(`/forum/admin/threads/${threadId}/move`, { targetCategoryId });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Thread moved successfully');
      setMovingThread(null);
      setShowMoveThreadModal(false);
      refetchThreads();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to move thread');
    }
  });

  const { mutateAsync: mergeThreads, isPending: mergingThreadsOp } = useMutation({
    mutationFn: async ({ primaryId, secondaryId }: { primaryId: string; secondaryId: string }) => {
      const response = await api.post('/forum/admin/threads/merge', { 
        primaryThreadId: primaryId, 
        secondaryThreadId: secondaryId 
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Threads merged successfully');
      setMergingThreads(null);
      setShowMergeThreadsModal(false);
      refetchThreads();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to merge threads');
    }
  });

  const handleCreateCategory = () => {
    createCategory(newCategory);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;
    
    updateCategory({
      id: editingCategory.id,
      data: {
        name: editingCategory.name,
        description: editingCategory.description,
        icon: editingCategory.icon,
        order: editingCategory.order,
        isTeachings: editingCategory.isTeachings,
        isActive: editingCategory.isActive
      }
    });
  };

  const handleDeleteCategory = () => {
    if (!deletingCategory) return;
    deleteCategory(deletingCategory.category.id);
  };

  const handleMoveThread = () => {
    if (!movingThread || !movingThread.targetCategoryId) return;
    moveThread({
      threadId: movingThread.thread.id,
      targetCategoryId: movingThread.targetCategoryId
    });
  };

  const handleMergeThreads = () => {
    if (!mergingThreads || !mergingThreads.primaryId || !mergingThreads.secondaryId) return;
    mergeThreads({
      primaryId: mergingThreads.primaryId,
      secondaryId: mergingThreads.secondaryId
    });
  };

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare size={22} />
          Forum Management
        </h2>
        
        <div className="flex gap-2">
          <Button 
            variant={activeTab === 'categories' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('categories')}
          >
            <FolderPlus size={16} className="mr-2" />
            Categories
          </Button>
          <Button 
            variant={activeTab === 'threads' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('threads')}
          >
            <Hash size={16} className="mr-2" />
            Threads
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.totalCategories}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Threads</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.totalThreads}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Posts</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.totalPosts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Locked</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.lockedThreads}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pinned</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.pinnedThreads}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Forum Categories</h3>
            <Button onClick={() => setShowNewCategoryModal(true)}>
              <Plus size={16} className="mr-2" />
              New Category
            </Button>
          </div>

          {categoriesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedCategories.map(category => (
                <div 
                  key={category.id} 
                  className="border border-border rounded-lg p-4 bg-background hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        {category.icon && <span>{category.icon}</span>}
                        {category.name}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {category.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {category.threadCount} threads
                        </Badge>
                        {category.isTeachings && (
                          <Badge variant="outline" className="text-xs">
                            Teachings
                          </Badge>
                        )}
                        {!category.isActive && (
                          <Badge variant="destructive" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setEditingCategory(category)}
                      >
                        <Edit3 size={14} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setDeletingCategory({
                          category,
                          confirmText: ''
                        })}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-muted-foreground">
                    Order: {category.order} | Slug: {category.slug}
                  </div>
                </div>
              ))}
              
              {sortedCategories.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No categories found. Create your first category.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'threads' && (
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Forum Threads</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setMergingThreads({})}
              >
                <Merge size={16} className="mr-2" />
                Merge Threads
              </Button>
            </div>
          </div>

          {threadsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Thread management functionality coming soon. 
              This requires additional backend endpoints to fetch all threads for admin management.
            </div>
          )}
        </div>
      )}

      {/* New Category Modal */}
      <Dialog open={showNewCategoryModal} onOpenChange={setShowNewCategoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                placeholder="Category name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                placeholder="Category description"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Icon</label>
                <Input
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
                  placeholder="Category icon (emoji)"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Order</label>
                <Input
                  type="number"
                  value={newCategory.order}
                  onChange={(e) => setNewCategory({...newCategory, order: Number(e.target.value)})}
                  placeholder="Display order"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Is Teachings?</label>
                <p className="text-xs text-muted-foreground">For spiritual teachings content</p>
              </div>
              <Switch
                checked={newCategory.isTeachings}
                onCheckedChange={(checked) => setNewCategory({...newCategory, isTeachings: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Active</label>
                <p className="text-xs text-muted-foreground">Enable this category</p>
              </div>
              <Switch
                checked={newCategory.isActive}
                onCheckedChange={(checked) => setNewCategory({...newCategory, isActive: checked})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowNewCategoryModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCategory} 
              disabled={!newCategory.name || creatingCategory}
            >
              {creatingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      {editingCategory && (
        <Dialog 
          open={!!editingCategory} 
          onOpenChange={(open) => !open && setEditingCategory(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                  placeholder="Category name"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({...editingCategory, description: e.target.value})}
                  placeholder="Category description"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Icon</label>
                  <Input
                    value={editingCategory.icon || ''}
                    onChange={(e) => setEditingCategory({...editingCategory, icon: e.target.value})}
                    placeholder="Category icon (emoji)"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Order</label>
                  <Input
                    type="number"
                    value={editingCategory.order}
                    onChange={(e) => setEditingCategory({...editingCategory, order: Number(e.target.value)})}
                    placeholder="Display order"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Is Teachings?</label>
                  <p className="text-xs text-muted-foreground">For spiritual teachings content</p>
                </div>
                <Switch
                  checked={editingCategory.isTeachings}
                  onCheckedChange={(checked) => setEditingCategory({...editingCategory, isTeachings: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Active</label>
                  <p className="text-xs text-muted-foreground">Enable this category</p>
                </div>
                <Switch
                  checked={editingCategory.isActive}
                  onCheckedChange={(checked) => setEditingCategory({...editingCategory, isActive: checked})}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setEditingCategory(null)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateCategory} 
                disabled={updatingCategory}
              >
                {updatingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Category Confirmation Modal */}
      {deletingCategory && (
        <Dialog 
          open={!!deletingCategory} 
          onOpenChange={(open) => !open && setDeletingCategory(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Category</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-sm">
                Are you sure you want to delete the category "<strong>{deletingCategory.category.name}</strong>"? 
                This action cannot be undone.
              </p>
              
              <p className="text-sm text-muted-foreground">
                Note: You can only delete categories that have no threads. If this category has threads, 
                you must move them to another category first.
              </p>
              
              <div className="text-sm">
                Type "<strong>DELETE</strong>" to confirm:
                <Input
                  value={deletingCategory.confirmText}
                  onChange={(e) => setDeletingCategory({
                    ...deletingCategory, 
                    confirmText: e.target.value
                  })}
                  placeholder="Confirm deletion"
                  className="mt-2"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setDeletingCategory(null)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteCategory} 
                disabled={
                  deletingCategory.confirmText !== 'DELETE' || 
                  deletingCategoryOp
                }
              >
                {deletingCategoryOp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Move Thread Modal */}
      {movingThread && showMoveThreadModal && (
        <Dialog 
          open={showMoveThreadModal} 
          onOpenChange={setShowMoveThreadModal}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Move Thread</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-sm">
                Moving thread "<strong>{movingThread.thread.title}</strong>" from category "{movingThread.thread.category.name}"
              </p>
              
              <div>
                <label className="text-sm font-medium">Target Category</label>
                <Select 
                  value={movingThread.targetCategoryId}
                  onValueChange={(value) => setMovingThread({
                    ...movingThread,
                    targetCategoryId: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter(cat => cat.id !== movingThread.thread.categoryId)
                      .map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowMoveThreadModal(false);
                  setMovingThread(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleMoveThread} 
                disabled={!movingThread.targetCategoryId || movingThreadOp}
              >
                {movingThreadOp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Move Thread'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Merge Threads Modal */}
      {showMergeThreadsModal && (
        <Dialog 
          open={showMergeThreadsModal} 
          onOpenChange={setShowMergeThreadsModal}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Merge Threads</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select two threads to merge. All posts from the secondary thread will be moved to the primary thread, 
                and the secondary thread will be deleted.
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Primary Thread (keep)</label>
                  <Select 
                    value={mergingThreads?.primaryId}
                    onValueChange={(value) => setMergingThreads({
                      ...mergingThreads!,
                      primaryId: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select primary thread" />
                    </SelectTrigger>
                    <SelectContent>
                      {threads.map(thread => (
                        <SelectItem key={thread.id} value={thread.id}>
                          {thread.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Secondary Thread (delete)</label>
                  <Select 
                    value={mergingThreads?.secondaryId}
                    onValueChange={(value) => setMergingThreads({
                      ...mergingThreads!,
                      secondaryId: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select secondary thread" />
                    </SelectTrigger>
                    <SelectContent>
                      {threads
                        .filter(t => t.id !== mergingThreads?.primaryId)
                        .map(thread => (
                          <SelectItem key={thread.id} value={thread.id}>
                            {thread.title}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowMergeThreadsModal(false);
                  setMergingThreads(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleMergeThreads} 
                disabled={
                  !mergingThreads?.primaryId || 
                  !mergingThreads?.secondaryId || 
                  mergingThreadsOp
                }
              >
                {mergingThreadsOp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Merge Threads'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ForumManagementTab;