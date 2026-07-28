import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/components/toast';

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  description: string;
}

interface VendorProduct {
  id: string;
  name: string;
}

interface FeatureRequest {
  id: string;
  status: string;
  event: { id: string; title: string; date: string };
  product: { id: string; name: string };
}

interface EventFeatureRequestsProps {
  vendorId: string;
  activeTab: string;
}

const statusVariant = (status: string): 'default' | 'secondary' | 'destructive' =>
  status === 'APPROVED' ? 'default' : status === 'REJECTED' ? 'destructive' : 'secondary';

// SHOP_BACKLOG.md MSP-008: "Vendor request flow for seasonal item
// promotions, routed through existing admin review"
const EventFeatureRequests: React.FC<EventFeatureRequestsProps> = ({ vendorId, activeTab }) => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const { data: upcoming } = useQuery<{ upcomingEvents: UpcomingEvent[] }>({
    queryKey: ['marketplace-upcoming-events'],
    queryFn: async () => (await api.get('/marketplace/products/upcoming-events?withinDays=90')).data,
    enabled: activeTab === 'events',
  });

  const { data: products = [] } = useQuery<VendorProduct[]>({
    queryKey: ['vendor-products-brief', vendorId],
    queryFn: async () => (await api.get(`/marketplace/vendors/${vendorId}/products`)).data,
    enabled: activeTab === 'events',
  });

  const { data: myRequests = [] } = useQuery<FeatureRequest[]>({
    queryKey: ['event-feature-requests-mine'],
    queryFn: async () => (await api.get('/marketplace/events/feature-requests/mine')).data,
    enabled: activeTab === 'events',
  });

  const requestFeature = useMutation({
    mutationFn: () =>
      api.post(`/marketplace/events/${selectedEventId}/feature-request`, { productId: selectedProductId }),
    onSuccess: () => {
      success('Request sent for admin review');
      setSelectedEventId('');
      setSelectedProductId('');
      queryClient.invalidateQueries({ queryKey: ['event-feature-requests-mine'] });
    },
    onError: (err: any) => error(err?.response?.data?.error?.userMessage || 'Could not send request'),
  });

  if (activeTab !== 'events') return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Seasonal & Ceremonial Events</h2>
        <p className="text-muted-foreground">Request to feature your items ahead of upcoming sacred calendar events</p>
      </div>

      {upcoming?.upcomingEvents && upcoming.upcomingEvents.length > 0 ? (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">Request Featuring</h3>
          </div>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          >
            <option value="">Select an upcoming event...</option>
            {upcoming.upcomingEvents.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} — {new Date(ev.date).toLocaleDateString()}
              </option>
            ))}
          </select>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          >
            <option value="">Select your product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button
            onClick={() => requestFeature.mutate()}
            disabled={!selectedEventId || !selectedProductId || requestFeature.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {requestFeature.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Request Featuring
          </Button>
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No upcoming events in the next 90 days.</p>
        </div>
      )}

      {myRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-foreground">Your Requests</h3>
          {myRequests.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">{r.product.name}</p>
                <p className="text-xs text-muted-foreground">
                  For {r.event.title} — {new Date(r.event.date).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventFeatureRequests;
