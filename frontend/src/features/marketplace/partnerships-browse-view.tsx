import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users2, Calendar, ArrowRight, Plus } from 'lucide-react';
import { FeatureHeader } from '@/shared/components/feature-header';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { useToast } from '@/shared/components/toast';

interface PartnershipMember {
  id: string;
  businessName: string;
}

interface Partnership {
  id: string;
  name: string;
  description?: string;
  members: PartnershipMember[];
  plannedEvent?: { id: string; title: string; date: string } | null;
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
}

// SHOP_BACKLOG.md MSP-005: public listing of declared vendor partnerships --
// visible to buyers too, not just vendors, since transparency about who's
// collaborating builds trust (consistent with this doc's own principles).
const PartnershipsBrowseView: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const isVendor = user?.role === 'VENDOR' || user?.role === 'ADMIN';
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [plannedEventId, setPlannedEventId] = useState('');

  const { data: partnerships = [], isLoading } = useQuery<Partnership[]>({
    queryKey: ['vendor-partnerships'],
    queryFn: async () => (await api.get('/marketplace/partnerships')).data,
  });

  // Reuses MSP-008's existing upcoming-events endpoint rather than a new one.
  const { data: upcoming } = useQuery<{ upcomingEvents: UpcomingEvent[] }>({
    queryKey: ['marketplace-upcoming-events'],
    queryFn: async () => (await api.get('/marketplace/products/upcoming-events')).data,
    enabled: showForm,
  });

  const createPartnership = useMutation({
    mutationFn: () =>
      api.post('/marketplace/partnerships', {
        name,
        description: description || undefined,
        plannedEventId: plannedEventId || undefined,
      }),
    onSuccess: () => {
      success('Partnership formed! A coordination thread was created in the Vendor Circle.');
      setShowForm(false);
      setName('');
      setDescription('');
      setPlannedEventId('');
      queryClient.invalidateQueries({ queryKey: ['vendor-partnerships'] });
    },
    onError: (err: any) => error(err?.response?.data?.error?.userMessage || 'Could not form partnership'),
  });

  return (
    <div className="py-6 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <FeatureHeader
        feature="marketplace"
        title="Vendor Partnerships"
        subtitle="Vendors collaborating on joint offerings, shared teachings, and community initiatives."
        icon={Users2}
      />

      {isAuthenticated && isVendor && (
        <div className="mb-6">
          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus size={16} /> Form a Partnership
            </button>
          ) : (
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Partnership name (e.g. Osun Grove Collective)"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you collaborating on? (optional)"
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
              />
              {upcoming?.upcomingEvents && upcoming.upcomingEvents.length > 0 && (
                <select
                  value={plannedEventId}
                  onChange={(e) => setPlannedEventId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="">Not tied to a specific event (optional)</option>
                  {upcoming.upcomingEvents.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      Preparing for {ev.title}
                    </option>
                  ))}
                </select>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => createPartnership.mutate()}
                  disabled={!name.trim() || createPartnership.isPending}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Form Partnership
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading partnerships...</p>
      ) : partnerships.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 border border-border rounded-xl">
          <Users2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No vendor partnerships yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {partnerships.map((p) => (
            <Link
              key={p.id}
              to={`/marketplace/partnerships/${p.id}`}
              className="block bg-card border border-border rounded-xl p-5 hover:border-highlight/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="font-bold text-foreground">{p.name}</h3>
                <span className="inline-flex items-center gap-1 text-xs text-highlight">
                  View <ArrowRight size={12} />
                </span>
              </div>
              {p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}
              <p className="text-xs text-muted-foreground mt-3">
                {p.members.length} vendor{p.members.length === 1 ? '' : 's'}:{' '}
                {p.members.map((m) => m.businessName).join(', ')}
              </p>
              {p.plannedEvent && (
                <p className="text-xs text-highlight mt-2 flex items-center gap-1">
                  <Calendar size={12} /> Preparing for {p.plannedEvent.title}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartnershipsBrowseView;
