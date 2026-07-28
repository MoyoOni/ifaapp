import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Store, ExternalLink, Pin, CheckCircle2, AlertCircle, Link2, Lightbulb } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

interface VendorProfile {
  id: string;
  userId: string;
  businessName: string;
  description: string | null;
  bannerImageUrl: string | null;
  featuredProductIds: string[];
  slug: string | null;
}

interface VendorProduct {
  id: string;
  name: string;
  images: string[];
  status: string;
}

interface CompletenessEntry {
  productId: string;
  name: string;
  score: number;
  missingTips: string[];
}

const MAX_FEATURED = 3;
const SLUG_PATTERN = /^[a-z0-9-]+$/;

interface StorefrontManagementProps {
  vendorId: string;
  activeTab: string;
}

// VENDOR_BACKLOG.md VND-016: lets a vendor customise their public storefront
// (at /vendors/:userId) -- bio (reusing the existing `description` field per
// the backlog's own framing of it as "extended from current description",
// not a second field), a banner image, and up to 3 pinned featured products.
const StorefrontManagement: React.FC<StorefrontManagementProps> = ({ vendorId, activeTab }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [description, setDescription] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  const [slug, setSlug] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { data: vendor } = useQuery<VendorProfile>({
    queryKey: ['vendor-profile-full', user?.id],
    queryFn: async () => (await api.get('/marketplace/vendors/me')).data,
    enabled: !!user?.id && activeTab === 'storefront',
  });

  const { data: products = [] } = useQuery<VendorProduct[]>({
    queryKey: ['vendor-own-products', vendorId],
    queryFn: async () =>
      (await api.get('/marketplace/products', { params: { vendorId, status: 'ACTIVE' } })).data,
    enabled: !!vendorId && activeTab === 'storefront',
  });

  // VENDOR_BACKLOG.md VND-023: "completeness score shown to vendor with tips"
  const { data: completeness = [] } = useQuery<CompletenessEntry[]>({
    queryKey: ['vendor-completeness', vendorId],
    queryFn: async () => (await api.get(`/marketplace/vendors/${vendorId}/completeness`)).data,
    enabled: !!vendorId && activeTab === 'storefront',
  });

  useEffect(() => {
    if (!vendor) return;
    setDescription(vendor.description ?? '');
    setBannerImageUrl(vendor.bannerImageUrl ?? '');
    setFeaturedIds(vendor.featuredProductIds ?? []);
    setSlug(vendor.slug ?? '');
  }, [vendor]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      await api.patch(`/marketplace/vendors/${vendorId}`, {
        description,
        bannerImageUrl: bannerImageUrl || undefined,
        featuredProductIds: featuredIds,
        ...(slug ? { slug } : {}),
      });
    },
    onSuccess: () => {
      setSaved(true);
      setFormError(null);
      qc.invalidateQueries({ queryKey: ['vendor-profile-full', user?.id] });
      qc.invalidateQueries({ queryKey: ['vendor-storefront'] });
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message ?? 'Failed to save storefront changes');
    },
  });

  const toggleFeatured = (productId: string) => {
    setFeaturedIds((prev) => {
      if (prev.includes(productId)) return prev.filter((id) => id !== productId);
      if (prev.length >= MAX_FEATURED) return prev;
      return [...prev, productId];
    });
  };

  if (activeTab !== 'storefront') return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Storefront</h2>
          <p className="text-muted-foreground">Customise how customers see your shop</p>
        </div>
        {vendor && (
          <a
            href={`/vendors/${vendor.slug || vendor.userId}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-sm font-bold text-highlight hover:underline"
          >
            <ExternalLink size={14} /> View public storefront
          </a>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store size={16} /> Bio & Banner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
              About your shop
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Tell customers about your practice, your sourcing, and what makes your shop trustworthy…"
              className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
              Banner image URL
            </label>
            <input
              type="text"
              value={bannerImageUrl}
              onChange={(e) => setBannerImageUrl(e.target.value)}
              placeholder="https://…"
              className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
            />
            {bannerImageUrl && (
              <img src={bannerImageUrl} alt="Banner preview" className="mt-2 h-24 w-full object-cover rounded-xl border border-border" />
            )}
          </div>
          {/* VENDOR_BACKLOG.md VND-023: custom storefront URL slug */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
              <Link2 size={12} /> Custom Storefront URL
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">iluase.com/vendors/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="oshun-beads-by-adunola"
                className="flex-1 bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
              />
            </div>
            {slug && !SLUG_PATTERN.test(slug) && (
              <p className="text-xs text-red-600 dark:text-red-400">Only lowercase letters, numbers, and hyphens allowed.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pin size={16} /> Featured Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Pin up to {MAX_FEATURED} products to show at the top of your storefront ({featuredIds.length}/{MAX_FEATURED} selected).
          </p>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">You have no active products to feature yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {products.map((p) => {
                const isFeatured = featuredIds.includes(p.id);
                const disabled = !isFeatured && featuredIds.length >= MAX_FEATURED;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleFeatured(p.id)}
                    className={`relative text-left rounded-xl overflow-hidden border-2 transition-colors ${
                      isFeatured ? 'border-highlight' : 'border-border'
                    } ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-highlight/60'}`}
                  >
                    {isFeatured && (
                      <span className="absolute top-1.5 right-1.5 z-10 bg-highlight text-white rounded-full p-1">
                        <CheckCircle2 size={12} />
                      </span>
                    )}
                    <div className="aspect-square bg-muted/40 flex items-center justify-center">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="text-muted-foreground" size={20} />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-foreground p-2 line-clamp-1">{p.name}</p>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* VENDOR_BACKLOG.md VND-023: per-product completeness tips */}
      {completeness.some((c) => c.missingTips.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb size={16} /> Listing Completeness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Complete listings rank higher in search. Here's what's missing on each product.
            </p>
            {completeness
              .filter((c) => c.missingTips.length > 0)
              .map((c) => (
                <div key={c.productId} className="flex items-start justify-between gap-3 py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-bold text-foreground">{c.name}</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                      {c.missingTips.map((tip) => <li key={tip}>{tip}</li>)}
                    </ul>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">{c.score}% complete</span>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {formError && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={14} /> {formError}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 size={14} /> Storefront updated.
        </div>
      )}

      <button
        onClick={() => save()}
        disabled={isPending || (!!slug && !SLUG_PATTERN.test(slug))}
        className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Saving…' : 'Save Storefront'}
      </button>
    </div>
  );
};

export default StorefrontManagement;
