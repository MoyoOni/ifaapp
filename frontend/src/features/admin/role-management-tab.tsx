import React, { useState, useEffect } from 'react';
import { Shield, Plus, Save, Edit3, Eye } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { useToast } from '@/shared/components/toast';
import api from '@/lib/api';

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

const RoleManagementTab: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    isActive: true,
  });
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();
  const queryClient = useQueryClient();

  // Fetch roles
  const { data: fetchedRoles, isLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const response = await api.get('/admin/roles');
      return response.data as Role[];
    },
    staleTime: 30000, // 30 seconds
  });

  useEffect(() => {
    if (fetchedRoles) {
      setRoles(fetchedRoles);
      
      // Extract all unique permissions for the permission picker
      const allPermissions = Array.from(new Set(fetchedRoles.flatMap(role => role.permissions)));
      setAvailablePermissions(allPermissions);
    }
  }, [fetchedRoles]);

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await api.post('/admin/roles', roleData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Role created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create role');
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, ...roleData }: Role) => {
      const response = await api.put(`/admin/roles/${id}`, roleData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update role');
    },
  });

  // Handle modal open/close
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setNewRole({
      name: '',
      description: '',
      permissions: [],
      isActive: true,
    });
    setEditingRole(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role: Role) => {
    setModalMode('edit');
    setEditingRole(role);
    setNewRole({
      name: role.name,
      description: role.description || '',
      permissions: [...role.permissions],
      isActive: role.isActive,
    });
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (role: Role) => {
    setModalMode('view');
    setEditingRole(role);
    setNewRole({
      name: role.name,
      description: role.description || '',
      permissions: [...role.permissions],
      isActive: role.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSaveRole = () => {
    if (modalMode === 'create') {
      createRoleMutation.mutate({
        name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions,
        isActive: newRole.isActive,
      });
    } else if (editingRole) {
      updateRoleMutation.mutate({
        ...editingRole,
        name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions,
        isActive: newRole.isActive,
      });
    }
  };

  // Toggle permission in newRole
  const togglePermission = (permission: string) => {
    setNewRole(prev => {
      if (prev.permissions.includes(permission)) {
        return {
          ...prev,
          permissions: prev.permissions.filter(p => p !== permission),
        };
      } else {
        return {
          ...prev,
          permissions: [...prev.permissions, permission],
        };
      }
    });
  };

  // Filter roles based on search term
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Shield size={22} />
            Role Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage user roles and their associated permissions
          </p>
        </div>
        <Button onClick={handleOpenCreateModal} className="flex items-center gap-2">
          <Plus size={16} />
          Create Role
        </Button>
      </div>

      <div className="bg-card p-6 rounded-xl border border-border">
        <div className="mb-6">
          <Input
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Loading roles...</p>
        ) : filteredRoles.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No roles found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoles.map(role => (
              <div 
                key={role.id} 
                className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      {role.name}
                      {role.isActive ? (
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Inactive</Badge>
                      )}
                    </h3>
                    {role.description && (
                      <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {role.permissions.length} permissions
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenViewModal(role)}
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditModal(role)}
                    >
                      <Edit3 size={16} />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-3 flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {role.permissions.slice(0, 5).map(permission => (
                    <Badge key={permission} variant="outline" className="text-xs">
                      {permission}
                    </Badge>
                  ))}
                  {role.permissions.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{role.permissions.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalMode === 'create' ? 'Create New Role' : 
               modalMode === 'edit' ? 'Edit Role' : 'View Role Permissions'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                value={newRole.name}
                onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                disabled={modalMode === 'view'}
                placeholder="Enter role name"
              />
            </div>
            
            <div>
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                value={newRole.description}
                onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                disabled={modalMode === 'view'}
                placeholder="Enter role description"
                rows={3}
              />
            </div>
            
            <div>
              <Label>Status</Label>
              <div className="flex items-center gap-2 mt-2">
                <Checkbox
                  id="role-status"
                  checked={newRole.isActive}
                  onCheckedChange={(checked) => setNewRole({...newRole, isActive: !!checked})}
                  disabled={modalMode === 'view'}
                />
                <label htmlFor="role-status" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Active
                </label>
              </div>
            </div>
            
            <div>
              <Label>Permissions</Label>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-border rounded">
                {availablePermissions.map(permission => (
                  <div key={permission} className="flex items-center gap-2 p-2 hover:bg-muted rounded">
                    <Checkbox
                      id={`perm-${permission}`}
                      checked={newRole.permissions.includes(permission)}
                      onCheckedChange={() => togglePermission(permission)}
                      disabled={modalMode === 'view'}
                    />
                    <label 
                      htmlFor={`perm-${permission}`} 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 truncate"
                      title={permission}
                    >
                      {permission}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {modalMode !== 'view' && (
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveRole}
                disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
              >
                {createRoleMutation.isPending || updateRoleMutation.isPending ? (
                  <>
                    <Save className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Role
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManagementTab;