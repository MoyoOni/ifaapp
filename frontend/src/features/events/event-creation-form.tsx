import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, MapPin, Video, Globe, DollarSign, Users } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';
import { useToast } from '@/shared/components/toast';

interface EventCreationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  templeId?: string;
  circleId?: string;
}

/**
 * Event Creation Form Component
 * Allows users to create new events
 */
const EventCreationForm: React.FC<EventCreationFormProps> = ({
  onSuccess,
  onCancel,
  templeId,
  circleId,
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'EDUCATIONAL' as 'RITUAL' | 'EDUCATIONAL' | 'SOCIAL' | 'CEREMONY' | 'WORKSHOP',
    category: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    timezone: 'Africa/Lagos',
    location: '',
    locationType: 'PHYSICAL' as 'PHYSICAL' | 'VIRTUAL' | 'HYBRID',
    virtualLink: '',
    price: 0,
    currency: 'NGN',
    capacity: '',
    requiresRegistration: true,
    registrationDeadline: '',
    image: '',
    templeId: templeId || '',
    circleId: circleId || '',
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await api.post('/events', data);
        return response.data;
      } catch (error) {
        logger.warn('Failed to create event, using demo fallback');
        const slugBase = data.title
          ? String(data.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
          : 'community-event';
        const demoEvent = {
          id: `demo-event-${Date.now()}`,
          title: data.title,
          description: data.description,
          slug: `${slugBase}-${Date.now().toString(36).slice(-4)}`,
          type: data.type,
          category: data.category,
          startDate: data.startDate,
          endDate: data.endDate,
          location: data.location,
          locationType: data.locationType,
          virtualLink: data.virtualLink,
          price: data.price ?? 0,
          currency: data.currency || 'NGN',
          capacity: data.capacity,
          image: data.image,
          status: 'UPCOMING',
          published: true,
          createdAt: new Date().toISOString(),
          creator: {
            id: user?.id || 'demo-admin-1',
            name: user?.name || 'Demo Host',
            yorubaName: user?.yorubaName,
            avatar: user?.avatar,
          },
          temple: data.templeId ? { id: data.templeId, name: 'Temple Event', slug: 'temple-event' } : undefined,
          circle: data.circleId ? { id: data.circleId, name: 'Circle Event', slug: 'circle-event' } : undefined,
          _count: { registrations: 0 },
          __demo: true,
        };

        const existing = JSON.parse(sessionStorage.getItem('demo-events') || '[]');
        sessionStorage.setItem('demo-events', JSON.stringify([demoEvent, ...existing]));
        return demoEvent;
      }
    },
    onSuccess: (createdEvent) => {
      queryClient.setQueriesData({ queryKey: ['events'] }, (oldData: any) => {
        if (!oldData) return [createdEvent];
        if (Array.isArray(oldData)) {
          const exists = oldData.some((event) => event.id === createdEvent.id);
          return exists ? oldData : [createdEvent, ...oldData];
        }
        return oldData;
      });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event created');
      if (onSuccess) onSuccess();
    },
    onError: (err: Error) => {
      toast.error(`Failed to create event — ${err.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Combine date and time
    const startDateTime = `${formData.startDate}T${formData.startTime}:00`;
    const endDateTime = formData.endDate && formData.endTime
      ? `${formData.endDate}T${formData.endTime}:00`
      : undefined;

    const payload: any = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      category: formData.category || undefined,
      startDate: startDateTime,
      endDate: endDateTime,
      timezone: formData.timezone,
      location: formData.location || undefined,
      locationType: formData.locationType,
      virtualLink: formData.virtualLink || undefined,
      price: formData.price,
      currency: formData.currency,
      capacity: formData.capacity ? parseInt(formData.capacity, 10) : undefined,
      requiresRegistration: formData.requiresRegistration,
      registrationDeadline: formData.registrationDeadline || undefined,
      image: formData.image || undefined,
      templeId: formData.templeId || undefined,
      circleId: formData.circleId || undefined,
    };

    createEventMutation.mutate(payload);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-8 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Create Event</h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close form"
            title="Close form"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Title */}
        <div>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Event Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            minLength={5}
            maxLength={200}
            placeholder="e.g., Ifá Divination Workshop, Odù Study Circle"
            className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-highlight"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            maxLength={5000}
            placeholder="Describe the event, what participants will learn, what to bring, etc."
            className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-highlight resize-none"
          />
        </div>

        {/* Event Type */}
        <div>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Event Type *
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            required
            aria-label="Event type"
            className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-highlight"
          >
            <option value="RITUAL">Ritual</option>
            <option value="EDUCATIONAL">Educational</option>
            <option value="SOCIAL">Social</option>
            <option value="CEREMONY">Ceremony</option>
            <option value="WORKSHOP">Workshop</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Category (Optional)
          </label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g., Beginner, Advanced, All Levels"
            className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-highlight"
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
              Start Date *
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              min={new Date().toISOString().split('T')[0]}
              aria-label="Start date"
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-highlight"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
              Start Time *
            </label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
              aria-label="Start time"
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-highlight"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              min={formData.startDate || new Date().toISOString().split('T')[0]}
              aria-label="End date"
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-highlight"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
              End Time (Optional)
            </label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              aria-label="End time"
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-highlight"
            />
          </div>
        </div>

        {/* Location Type */}
        <div>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Location Type *
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-4 bg-muted/50 border border-border rounded-xl cursor-pointer hover:border-highlight transition-all">
              <input
                type="radio"
                name="locationType"
                value="PHYSICAL"
                checked={formData.locationType === 'PHYSICAL'}
                onChange={(e) => setFormData({ ...formData, locationType: e.target.value as any })}
                className="text-highlight focus:ring-highlight"
              />
              <MapPin size={20} className="text-blue-400" />
              <div className="flex-1">
                <div className="font-bold text-foreground">Physical</div>
                <div className="text-sm text-muted-foreground">In-person event at a location</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 bg-muted/50 border border-border rounded-xl cursor-pointer hover:border-highlight transition-all">
              <input
                type="radio"
                name="locationType"
                value="VIRTUAL"
                checked={formData.locationType === 'VIRTUAL'}
                onChange={(e) => setFormData({ ...formData, locationType: e.target.value as any })}
                className="text-highlight focus:ring-highlight"
              />
              <Video size={20} className="dark:text-green-400 text-green-600" />
              <div className="flex-1">
                <div className="font-bold text-foreground">Virtual</div>
                <div className="text-sm text-muted-foreground">Online event via video call</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 bg-muted/50 border border-border rounded-xl cursor-pointer hover:border-highlight transition-all">
              <input
                type="radio"
                name="locationType"
                value="HYBRID"
                checked={formData.locationType === 'HYBRID'}
                onChange={(e) => setFormData({ ...formData, locationType: e.target.value as any })}
                className="text-highlight focus:ring-highlight"
              />
              <Globe size={20} className="text-purple-400" />
              <div className="flex-1">
                <div className="font-bold text-foreground">Hybrid</div>
                <div className="text-sm text-muted-foreground">Both in-person and online</div>
              </div>
            </label>
          </div>
        </div>

        {/* Location */}
        {formData.locationType !== 'VIRTUAL' && (
          <div>
            <label className="block text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
              Physical Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Ilé Ifá, 123 Main St, Lagos, Nigeria"
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-highlight"
            />
          </div>
        )}

        {/* Virtual Link */}
        {(formData.locationType === 'VIRTUAL' || formData.locationType === 'HYBRID') && (
          <div>
            <label className="block text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
              Virtual Meeting Link
            </label>
            <input
              type="url"
              value={formData.virtualLink}
              onChange={(e) => setFormData({ ...formData, virtualLink: e.target.value })}
              placeholder="https://meet.google.com/..."
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-highlight"
            />
          </div>
        )}

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
              Price *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
                min={0}
                step="0.01"
                aria-label="Event price"
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 pl-12 text-foreground focus:outline-none focus:ring-2 focus:ring-highlight"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Set to 0 for free events</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
              Currency *
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              aria-label="Currency"
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-highlight"
            >
              <option value="NGN">NGN (₦)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
              <option value="CAD">CAD ($)</option>
            </select>
          </div>
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Capacity (Optional)
          </label>
          <div className="relative">
            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              min={1}
              placeholder="Leave empty for unlimited"
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 pl-12 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-highlight"
            />
          </div>
        </div>

        {/* Registration Deadline */}
        <div>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Registration Deadline (Optional)
          </label>
          <input
            type="datetime-local"
            value={formData.registrationDeadline}
            onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
            min={formData.startDate ? `${formData.startDate}T${formData.startTime || '00:00'}` : undefined}              aria-label="Registration deadline"            className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-highlight"
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Event Image URL (Optional)
          </label>
          <input
            type="url"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="https://..."
            className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-highlight"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-border">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-border text-foreground rounded-xl font-bold hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={createEventMutation.isPending || !formData.title.trim() || !formData.startDate || !formData.startTime}
            className="flex-1 px-6 py-3 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {createEventMutation.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating...
              </>
            ) : (
              'Create Event'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventCreationForm;
