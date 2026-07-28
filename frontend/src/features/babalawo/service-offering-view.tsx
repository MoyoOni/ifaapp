import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Trash2, Save, X } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { useToast } from '@/shared/components/toast';
import { Skeleton } from '@/shared/components/ui';

interface ServiceOffering {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceAmount: number;
  priceCurrency: string;
  isActive: boolean;
  category: string;
  maxSessionsPerDay?: number | null;
}

type ServiceOfferingDraft = Omit<ServiceOffering, 'id' | 'priceCurrency'>;

const EMPTY_DRAFT: ServiceOfferingDraft = {
  name: '',
  description: '',
  durationMinutes: 30,
  priceAmount: 5000,
  isActive: true,
  category: '',
};

const ServiceOfferingView: React.FC = () => {
  const { user } = useAuth();
  const babalawoId = user?.id ?? '';
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: services = [], isLoading } = useQuery<ServiceOffering[]>({
    queryKey: ['service-offerings', babalawoId],
    queryFn: async () => (await api.get(`/babalawo/${babalawoId}/service-offerings`)).data,
    enabled: !!babalawoId,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ServiceOfferingDraft>(EMPTY_DRAFT);
  const [newService, setNewService] = useState<ServiceOfferingDraft>(EMPTY_DRAFT);
  const [showAddForm, setShowAddForm] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['service-offerings', babalawoId] });

  const createMutation = useMutation({
    mutationFn: (dto: ServiceOfferingDraft) => api.post(`/babalawo/${babalawoId}/service-offerings`, dto),
    onSuccess: () => {
      invalidate();
      toast.success('Service added');
    },
    onError: (err: Error) => toast.error(`Failed to add service — ${err.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<ServiceOfferingDraft> }) =>
      api.patch(`/babalawo/${babalawoId}/service-offerings/${id}`, dto),
    onSuccess: () => {
      invalidate();
      toast.success('Service updated');
    },
    onError: (err: Error) => toast.error(`Failed to update service — ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/babalawo/${babalawoId}/service-offerings/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success('Service removed');
    },
    onError: (err: Error) => toast.error(`Failed to remove service — ${err.message}`),
  });

  const handleEdit = (service: ServiceOffering) => {
    setEditingId(service.id);
    setEditDraft({
      name: service.name,
      description: service.description,
      durationMinutes: service.durationMinutes,
      priceAmount: service.priceAmount,
      isActive: service.isActive,
      category: service.category,
      maxSessionsPerDay: service.maxSessionsPerDay,
    });
  };

  const handleSave = (id: string) => {
    updateMutation.mutate({ id, dto: editDraft });
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setNewService(EMPTY_DRAFT);
    setShowAddForm(false);
  };

  const handleAddService = () => {
    createMutation.mutate(newService);
    handleCancel();
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const getServicePrice = (price: number) => `₦${price.toLocaleString()}`;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        {Array.from({ length: 2 }).map((_, idx) => (
          <div key={idx} className="border rounded-xl p-6 bg-card space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-foreground">Service Offerings</h1>
          <p className="text-muted-foreground text-lg mt-1">
            Manage your spiritual services and offerings
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-highlight text-white font-bold rounded-xl shadow-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> Add New Service
        </button>
      </div>

      {/* Add New Service Form */}
      {showAddForm && (
        <div className="border rounded-xl p-6 bg-card shadow-sm">
          <h3 className="text-xl font-semibold mb-4">Add New Service</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Service Name</label>
              <input
                type="text"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-highlight focus:border-highlight"
                placeholder="Enter service name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Category</label>
              <input
                type="text"
                value={newService.category}
                onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-highlight focus:border-highlight"
                placeholder="e.g., Consultation, Healing, Education"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={newService.durationMinutes}
                onChange={(e) => setNewService({ ...newService, durationMinutes: parseInt(e.target.value) || 30 })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-highlight focus:border-highlight"
                min="15"
                step="15"
                aria-label="Service duration in minutes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Price (₦)</label>
              <input
                type="number"
                value={newService.priceAmount}
                onChange={(e) => setNewService({ ...newService, priceAmount: parseInt(e.target.value) || 5000 })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-highlight focus:border-highlight"
                min="1000"
                step="1000"
                aria-label="Service price in Naira"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">Description</label>
              <textarea
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-highlight focus:border-highlight"
                rows={3}
                placeholder="Describe your service..."
              />
            </div>

            <div className="md:col-span-2 flex items-center">
              <input
                type="checkbox"
                id="isActiveNew"
                checked={newService.isActive}
                onChange={(e) => setNewService({ ...newService, isActive: e.target.checked })}
                className="h-4 w-4 text-highlight focus:ring-highlight border-border rounded"
              />
              <label htmlFor="isActiveNew" className="ml-2 block text-sm text-foreground">
                Active Service
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-background flex items-center gap-2"
            >
              <X size={16} /> Cancel
            </button>
            <button
              onClick={handleAddService}
              disabled={!newService.name || !newService.description || createMutation.isPending}
              className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 ${
                !newService.name || !newService.description
                  ? 'bg-muted-foreground cursor-not-allowed'
                  : 'bg-highlight hover:bg-yellow-600'
              }`}
            >
              <Save size={16} /> Add Service
            </button>
          </div>
        </div>
      )}

      {/* Services List */}
      <div className="space-y-6">
        {services.length === 0 && !showAddForm && (
          <div className="text-center py-12 bg-muted/40 rounded-xl border border-border">
            <p className="text-muted-foreground">No service offerings yet. Add your first one above.</p>
          </div>
        )}
        {services.map((service) => (
          <div key={service.id} className="border rounded-xl p-6 bg-card shadow-sm">
            {editingId === service.id ? (
              // Edit Mode
              <div>
                <h3 className="text-xl font-semibold mb-4">Edit Service</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Service Name</label>
                    <input
                      type="text"
                      value={editDraft.name}
                      onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-highlight focus:border-highlight"
                      aria-label="Service name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                    <input
                      type="text"
                      value={editDraft.category}
                      onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-highlight focus:border-highlight"
                      aria-label="Service category"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Duration (minutes)</label>
                    <input
                      type="number"
                      value={editDraft.durationMinutes}
                      onChange={(e) => setEditDraft({ ...editDraft, durationMinutes: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-highlight focus:border-highlight"
                      min="15"
                      step="15"
                      aria-label="Service duration in minutes"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Price (₦)</label>
                    <input
                      type="number"
                      value={editDraft.priceAmount}
                      onChange={(e) => setEditDraft({ ...editDraft, priceAmount: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-highlight focus:border-highlight"
                      min="1000"
                      step="1000"
                      aria-label="Service price in Naira"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                    <textarea
                      value={editDraft.description}
                      onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-highlight focus:border-highlight"
                      rows={3}
                      aria-label="Service description"
                      placeholder="Describe your service..."
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center">
                    <input
                      type="checkbox"
                      id={`isActive-${service.id}`}
                      checked={editDraft.isActive}
                      onChange={(e) => setEditDraft({ ...editDraft, isActive: e.target.checked })}
                      className="h-4 w-4 text-highlight focus:ring-highlight border-border rounded"
                    />
                    <label htmlFor={`isActive-${service.id}`} className="ml-2 block text-sm text-foreground">
                      Active Service
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-background flex items-center gap-2"
                  >
                    <X size={16} /> Cancel
                  </button>
                  <button
                    onClick={() => handleSave(service.id)}
                    className="px-4 py-2 bg-highlight text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2"
                  >
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-foreground">{service.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        service.isActive
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                      }`}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1">{service.category}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="p-2 text-muted-foreground hover:text-highlight hover:bg-muted rounded-lg"
                      title="Edit"
                      aria-label="Edit service"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="p-2 text-muted-foreground hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-950/30 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <p className="mt-4 text-foreground">{service.description}</p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/60">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-semibold">{service.durationMinutes} min</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="font-semibold">{getServicePrice(service.priceAmount)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Sessions/Day</p>
                    <p className="font-semibold">{service.maxSessionsPerDay || 'Unlimited'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className={`font-semibold ${
                      service.isActive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {service.isActive ? 'Available' : 'Hidden'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceOfferingView;
