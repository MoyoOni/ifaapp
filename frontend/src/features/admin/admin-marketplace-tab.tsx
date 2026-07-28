import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, ShoppingCart, Store, Tag, Star, Trash2, AlertCircle, Sparkles, Check, X, Flag, Calendar, Award } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';

type SubTab = 'products' | 'orders' | 'vendor-health' | 'categories' | 'bundles' | 'flagged' | 'event-requests' | 'certifications';

// P7-01: field names here previously didn't match what AdminMarketplaceService
// actually returns (title/vendor.name/_count.reviews vs. the real
// name/vendor.businessName/reviewCount) -- ProductsTab crashed on every mount,
// discovered live while verifying MSP-002's Bundles sub-tab in this same file.
interface Product { id: string; name: string; price: number; status: string; isFeatured: boolean; vendor: { businessName: string }; reviewCount: number }
interface Order { id: string; status: string; totalAmount: number; createdAt: string; customer: { name: string }; vendor: { businessName: string }; items: { quantity: number; product: { name: string } }[] }
interface VendorHealth { vendorId: string; vendorName: string; email: string; productCount: number; activeProducts: number; fulfillmentRate: number; inactive: boolean; apprenticeshipTier: string }
interface Category { category: string; _count: { id: number } }
interface PendingBundle {
  id: string;
  name: string;
  description?: string;
  creator: { id: string; businessName: string };
  items: Array<{ quantity: number; product: { id: string; name: string; price: number } }>;
}

function ProductsTab() {
  const { success, error } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ['admin', 'marketplace-products', page],
    queryFn: () => api.get(`/admin/marketplace/products?page=${page}&limit=20`).then(r => r.data),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/marketplace/products/${id}`, { data: { reason: 'Admin removal' } }),
    onSuccess: () => { success('Product removed'); qc.invalidateQueries({ queryKey: ['admin', 'marketplace-products'] }); },
    onError: () => error('Failed to remove product'),
  });
  const feature = useMutation({
    mutationFn: ({ id, featuredUntil }: { id: string; featuredUntil: string | null }) =>
      api.patch(`/admin/marketplace/products/${id}/feature`, { featuredUntil }),
    onSuccess: () => { success('Updated'); qc.invalidateQueries({ queryKey: ['admin', 'marketplace-products'] }); },
    onError: () => error('Failed to update'),
  });
  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Loading...</p>;
  return (
    <div className="space-y-3">
      {data?.products.map(p => (
        <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
            <p className="text-xs text-muted-foreground">{p.vendor.businessName} &middot; NGN {p.price.toLocaleString()} &middot; {p.reviewCount} reviews</p>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${p.status === 'ACTIVE' ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>{p.status}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={() => feature.mutate({ id: p.id, featuredUntil: p.isFeatured ? null : new Date(Date.now() + 30 * 86400000).toISOString() })} className={`p-1.5 rounded-lg ${p.isFeatured ? 'text-yellow-500 bg-yellow-500/10' : 'text-muted-foreground hover:bg-muted'}`} title={p.isFeatured ? 'Unfeature' : 'Feature 30d'}>
              <Star className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => remove.mutate(p.id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      <div className="flex justify-between items-center pt-2">
        <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-sm text-primary disabled:opacity-40">Previous</button>
        <span className="text-xs text-muted-foreground">{data?.total ?? 0} total</span>
        <button type="button" onClick={() => setPage(p => p + 1)} disabled={(page * 20) >= (data?.total ?? 0)} className="text-sm text-primary disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}

function OrdersTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery<{ orders: Order[]; total: number }>({
    queryKey: ['admin', 'marketplace-orders', page],
    queryFn: () => api.get(`/admin/marketplace/orders?page=${page}&limit=20`).then(r => r.data),
  });
  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Loading...</p>;
  return (
    <div className="space-y-3">
      {data?.orders.map(o => (
        <div key={o.id} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-foreground">{o.customer.name} to {o.vendor.businessName}</p>
              <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()} &middot; {o.items.length} items</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-foreground">NGN {o.totalAmount.toLocaleString()}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${o.status === 'DELIVERED' ? 'bg-green-500/10 text-green-600' : o.status === 'CANCELLED' ? 'bg-red-500/10 text-red-600' : 'bg-blue-500/10 text-blue-600'}`}>{o.status}</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">{o.items.map(i => `${i.product.name} x${i.quantity}`).join(', ')}</div>
        </div>
      ))}
      <div className="flex justify-between items-center pt-2">
        <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-sm text-primary disabled:opacity-40">Previous</button>
        <span className="text-xs text-muted-foreground">{data?.total ?? 0} total</span>
        <button type="button" onClick={() => setPage(p => p + 1)} disabled={(page * 20) >= (data?.total ?? 0)} className="text-sm text-primary disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}

const TIER_LABELS: Record<string, string> = {
  APPRENTICE: 'Apprentice',
  RECOGNIZED_ARTISAN: 'Recognized Artisan',
  MASTER_PRACTITIONER: 'Master Practitioner',
  ELDER_APPROVED: 'Elder-Approved',
};
const TIER_ORDER = ['APPRENTICE', 'RECOGNIZED_ARTISAN', 'MASTER_PRACTITIONER', 'ELDER_APPROVED'];

// SHOP_BACKLOG.md MSP-016: apprenticeship tier advancement, admin/elder-only,
// never automatic. Reuses this tab since it's already the vendor-at-a-glance view.
function VendorHealthTab() {
  const { success, error } = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<VendorHealth[]>({
    queryKey: ['admin', 'vendor-health'],
    queryFn: () => api.get('/admin/marketplace/vendor-health').then(r => r.data),
  });
  const updateTier = useMutation({
    mutationFn: ({ vendorId, tier }: { vendorId: string; tier: string }) =>
      api.patch(`/admin/marketplace/vendors/${vendorId}/tier`, { tier, reason: `Advanced to ${TIER_LABELS[tier]}` }),
    onSuccess: () => { success('Vendor tier updated'); qc.invalidateQueries({ queryKey: ['admin', 'vendor-health'] }); },
    onError: (err: any) => error(err?.response?.data?.error?.message || 'Failed to update tier'),
  });
  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Loading...</p>;
  return (
    <div className="space-y-3">
      {data?.map(v => {
        const currentIndex = TIER_ORDER.indexOf(v.apprenticeshipTier);
        const nextTier = TIER_ORDER[currentIndex + 1];
        return (
          <div key={v.vendorId} className={`bg-card border rounded-xl p-4 ${v.inactive ? 'border-yellow-500/40' : 'border-border'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{v.vendorName}</p>
                <p className="text-xs text-muted-foreground">{v.email}</p>
                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{TIER_LABELS[v.apprenticeshipTier] ?? v.apprenticeshipTier}</span>
              </div>
              <div className="text-right space-y-0.5">
                <p className="text-xs text-muted-foreground">{v.activeProducts}/{v.productCount} active</p>
                <p className="text-xs">Fulfillment: <span className={`font-semibold ${v.fulfillmentRate >= 80 ? 'text-green-600' : v.fulfillmentRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{v.fulfillmentRate.toFixed(0)}%</span></p>
                {v.inactive && <p className="text-xs text-yellow-500 flex items-center gap-1 justify-end"><AlertCircle className="w-3 h-3" />Inactive</p>}
              </div>
            </div>
            {nextTier && (
              <div className="mt-2 pt-2 border-t border-border flex justify-end">
                <button
                  type="button"
                  onClick={() => updateTier.mutate({ vendorId: v.vendorId, tier: nextTier })}
                  disabled={updateTier.isPending}
                  className="text-xs text-primary hover:underline"
                >
                  Advance to {TIER_LABELS[nextTier]} →
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CategoriesTab() {
  const { data, isLoading } = useQuery<Category[]>({
    queryKey: ['admin', 'marketplace-categories'],
    queryFn: () => api.get('/admin/marketplace/categories').then(r => r.data),
  });
  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Loading...</p>;
  return (
    <div className="grid grid-cols-2 gap-3">
      {data?.map(c => (
        <div key={c.category} className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-medium text-foreground">{c.category || 'Uncategorised'}</p>
          <p className="text-2xl font-bold text-primary mt-1">{c._count.id}</p>
          <p className="text-xs text-muted-foreground">products</p>
        </div>
      ))}
    </div>
  );
}

// SHOP_BACKLOG.md MSP-002: admin/elder approval queue for cross-vendor bundles
function BundlesTab() {
  const { success, error } = useToast();
  const qc = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: bundles = [], isLoading } = useQuery<PendingBundle[]>({
    queryKey: ['admin', 'marketplace-bundles-pending'],
    queryFn: () => api.get('/admin/marketplace/bundles/pending').then((r) => r.data),
  });

  const review = useMutation({
    mutationFn: ({ id, approved, reason }: { id: string; approved: boolean; reason?: string }) =>
      api.post(`/admin/marketplace/bundles/${id}/review`, { approved, rejectionReason: reason }),
    onSuccess: (_data, variables) => {
      success(variables.approved ? 'Bundle approved' : 'Bundle rejected');
      qc.invalidateQueries({ queryKey: ['admin', 'marketplace-bundles-pending'] });
      setRejectingId(null);
      setRejectionReason('');
    },
    onError: () => error('Failed to review bundle'),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Loading...</p>;

  if (bundles.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
        <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No bundles awaiting review</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bundles.map((b) => {
        const total = b.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        return (
          <div key={b.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{b.name}</p>
                <p className="text-xs text-muted-foreground">Proposed by {b.creator.businessName}</p>
                {b.description && <p className="text-xs text-muted-foreground mt-1">{b.description}</p>}
                <ul className="text-xs text-muted-foreground mt-2 space-y-0.5">
                  {b.items.map((item) => (
                    <li key={item.product.id}>{item.product.name} &times; {item.quantity}</li>
                  ))}
                </ul>
                <p className="text-sm font-bold text-primary mt-2">₦{total.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => review.mutate({ id: b.id, approved: true })}
                  disabled={review.isPending}
                  className="p-1.5 rounded-lg text-green-600 bg-green-500/10 hover:bg-green-500/20"
                  title="Approve"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRejectingId(rejectingId === b.id ? null : b.id)}
                  disabled={review.isPending}
                  className="p-1.5 rounded-lg text-destructive bg-destructive/10 hover:bg-destructive/20"
                  title="Reject"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {rejectingId === b.id && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reason for rejection"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-xs"
                />
                <button
                  type="button"
                  onClick={() => review.mutate({ id: b.id, approved: false, reason: rejectionReason })}
                  disabled={!rejectionReason.trim() || review.isPending}
                  className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold disabled:opacity-50"
                >
                  Confirm Reject
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// SHOP_BACKLOG.md MSP-015/MSP-003: "flagging with gentle education" review queue
interface FlaggedProduct {
  id: string;
  name: string;
  reviewReason?: string;
  updatedAt: string;
  vendor: { id: string; businessName: string };
}

function FlaggedTab() {
  const { success, error } = useToast();
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useQuery<FlaggedProduct[]>({
    queryKey: ['admin', 'marketplace-flagged'],
    queryFn: () => api.get('/admin/marketplace/products/flagged').then((r) => r.data),
  });

  const clearFlag = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/marketplace/products/${id}/clear-flag`),
    onSuccess: () => {
      success('Flag cleared — listing stays live');
      qc.invalidateQueries({ queryKey: ['admin', 'marketplace-flagged'] });
    },
    onError: () => error('Failed to clear flag'),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Loading...</p>;

  if (products.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
        <Flag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No listings awaiting review</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300">
        A gentle check, not a punishment. Clearing a flag keeps the listing live; use the existing Delete action on
        the Products tab if a listing genuinely needs to come down.
      </div>
      {products.map((p) => (
        <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
            <p className="text-xs text-muted-foreground">{p.vendor.businessName}</p>
            {p.reviewReason && (
              <p className="text-xs text-foreground bg-muted/50 rounded-lg p-2 mt-2">{p.reviewReason}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => clearFlag.mutate(p.id)}
            disabled={clearFlag.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 shrink-0"
          >
            <Check className="w-3.5 h-3.5" /> Clear Flag
          </button>
        </div>
      ))}
    </div>
  );
}

// SHOP_BACKLOG.md MSP-008: vendor request flow for seasonal item promotions
interface EventFeatureRequest {
  id: string;
  event: { id: string; title: string; date: string };
  product: { id: string; name: string; images: string[] };
  vendor: { id: string; businessName: string };
}

function EventFeatureRequestsTab() {
  const { success, error } = useToast();
  const qc = useQueryClient();
  const { data: requests = [], isLoading } = useQuery<EventFeatureRequest[]>({
    queryKey: ['admin', 'marketplace-event-feature-requests'],
    queryFn: () => api.get('/admin/marketplace/events/feature-requests').then((r) => r.data),
  });

  const review = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      api.patch(`/admin/marketplace/events/feature-requests/${id}/review`, { approved }),
    onSuccess: (_, { approved }) => {
      success(approved ? 'Approved — item is now featured for the event' : 'Request rejected');
      qc.invalidateQueries({ queryKey: ['admin', 'marketplace-event-feature-requests'] });
    },
    onError: () => error('Failed to review request'),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Loading...</p>;

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No pending event feature requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <div key={r.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{r.product.name}</p>
            <p className="text-xs text-muted-foreground">
              {r.vendor.businessName} &middot; for {r.event.title} ({new Date(r.event.date).toLocaleDateString()})
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => review.mutate({ id: r.id, approved: true })}
              disabled={review.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              type="button"
              onClick={() => review.mutate({ id: r.id, approved: false })}
              disabled={review.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground text-xs font-bold rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// VENDOR_BACKLOG.md VND-017: Community Verified / Elder Endorsed tier review queue
interface CertificationApplication {
  id: string;
  requestedTier: string;
  documentation: string;
  createdAt: string;
  vendor: { id: string; businessName: string; culturalCertificationTier: string };
}

const CERT_TIER_LABEL: Record<string, string> = {
  COMMUNITY_LISTED: 'Community Listed',
  COMMUNITY_VERIFIED: 'Community Verified',
  ELDER_ENDORSED: 'Elder Endorsed',
};

function CertificationsTab() {
  const { success, error } = useToast();
  const qc = useQueryClient();
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  const { data: applications = [], isLoading } = useQuery<CertificationApplication[]>({
    queryKey: ['admin', 'marketplace-certifications-pending'],
    queryFn: () => api.get('/admin/marketplace/certifications/pending').then((r) => r.data),
  });

  const review = useMutation({
    mutationFn: ({ id, approved, reason }: { id: string; approved: boolean; reason?: string }) =>
      api.post(`/admin/marketplace/certifications/${id}/review`, { approved, declineReason: reason }),
    onSuccess: (_data, variables) => {
      success(variables.approved ? 'Certification approved' : 'Application declined');
      qc.invalidateQueries({ queryKey: ['admin', 'marketplace-certifications-pending'] });
      setDecliningId(null);
      setDeclineReason('');
    },
    onError: () => error('Failed to review application'),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Loading...</p>;

  if (applications.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
        <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No certification applications awaiting review</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((a) => (
        <div key={a.id} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{a.vendor.businessName}</p>
              <p className="text-xs text-muted-foreground">
                Currently {CERT_TIER_LABEL[a.vendor.culturalCertificationTier]} · Requesting{' '}
                <span className="font-bold text-foreground">{CERT_TIER_LABEL[a.requestedTier]}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">{a.documentation}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Applied {new Date(a.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => review.mutate({ id: a.id, approved: true })}
                disabled={review.isPending}
                className="p-1.5 rounded-lg text-green-600 bg-green-500/10 hover:bg-green-500/20"
                title="Approve"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDecliningId(decliningId === a.id ? null : a.id)}
                disabled={review.isPending}
                className="p-1.5 rounded-lg text-destructive bg-destructive/10 hover:bg-destructive/20"
                title="Decline"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {decliningId === a.id && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Reason for declining"
                className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-xs"
              />
              <button
                type="button"
                onClick={() => review.mutate({ id: a.id, approved: false, reason: declineReason })}
                disabled={!declineReason.trim() || review.isPending}
                className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold disabled:opacity-50"
              >
                Confirm Decline
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const SUB_TABS = [
  { id: 'products' as SubTab, label: 'Products', Icon: Package },
  { id: 'orders' as SubTab, label: 'Orders', Icon: ShoppingCart },
  { id: 'bundles' as SubTab, label: 'Bundles', Icon: Sparkles },
  { id: 'flagged' as SubTab, label: 'Flagged', Icon: Flag },
  { id: 'event-requests' as SubTab, label: 'Event Requests', Icon: Calendar },
  { id: 'vendor-health' as SubTab, label: 'Vendor Health', Icon: Store },
  { id: 'categories' as SubTab, label: 'Categories', Icon: Tag },
  { id: 'certifications' as SubTab, label: 'Certifications', Icon: Award },
];

export default function AdminMarketplaceTab() {
  const [sub, setSub] = useState<SubTab>('products');
  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl flex-wrap w-fit">
        {SUB_TABS.map(({ id, label, Icon }) => (
          <button key={id} type="button" onClick={() => setSub(id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${sub === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>
      {sub === 'products' && <ProductsTab />}
      {sub === 'orders' && <OrdersTab />}
      {sub === 'bundles' && <BundlesTab />}
      {sub === 'flagged' && <FlaggedTab />}
      {sub === 'event-requests' && <EventFeatureRequestsTab />}
      {sub === 'vendor-health' && <VendorHealthTab />}
      {sub === 'categories' && <CategoriesTab />}
      {sub === 'certifications' && <CertificationsTab />}
    </div>
  );
}
