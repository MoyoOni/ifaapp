import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UserPlus, Shield, Trash2, Edit, Search } from 'lucide-react';
import { AdminSubRole } from '@common';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';
import { useModal } from '@/components/common/ModalProvider';

interface AdminMember {
  id: string;
  email: string;
  name: string;
  adminSubRole: string | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

const SUB_ROLE_OPTIONS: { value: AdminSubRole; label: string; description: string }[] = [
  { value: AdminSubRole.SUPER, label: 'Super Admin', description: 'Full access to all tabs' },
  { value: AdminSubRole.FINANCE, label: 'Finance', description: 'Payout approvals, analytics, fraud' },
  { value: AdminSubRole.COMPLIANCE, label: 'Compliance', description: 'Verification queue, quality assurance' },
  { value: AdminSubRole.SUPPORT, label: 'Support', description: 'User management, disputes' },
  { value: AdminSubRole.MODERATOR, label: 'Moderator', description: 'Content moderation, circle management' },
];

const getRoleBadgeColor = (role: string | null) => {
  switch (role) {
    case 'SUPER': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'FINANCE': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'COMPLIANCE': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'SUPPORT': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'MODERATOR': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

const AdminManagementView: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const { showModal } = useModal();

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminMember | null>(null);

  // Form state
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formSubRole, setFormSubRole] = useState<string>(AdminSubRole.SUPPORT);
  const [formSendInvite, setFormSendInvite] = useState(true);

  const { data: admins = [], isLoading, isError, refetch } = useQuery<AdminMember[]>({
    queryKey: ['admin-admins', filterRole],
    queryFn: async () => {
      const params = filterRole ? `?adminSubRole=${filterRole}` : '';
      const res = await api.get(`/admin/admins${params}`);
      return res.data;
    },
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (body: { email: string; name: string; adminSubRole: string; sendInvite?: boolean }) => {
      const res = await api.post('/admin/manage-admins', body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-admins'] });
      success(editingAdmin ? 'Admin role updated' : 'Admin created successfully');
      resetForm();
    },
    onError: (err: any) => {
      toastError(err?.response?.data?.message || 'Failed to save admin');
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/admin/admins/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-admins'] });
      success('Admin privileges removed');
    },
    onError: (err: any) => {
      toastError(err?.response?.data?.message || 'Failed to remove admin');
    },
  });

  const resetForm = () => {
    setShowAddForm(false);
    setEditingAdmin(null);
    setFormEmail('');
    setFormName('');
    setFormSubRole(AdminSubRole.SUPPORT);
    setFormSendInvite(true);
  };

  const handleEdit = (admin: AdminMember) => {
    setEditingAdmin(admin);
    setFormEmail(admin.email);
    setFormName(admin.name);
    setFormSubRole(admin.adminSubRole || AdminSubRole.SUPPORT);
    setFormSendInvite(false);
    setShowAddForm(true);
  };

  const handleRemove = (admin: AdminMember) => {
    showModal({
      title: 'Remove Admin Privileges',
      message: `Are you sure you want to remove admin privileges from "${admin.name}" (${admin.email})? They will be demoted to CLIENT role.`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      onConfirm: () => removeMutation.mutate(admin.id),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrUpdateMutation.mutate({
      email: formEmail.trim(),
      name: formName.trim(),
      adminSubRole: formSubRole,
      sendInvite: formSendInvite,
    });
  };

  const filteredAdmins = admins.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
  });

  if (isError) {
    return (
      <div className="bg-card rounded-2xl p-8 border border-border text-center">
        <Shield className="mx-auto mb-4 text-muted-foreground" size={48} />
        <h2 className="text-lg font-bold text-foreground mb-2">Failed to Load Admins</h2>
        <p className="text-muted-foreground text-sm mb-4">Could not fetch admin list from the server.</p>
        <button onClick={() => refetch()} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Shield size={24} /> Admin Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage admin accounts and sub-role permissions. Super Admin only.
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => { resetForm(); setShowAddForm(true); }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2 self-start"
          >
            <UserPlus size={16} /> Add Admin
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 border border-border space-y-4"
          onSubmit={handleSubmit}
        >
          <h3 className="text-base font-bold text-foreground">
            {editingAdmin ? 'Edit Admin Role' : 'Add New Admin'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                disabled={!!editingAdmin}
                placeholder="admin@example.com"
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Name</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Full name"
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Sub-Role</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {SUB_ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormSubRole(opt.value)}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    formSubRole === opt.value
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-foreground/30'
                  }`}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs opacity-70">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>
          {!editingAdmin && (
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={formSendInvite}
                onChange={(e) => setFormSendInvite(e.target.checked)}
                className="rounded border-border"
              />
              Send email invite to this admin
            </label>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={createOrUpdateMutation.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {createOrUpdateMutation.isPending ? 'Saving...' : editingAdmin ? 'Update Role' : 'Create Admin'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-muted text-muted-foreground rounded-xl font-medium hover:opacity-80 transition-opacity"
            >
              Cancel
            </button>
          </div>
        </motion.form>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Search admins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          aria-label="Filter by admin sub-role"
          className="px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Roles</option>
          {SUB_ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Admin List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse h-16 bg-muted rounded-xl" />
          ))}
        </div>
      ) : filteredAdmins.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 border border-border text-center">
          <Shield className="mx-auto mb-4 text-muted-foreground" size={48} />
          <p className="text-muted-foreground text-sm">
            {search || filterRole ? 'No admins match your filters.' : 'No admin accounts found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAdmins.map((admin) => (
            <motion.div
              key={admin.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-xl p-4 border border-border flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground truncate">{admin.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getRoleBadgeColor(admin.adminSubRole)}`}>
                    {admin.adminSubRole || 'UNSET'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{admin.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Added {new Date(admin.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleEdit(admin)}
                  className="px-3 py-1.5 text-sm bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors flex items-center gap-1"
                >
                  <Edit size={14} /> Edit Role
                </button>
                <button
                  onClick={() => handleRemove(admin)}
                  disabled={removeMutation.isPending}
                  className="px-3 py-1.5 text-sm bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminManagementView;
