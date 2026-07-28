import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Store, CheckCircle, Star, ShoppingBag, Calendar, Pin, Sparkles, Link as LinkIcon, Check, Award, ShieldCheck, Truck, RotateCcw, HandHeart, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/lib/api';
import LoadingSpinner from '@/shared/components/loading-spinner';

interface VendorProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  images: string[];
  status: string;
}

interface VendorStorefront {
  id: string;
  businessName: string;
  description: string | null;
  bannerImageUrl: string | null;
  createdAt: string;
  // VENDOR_BACKLOG.md VND-021 -- populated by VND-023's Vendor.slug, not
  // explicitly `select`ed by findVendorByUserId() but returned anyway
  // since that query uses `include` (all scalar fields) rather than `select`.
  slug: string | null;
  // VENDOR_BACKLOG.md VND-026 -- same "returned via include, not select" reasoning as slug above
  performanceTier?: 'NEW_VENDOR' | 'ESTABLISHED' | 'TRUSTED_VENDOR' | 'SACRED_ARTISAN';
  user: {
    id: string;
    name: string;
    verified: boolean;
    role: string;
    bio: string | null;
    slug: string | null;
  };
  storefront: {
    totalSales: number;
    reviewCount: number;
    averageRating: number | null;
    memberSince: string;
  };
  featuredProducts: VendorProduct[];
}

// SHOP_BACKLOG.md MSP-006: "Transparency reports on vendor practices and sourcing"
interface TransparencyReport {
  culturalCertificationTier: string;
  sourcing: { statement: string; verifiedAt: string } | null;
  fulfillmentRate: number | null;
  returnRate: number | null;
  disputeHistory: { total: number; resolved: number };
  elderEndorsements: number;
}

const CERT_TIER_LABEL: Record<string, string> = {
  COMMUNITY_LISTED: 'Community Listed',
  COMMUNITY_VERIFIED: 'Community Verified',
  ELDER_ENDORSED: 'Elder Endorsed',
};

const fmt = (price: number, currency: string) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: currency || 'NGN', minimumFractionDigits: 0 }).format(price);

const ProductCard: React.FC<{ product: VendorProduct; onClick: () => void; pinned?: boolean }> = ({ product, onClick, pinned }) => (
  <button
    onClick={onClick}
    className="text-left bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow relative"
  >
    {pinned && (
      <span className="absolute top-2 left-2 z-10 flex items-center gap-1 text-[10px] font-bold bg-amber-500 text-white px-2 py-1 rounded-full">
        <Pin size={10} /> Featured
      </span>
    )}
    <div className="aspect-square bg-muted/40 flex items-center justify-center overflow-hidden">
      {product.images?.[0] ? (
        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
      ) : (
        <ShoppingBag className="text-muted-foreground" size={32} />
      )}
    </div>
    <div className="p-3">
      <p className="text-sm font-bold text-foreground line-clamp-1">{product.name}</p>
      <p className="text-sm text-highlight font-bold mt-1">{fmt(product.price, product.currency)}</p>
    </div>
  </button>
);

const VendorStorefrontPage: React.FC = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const [linkCopied, setLinkCopied] = useState(false);

  const { data: vendor, isLoading, isError } = useQuery<VendorStorefront>({
    queryKey: ['vendor-storefront', vendorId],
    queryFn: async () => (await api.get(`/marketplace/vendors/${vendorId}`)).data,
    enabled: !!vendorId,
  });

  const { data: products = [] } = useQuery<VendorProduct[]>({
    queryKey: ['vendor-storefront-products', vendorId],
    queryFn: async () =>
      (await api.get('/marketplace/products', { params: { vendorId, status: 'ACTIVE' } })).data,
    enabled: !!vendorId,
  });

  // SHOP_BACKLOG.md MSP-006 -- fetched by the real Vendor.id (vendor.id),
  // not the route's :vendorId param, which findVendorByUserId() also
  // resolves by slug/User.id.
  const { data: report } = useQuery<TransparencyReport>({
    queryKey: ['vendor-transparency-report', vendor?.id],
    queryFn: async () => (await api.get(`/marketplace/vendors/${vendor!.id}/transparency-report`)).data,
    enabled: !!vendor?.id,
  });
  const [reportExpanded, setReportExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !vendor) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl text-center">
        <Store className="mx-auto text-muted-foreground mb-4" size={40} />
        <h1 className="text-xl font-bold text-foreground">Storefront not found</h1>
        <p className="text-muted-foreground mt-2">This vendor may no longer be active on the platform.</p>
      </div>
    );
  }

  const memberSince = new Date(vendor.storefront.memberSince).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  const featuredIds = new Set(vendor.featuredProducts.map((p) => p.id));
  const restProducts = products.filter((p) => !featuredIds.has(p.id));

  return (
    <div className="bg-muted/40">
      {/* Banner */}
      <div className="h-40 sm:h-56 bg-gradient-to-br from-highlight/30 to-stone-800/40 relative overflow-hidden">
        {vendor.bannerImageUrl && (
          <img src={vendor.bannerImageUrl} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="container mx-auto px-4 max-w-5xl">
        {/* Identity */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 -mt-12 relative">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-16 h-16 rounded-full bg-highlight/10 flex items-center justify-center text-highlight font-bold text-2xl border-4 border-card">
                {vendor.businessName.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 flex-wrap">
                  {vendor.businessName}
                  {vendor.user.verified && (
                    <CheckCircle className="text-green-500" size={18} aria-label="Verified vendor" />
                  )}
                  {/* VENDOR_BACKLOG.md VND-026 */}
                  {vendor.performanceTier && vendor.performanceTier !== 'NEW_VENDOR' && (
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full font-bold">
                      {vendor.performanceTier === 'SACRED_ARTISAN' ? '🔮 Sacred Artisan' :
                       vendor.performanceTier === 'TRUSTED_VENDOR' ? '🌟 Trusted Vendor' : '⭐ Established'}
                    </span>
                  )}
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar size={12} /> Member since {memberSince}
                </p>
              </div>
            </div>
            {/* VENDOR_BACKLOG.md VND-021: copy link to this storefront's clean slug URL */}
            <button
              type="button"
              onClick={() => {
                // findVendorByUserId() (backing this page's data) resolves
                // by Vendor.slug or the vendor's User.id -- never Vendor.id
                // -- so the shareable link must use one of those, matching
                // how this page itself is already reached.
                const url = `${window.location.origin}/vendors/${vendor.slug ?? vendor.user.id}`;
                navigator.clipboard.writeText(url).then(() => {
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                });
              }}
              className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-xs font-bold hover:bg-muted transition-colors"
            >
              {linkCopied ? <Check size={14} className="text-green-600" /> : <LinkIcon size={14} />}
              {linkCopied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          {vendor.description && (
            <p className="text-sm text-foreground/80 mt-4 whitespace-pre-line">{vendor.description}</p>
          )}

          {/* Social proof */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border/50 text-sm">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <ShoppingBag size={14} className="text-muted-foreground" /> {vendor.storefront.totalSales} sales
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <Star size={14} className="text-amber-500 fill-current" />
              {vendor.storefront.averageRating ?? '—'} ({vendor.storefront.reviewCount} reviews)
            </span>
          </div>

          {/* VENDOR_BACKLOG.md VND-016: "About my practice" -- links a vendor
              who is also a practicing Babalawo to their practitioner profile. */}
          {vendor.user.role === 'BABALAWO' && vendor.user.slug && (
            <button
              onClick={() => navigate(`/${vendor.user.slug}`)}
              className="mt-4 flex items-center gap-2 text-sm font-bold text-highlight hover:underline"
            >
              <Sparkles size={14} /> Also a practicing Babalawo — view spiritual practice profile
            </button>
          )}
        </div>

        {/* SHOP_BACKLOG.md MSP-006: Transparency Report -- reuses fulfillment/
            review/dispute/certification/endorsement data that all already
            existed, surfaced here as one buyer-facing trust summary. */}
        {report && (
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 mt-4">
            <button
              type="button"
              onClick={() => setReportExpanded((v) => !v)}
              className="w-full flex items-center justify-between gap-3"
            >
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" /> Transparency Report
              </h2>
              {reportExpanded ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
            </button>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                report.culturalCertificationTier === 'ELDER_ENDORSED'
                  ? 'bg-highlight/20 text-highlight'
                  : report.culturalCertificationTier === 'COMMUNITY_VERIFIED'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {report.culturalCertificationTier === 'ELDER_ENDORSED' ? <Award size={12} /> : <ShieldCheck size={12} />}
                {CERT_TIER_LABEL[report.culturalCertificationTier] ?? report.culturalCertificationTier}
              </span>
              {report.elderEndorsements > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1">
                  <HandHeart size={12} /> {report.elderEndorsements} elder endorsement{report.elderEndorsements === 1 ? '' : 's'}
                </span>
              )}
            </div>

            {reportExpanded && (
              <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                {report.sourcing && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Sourcing & Provenance</p>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{report.sourcing.statement}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Reviewed {new Date(report.sourcing.verifiedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  {report.fulfillmentRate !== null && (
                    <div className="flex items-center gap-2">
                      <Truck size={14} className="text-muted-foreground" />
                      <span>{report.fulfillmentRate}% fulfillment (30d)</span>
                    </div>
                  )}
                  {report.returnRate !== null && (
                    <div className="flex items-center gap-2">
                      <RotateCcw size={14} className="text-muted-foreground" />
                      <span>{report.returnRate}% return rate</span>
                    </div>
                  )}
                  {report.disputeHistory.total > 0 && (
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-muted-foreground" />
                      <span>{report.disputeHistory.resolved}/{report.disputeHistory.total} disputes resolved</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Featured products */}
        {vendor.featuredProducts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-foreground mb-3">Featured</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {vendor.featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} pinned onClick={() => navigate(`/marketplace/${p.id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* All products */}
        <div className="mt-8 pb-12">
          <h2 className="text-lg font-bold text-foreground mb-3">All Products ({products.length})</h2>
          {restProducts.length === 0 && vendor.featuredProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">This vendor has no active listings right now.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {restProducts.map((p) => (
                <ProductCard key={p.id} product={p} onClick={() => navigate(`/marketplace/${p.id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorStorefrontPage;
