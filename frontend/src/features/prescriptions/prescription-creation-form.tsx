import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, X, AlertCircle, Loader2, BookOpen } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';
import { Currency } from '@common';
import { getDemoAppointmentById, getDemoUserById } from '@/demo';
// import { getDemoAppointment } from '@/demo';

interface GuidancePlanItem {
  name: string;
  quantity: number;
  description?: string;
  cost: number;
}

// Appointment interface (for future typing if needed)
// interface Appointment {
//   id: string;
//   date: string;
//   time: string;
//   status: string;
//   client: {
//     id: string;
//     name: string;
//   };
// }

interface GuidancePlanCreationFormProps {
  appointmentId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Guidance Plan Creation Form (Babalawo)
 * NOTE: Only enabled after appointment status = COMPLETED (divination required)
 */
const GuidancePlanCreationForm: React.FC<GuidancePlanCreationFormProps> = ({
  appointmentId,
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const [type, setType] = useState<'AKOSE' | 'EBO' | 'BOTH'>('AKOSE');
  const [items, setItems] = useState<GuidancePlanItem[]>([
    { name: '', quantity: 1, cost: 0 },
  ]);
  const [instructions, setInstructions] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canCreate, setCanCreate] = useState(false);

  // Fetch appointment to check status
  const { data: appointment, isLoading: loadingAppointment } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: async () => {
      try {
        const response = await api.get(`/appointments/${appointmentId}`);
        return response.data;
      } catch (e) {
        logger.error('Failed to fetch appointment', e);
        return getDemoAppointmentById(appointmentId);
      }
    },
    enabled: !!appointmentId,
  });

  // Check if appointment is completed
  useEffect(() => {
    if (appointment) {
      if (appointment.status === 'COMPLETED') {
        setCanCreate(true);
        setError(null);
      } else {
        setCanCreate(false);
        setError(
          'Guidance plan can only be created after divination session is completed. Please mark the appointment as completed first.'
        );
      }
    }
  }, [appointment]);

  const createGuidancePlanMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await api.post(`/guidance-plans/${user?.id}`, data);
        return response.data;
      } catch (error) {
        const demoAppointment = getDemoAppointmentById(appointmentId);
        const babalawo = getDemoUserById(user?.id || '') || getDemoUserById(demoAppointment?.babalawoId || '');
        const client = getDemoUserById(demoAppointment?.clientId || '');
        const demoPlan = {
          id: `demo-plan-${Date.now()}`,
          type: data.type,
          items: data.items,
          totalCost: data.totalCost,
          platformServiceFee: 0,
          currency: data.currency || Currency.NGN,
          instructions: data.instructions,
          status: 'PENDING',
          appointment: {
            id: appointmentId,
            date: demoAppointment?.date || '2026-02-10',
            time: demoAppointment?.time || '10:00',
          },
          babalawo: {
            id: babalawo?.id || user?.id || 'demo-baba-1',
            name: babalawo?.name || 'Babalawo',
            yorubaName: babalawo?.yorubaName,
          },
          client: {
            id: client?.id || demoAppointment?.clientId || 'demo-client-1',
            name: client?.name || 'Client',
          },
          createdAt: new Date().toISOString(),
        };
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(`demo-guidance-plan:${demoPlan.id}`, JSON.stringify(demoPlan));
        }
        return demoPlan;
      }
    },
    onSuccess: () => {
      onSuccess?.();
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create guidance plan');
      setIsSubmitting(false);
    },
  });

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1, cost: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof GuidancePlanItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.cost * item.quantity, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (items.some((item) => !item.name || item.cost <= 0)) {
      setError('Please fill in all item details');
      return;
    }

    setIsSubmitting(true);

    const totalCost = calculateTotal();

    try {
      await createGuidancePlanMutation.mutateAsync({
        appointmentId,
        type,
        items,
        totalCost,
        currency: Currency.NGN,
        instructions,
        notes,
      });
    } catch (error) {
      // Error handled in mutation
    }
  };

  if (loadingAppointment) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-highlight" />
      </div>
    );
  }

  return (
    <div className="bg-background border border-white/10 rounded-xl p-6 space-y-6">
      {/* Cultural Disclaimer */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-yellow-400">Cultural Integrity Notice</p>
            <p className="text-sm text-muted">
              Akose/Ebo are sacred guidance plans—not products. They are spiritual remedies
              prescribed after divination and should be treated with respect and reverence.
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-400">Cannot Create Guidance Plan</p>
              <p className="text-sm text-muted mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Guidance Plan Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Guidance Plan Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="AKOSE"
                checked={type === 'AKOSE'}
                onChange={(e) => setType(e.target.value as any)}
                disabled={!canCreate}
                className="w-4 h-4 text-highlight"
              />
              <span>Akose</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="EBO"
                checked={type === 'EBO'}
                onChange={(e) => setType(e.target.value as any)}
                disabled={!canCreate}
                className="w-4 h-4 text-highlight"
              />
              <span>Ebo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="BOTH"
                checked={type === 'BOTH'}
                onChange={(e) => setType(e.target.value as any)}
                disabled={!canCreate}
                className="w-4 h-4 text-highlight"
              />
              <span>Both</span>
            </label>
          </div>
        </div>

        {/* Guidance Plan Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium">Guidance Plan Items</label>
            <button
              type="button"
              onClick={addItem}
              disabled={!canCreate}
              className="px-3 py-1 text-sm bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted">
                    Item {index + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={!canCreate}
                      className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">Name *</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      disabled={!canCreate}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-highlight disabled:opacity-50"
                      placeholder="Item name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-muted mb-1">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      disabled={!canCreate}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-highlight disabled:opacity-50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-muted mb-1">Cost (NGN) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.cost}
                      onChange={(e) => updateItem(index, 'cost', parseFloat(e.target.value) || 0)}
                      disabled={!canCreate}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-highlight disabled:opacity-50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-muted mb-1">Description</label>
                    <input
                      type="text"
                      value={item.description || ''}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      disabled={!canCreate}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-highlight disabled:opacity-50"
                      placeholder="Optional description"
                    />
                  </div>
                </div>

                <div className="text-right text-sm text-muted">
                  Subtotal: ₦{(item.cost * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-highlight/10 border border-highlight/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Cost:</span>
              <span className="text-2xl font-bold text-highlight">
                ₦{calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium mb-2">Instructions for Client</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            disabled={!canCreate}
            rows={4}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-highlight disabled:opacity-50"
            placeholder="Provide instructions on how to use or prepare the guidance plan items..."
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">Notes (Private)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={!canCreate}
            rows={2}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-highlight disabled:opacity-50"
            placeholder="Private notes (not visible to client)..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!canCreate || isSubmitting}
            className="flex-1 px-4 py-3 bg-highlight text-white rounded-lg font-medium hover:bg-highlight/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4" />
                Create Guidance Plan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GuidancePlanCreationForm;
