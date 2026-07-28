import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Sparkles, Plus, Loader2, ChevronDown, ChevronUp, MessageSquareText } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/components/toast';

interface BundleProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  vendor: { businessName: string };
}

interface Bundle {
  id: string;
  name: string;
  description?: string;
  status: string;
  rejectionReason?: string;
  items: Array<{ productId: string; quantity: number; product: BundleProduct }>;
  totalPrice: number;
  available: boolean;
  // SHOP_BACKLOG.md MSP-019
  ritualGuide?: string;
  guideSourceUrl?: string;
  supportThreadId?: string;
  reflectionThreadId?: string;
}

// SHOP_BACKLOG.md MSP-019
interface CustomizationRequest {
  id: string;
  haveItems: string;
  needItems: string;
  status: string;
  vendorResponse?: string;
  createdAt: string;
  requester: { id: string; name: string };
}

interface BundleManagementProps {
  activeTab: string;
  vendorId?: string;
}

const statusVariant = (status: string): 'default' | 'secondary' | 'destructive' =>
  status === 'APPROVED' ? 'default' : status === 'REJECTED' ? 'destructive' : 'secondary';

// VENDOR_BACKLOG.md VND-015
interface SeasonalEvent {
  id: string;
  title: string;
  yorubaName: string | null;
  description: string;
  date: string;
  historicalLift: { windowRevenue: number; weeklyAverageRevenue: number; liftPct: number } | null;
}

const SeasonalInsightsPanel: React.FC<{ vendorId: string }> = ({ vendorId }) => {
  const { data: events = [], isLoading } = useQuery<SeasonalEvent[]>({
    queryKey: ['vendor-seasonal-insights', vendorId],
    queryFn: async () => (await api.get(`/marketplace/vendors/${vendorId}/seasonal-insights`)).data,
    enabled: !!vendorId,
  });

  if (isLoading) return <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />;
  if (events.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <h3 className="font-bold text-foreground flex items-center gap-2">
        <Sparkles size={16} className="text-highlight" /> Upcoming Festivals & Seasons
      </h3>
      <div className="space-y-3">
        {events.map((e) => {
          const daysAway = Math.ceil((new Date(e.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return (
            <div key={e.id} className="p-3 bg-muted/40 rounded-lg">
              <p className="font-bold text-foreground">
                {e.title}{e.yorubaName ? ` (${e.yorubaName})` : ''} — in {daysAway} day{daysAway !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{e.description}</p>
              {e.historicalLift && (
                <p className="text-sm mt-1 font-medium text-highlight">
                  You made {e.historicalLift.liftPct >= 0 ? 'about ' : ''}
                  {e.historicalLift.liftPct >= 0 ? `${e.historicalLift.liftPct}% more` : `${Math.abs(e.historicalLift.liftPct)}% less`} than your weekly average around this event last year (₦{e.historicalLift.windowRevenue.toLocaleString()}).
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground pt-1">Use "Propose a Bundle" below to build a festival kit.</p>
    </div>
  );
};

// SHOP_BACKLOG.md MSP-019: guide editor + customization-request inbox for
// an approved kit. Split out so its own queries only run when expanded.
const BundleGuideAndRequests: React.FC<{ bundle: Bundle }> = ({ bundle }) => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [ritualGuide, setRitualGuide] = useState(bundle.ritualGuide ?? '');
  const [guideSourceUrl, setGuideSourceUrl] = useState(bundle.guideSourceUrl ?? '');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  const { data: requests = [] } = useQuery<CustomizationRequest[]>({
    queryKey: ['bundle-customization-requests', bundle.id],
    queryFn: async () => (await api.get(`/marketplace/bundles/${bundle.id}/customization-requests`)).data,
  });

  const saveGuide = useMutation({
    mutationFn: () =>
      api.patch(`/marketplace/bundles/${bundle.id}/guide`, {
        ritualGuide: ritualGuide || undefined,
        guideSourceUrl: guideSourceUrl || undefined,
      }),
    onSuccess: () => {
      success('Guide saved');
      queryClient.invalidateQueries({ queryKey: ['vendor-bundles-mine'] });
    },
    onError: () => error('Failed to save guide'),
  });

  const respond = useMutation({
    mutationFn: (requestId: string) =>
      api.patch(`/marketplace/bundles/customization-requests/${requestId}/respond`, {
        vendorResponse: responseText,
      }),
    onSuccess: () => {
      success('Response sent');
      setRespondingTo(null);
      setResponseText('');
      queryClient.invalidateQueries({ queryKey: ['bundle-customization-requests', bundle.id] });
    },
    onError: () => error('Failed to send response'),
  });

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-4">
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Ritual Guide</p>
        <textarea
          value={ritualGuide}
          onChange={(e) => setRitualGuide(e.target.value)}
          placeholder="Step-by-step guidance for this ritual..."
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
        />
        <input
          type="url"
          value={guideSourceUrl}
          onChange={(e) => setGuideSourceUrl(e.target.value)}
          placeholder="Elder audio/video guidance link (optional)"
          className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-background text-sm"
        />
        <Button size="sm" className="mt-2" onClick={() => saveGuide.mutate()} disabled={saveGuide.isPending}>
          Save Guide
        </Button>
        {(bundle.supportThreadId || bundle.reflectionThreadId) && (
          <p className="text-xs text-muted-foreground mt-2">
            <Link to="/forum" className="text-highlight hover:underline">
              Support &amp; reflection threads
            </Link>{' '}
            were created automatically in Ritual Kits &amp; Ceremonies.
          </p>
        )}
      </div>

      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1">
          <MessageSquareText className="w-3.5 h-3.5" /> Customization Requests ({requests.length})
        </p>
        {requests.length === 0 ? (
          <p className="text-xs text-muted-foreground">No requests yet.</p>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="bg-muted/50 border border-border rounded-lg p-3 text-xs">
                <p className="font-medium text-foreground">{r.requester.name}</p>
                <p className="text-muted-foreground mt-1">Has: {r.haveItems}</p>
                <p className="text-muted-foreground">Needs: {r.needItems}</p>
                {r.status === 'RESPONDED' ? (
                  <p className="text-primary mt-2">Your response: {r.vendorResponse}</p>
                ) : respondingTo === r.id ? (
                  <div className="mt-2 space-y-1">
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1 rounded border border-border bg-background text-xs resize-none"
                    />
                    <Button size="sm" onClick={() => respond.mutate(r.id)} disabled={!responseText.trim() || respond.isPending}>
                      Send
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRespondingTo(r.id)}
                    className="text-highlight mt-2 hover:underline"
                  >
                    Respond
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// SHOP_BACKLOG.md MSP-002: vendor-side bundle proposal + status tracking.
// A bundle can reference any vendor's products, not just this vendor's own --
// products are fetched from the same public catalog the marketplace uses.
const BundleManagement: React.FC<BundleManagementProps> = ({ activeTab, vendorId }) => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [expandedBundleId, setExpandedBundleId] = useState<string | null>(null);

  const { data: bundles = [], isLoading: bundlesLoading } = useQuery<Bundle[]>({
    queryKey: ['vendor-bundles-mine'],
    queryFn: async () => (await api.get('/marketplace/bundles/mine')).data,
    enabled: activeTab === 'bundles',
  });

  const { data: products = [] } = useQuery<BundleProduct[]>({
    queryKey: ['marketplace-products-for-bundle', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search.length >= 2) params.append('search', search);
      const res = await api.get(`/marketplace/products?${params.toString()}`);
      return res.data;
    },
    enabled: activeTab === 'bundles' && showForm,
  });

  const createBundle = useMutation({
    mutationFn: async () => {
      const items = Object.entries(selected).map(([productId, quantity]) => ({ productId, quantity }));
      return api.post('/marketplace/bundles', { name, description: description || undefined, items });
    },
    onSuccess: () => {
      success('Bundle submitted for elder review');
      queryClient.invalidateQueries({ queryKey: ['vendor-bundles-mine'] });
      setShowForm(false);
      setName('');
      setDescription('');
      setSelected({});
      setSearch('');
    },
    onError: (err: any) => {
      error(err?.response?.data?.error?.userMessage || 'Failed to submit bundle');
    },
  });

  if (activeTab !== 'bundles') return null;

  const toggleProduct = (productId: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[productId]) delete next[productId];
      else next[productId] = 1;
      return next;
    });
  };

  const selectedCount = Object.keys(selected).length;

  return (
    <div className="space-y-6">
      {/* VENDOR_BACKLOG.md VND-015 */}
      {vendorId && <SeasonalInsightsPanel vendorId={vendorId} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Ritual Kits &amp; Bundles</h2>
          <p className="text-muted-foreground">Propose cross-vendor bundles for elder review</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? 'Cancel' : 'Propose a Bundle'}
        </Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bundle name (e.g. Ifá Initiate Starter Kit)"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
          />
          <div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products to add (from any vendor)..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm mb-2"
            />
            <div className="max-h-64 overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {products.map((p) => (
                <label key={p.id} className="flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/50">
                  <input type="checkbox" checked={!!selected[p.id]} onChange={() => toggleProduct(p.id)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.vendor.businessName} &middot; {p.currency === 'NGN' ? '₦' : '$'}{p.price.toLocaleString()}
                    </p>
                  </div>
                  {selected[p.id] > 0 && (
                    <input
                      type="number"
                      min={1}
                      aria-label={`Quantity for ${p.name}`}
                      value={selected[p.id]}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        setSelected((prev) => ({ ...prev, [p.id]: Math.max(1, Number(e.target.value)) }))
                      }
                      className="w-16 px-2 py-1 rounded border border-border bg-background text-xs"
                    />
                  )}
                </label>
              ))}
              {products.length === 0 && (
                <p className="text-xs text-muted-foreground p-2">
                  {search.length >= 2 ? 'No products found.' : 'Type at least 2 characters to search products...'}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={() => createBundle.mutate()}
            disabled={!name.trim() || selectedCount < 2 || createBundle.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {createBundle.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit for Review ({selectedCount} items)
          </Button>
          {selectedCount > 0 && selectedCount < 2 && (
            <p className="text-xs text-muted-foreground">A bundle needs at least 2 items.</p>
          )}
        </div>
      )}

      {bundlesLoading ? (
        <p className="text-sm text-muted-foreground">Loading your bundles...</p>
      ) : bundles.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No bundles yet</h3>
          <p className="text-muted-foreground">Propose a cross-vendor kit to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bundles.map((bundle) => (
            <div key={bundle.id} className="bg-card border border-border rounded-xl p-6">
              <div className="flex justify-between items-start mb-2 gap-2">
                <h3 className="font-bold text-foreground">{bundle.name}</h3>
                <Badge variant={statusVariant(bundle.status)}>{bundle.status.replace('_', ' ')}</Badge>
              </div>
              {bundle.description && <p className="text-muted-foreground text-sm mb-3">{bundle.description}</p>}
              <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                {bundle.items.map((item) => (
                  <li key={item.productId}>
                    {item.product.name} &times; {item.quantity} ({item.product.vendor.businessName})
                  </li>
                ))}
              </ul>
              <p className="font-bold text-primary">₦{bundle.totalPrice.toLocaleString()}</p>
              {bundle.status === 'REJECTED' && bundle.rejectionReason && (
                <p className="text-xs text-destructive mt-2">Reason: {bundle.rejectionReason}</p>
              )}

              {bundle.status === 'APPROVED' && (
                <>
                  <button
                    type="button"
                    onClick={() => setExpandedBundleId((id) => (id === bundle.id ? null : bundle.id))}
                    className="mt-3 text-xs font-medium text-highlight hover:underline flex items-center gap-1"
                  >
                    {expandedBundleId === bundle.id ? (
                      <>Hide guide &amp; requests <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>Ritual guide &amp; customization requests <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>
                  {expandedBundleId === bundle.id && <BundleGuideAndRequests bundle={bundle} />}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BundleManagement;
