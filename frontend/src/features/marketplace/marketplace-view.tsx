import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, Package, Store, Star, Lock, Calendar, Sparkles, Check, BookOpen, Globe2, GraduationCap, Users2, Award, ShieldCheck } from 'lucide-react';
import { FeatureHeader } from '@/shared/components/feature-header';
import api from '@/lib/api';
import { useCart } from '@/shared/contexts/cart-context';
import { MARKETPLACE_CATEGORIES, getCategoryBySlug } from './marketplace-categories';
import { isDevModeActive } from '@/shared/utils/dev-mode';
import RitualParticipationPanel from '@/features/community/ritual-participation-panel';
import { useAuth } from '@/shared/hooks/use-auth';

interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  status: string;
  user: {
    id: string;
    name: string;
    yorubaName?: string;
    verified: boolean;
  };
}

interface Product {
  id: string;
  vendorId: string;
  name: string;
  category: string;
  subcategory?: string;
  type: string;
  description: string;
  price: number;
  currency: string;
  stock?: number;
  images: string[];
  provenance?: string;
  requiresInitiation?: boolean;
  verifiedTier: string;
  status: string;
  // VENDOR_BACKLOG.md VND-018
  yorubaName?: string;
  regionOfOrigin?: string;
  // VENDOR_BACKLOG.md VND-008
  showComingSoon?: boolean;
  isPreOrder?: boolean;
  vendor: {
    id: string;
    businessName: string;
    // VENDOR_BACKLOG.md VND-017
    culturalCertificationTier?: string;
    user: {
      name: string;
      yorubaName?: string;
      verified: boolean;
    };
  };
  _count: {
    orders: number;
    reviews: number;
  };
}

interface UpcomingEvent {
  id: string;
  title: string;
  yorubaName?: string;
  description: string;
  date: string;
  endDate?: string;
  type: string;
  bannerColor?: string;
}

interface UpcomingEventsResponse {
  upcomingEvents: UpcomingEvent[];
  featuredProducts: Product[];
  // SHOP_BACKLOG.md MSP-008: true once at least one vendor's item has been
  // admin-approved for the nearest event specifically, vs. the generic
  // isFeatured fallback
  featuredProductsEventTagged?: boolean;
}

// SHOP_BACKLOG.md MSP-004
interface RecommendationGroup {
  category: string;
  products: Product[];
}
interface RecommendationsResponse {
  becauseYouBought: RecommendationGroup[];
}

// SHOP_BACKLOG.md MSP-002
interface BundleItem {
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    currency: string;
    images: string[];
    stock?: number;
    vendorId: string;
    vendor: { businessName: string };
  };
}

interface Bundle {
  id: string;
  name: string;
  description?: string;
  items: BundleItem[];
  totalPrice: number;
  available: boolean;
}

interface MarketplaceViewProps {
  onSelectProduct?: (productId: string) => void;
}

/**
 * Marketplace View Component
 * Vendor directory, product listings, and shopping
 * 8 cultural categories with subcategory filtering
 */
// SHOP_BACKLOG.md MSP-001: rule-based authenticity tiers, most-vetted first --
// matches the ordering the backend already applies (see marketplace.service.ts
// VERIFIED_TIER_RANK), not a separate ranking system.
const VERIFIED_TIER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All Tiers' },
  { value: 'COUNCIL_APPROVED', label: 'Council Approved' },
  { value: 'ARTISAN_DIRECT', label: 'Artisan Direct' },
  { value: 'COMMUNITY_LISTED', label: 'Community Listed' },
];

const MarketplaceView: React.FC<MarketplaceViewProps> = ({ onSelectProduct }) => {
  const { totalItems, addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  // VENDOR_BACKLOG.md VND-017: "Marketplace filter: Show only Elder Endorsed"
  const [elderEndorsedOnly, setElderEndorsedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [addedBundleId, setAddedBundleId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const activeCategory = getCategoryBySlug(selectedCategory);

  // Reset subcategory when main category changes
  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    setSelectedSubcategory('all');
  };

  // Fetch products — server-side search when query ≥ 3 chars, client-side otherwise
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['marketplace-products', selectedCategory, selectedSubcategory, selectedTier, debouncedSearch, elderEndorsedOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedSubcategory !== 'all') params.append('subcategory', selectedSubcategory);
      if (selectedTier !== 'all') params.append('verifiedTier', selectedTier);
      if (debouncedSearch.length >= 3) params.append('search', debouncedSearch);
      if (elderEndorsedOnly) params.append('elderEndorsedOnly', 'true');
      const response = await api.get(`/marketplace/products?${params.toString()}`);
      return response.data || [];
    },
    enabled: !isDevModeActive(),
  });

  // SHOP_BACKLOG.md MSP-008: upcoming Sacred Calendar events + currently
  // featured products, surfaced together on the homepage.
  const { data: upcoming } = useQuery<UpcomingEventsResponse>({
    queryKey: ['marketplace-upcoming-events'],
    queryFn: async () => {
      const response = await api.get('/marketplace/products/upcoming-events');
      return response.data;
    },
    enabled: !isDevModeActive(),
    staleTime: 10 * 60 * 1000,
  });

  // SHOP_BACKLOG.md MSP-004: "because you bought in X" -- rule-based on
  // actual purchase history, not personalized ML. Signed-in only, since it's
  // keyed off the user's own order history.
  const { data: recommendations } = useQuery<RecommendationsResponse>({
    queryKey: ['marketplace-recommendations'],
    queryFn: async () => {
      const response = await api.get('/marketplace/products/recommendations');
      return response.data;
    },
    enabled: isAuthenticated && !isDevModeActive(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch vendors (used for vendor count display)
  const { data: _vendors = [] } = useQuery<Vendor[]>({
    queryKey: ['marketplace-vendors'],
    queryFn: async () => {
      const response = await api.get('/marketplace/vendors?status=APPROVED');
      return response.data || [];
    },
    enabled: !isDevModeActive(),
  });

  // SHOP_BACKLOG.md MSP-002: approved cross-vendor ritual bundles/kits
  const { data: bundles = [] } = useQuery<Bundle[]>({
    queryKey: ['marketplace-bundles'],
    queryFn: async () => {
      const response = await api.get('/marketplace/bundles');
      return response.data || [];
    },
    enabled: !isDevModeActive(),
    staleTime: 5 * 60 * 1000,
  });

  const handleAddBundleToCart = (bundle: Bundle) => {
    bundle.items.forEach((item) => {
      addItem({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        currency: item.product.currency,
        quantity: item.quantity,
        image: item.product.images?.[0],
        vendorId: item.product.vendorId,
        vendorName: item.product.vendor.businessName,
        stock: item.product.stock,
      });
    });
    setAddedBundleId(bundle.id);
    setTimeout(() => setAddedBundleId(null), 2000);
  };

  // Client-side search filter for queries < 3 chars (server handles ≥ 3)
  const filteredProducts = products.filter(product => {
    if (!searchQuery || searchQuery.length >= 3) return true;
    const q = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(q) ||
      product.description.toLowerCase().includes(q)
    );
  });

  const getCategoryColor = (categorySlug: string) => {
    return getCategoryBySlug(categorySlug)?.color ?? 'bg-muted/60 text-foreground';
  };

  const getCategoryIcon = (categorySlug: string) => {
    return getCategoryBySlug(categorySlug)?.icon ?? '📦';
  };

  if (productsLoading) {
    return (
      <div className="py-12 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, idx) => (
            <div key={idx} className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
              <div className="h-48 bg-muted"></div>
              <div className="p-5 space-y-3">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 animate-in fade-in duration-500">
      {/* Header */}
      <FeatureHeader feature="marketplace" title="Oja Ìlú Àṣẹ" subtitle="Sacred Marketplace. Curated spiritual artifacts, verified botanical ingredients, and sacred texts for your journey." icon={Store} />

      {/* SHOP_BACKLOG.md MSP-020: browse-by-story view, distinct from category browse.
          MSP-004: cross-cultural + cultural-education recommendation links --
          rule-based ("you're in the marketplace") rather than personalized,
          consistent with this doc's "why am I seeing this" transparency principle. */}
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Link to="/marketplace/stories" className="inline-flex items-center gap-2 text-sm font-medium text-highlight hover:underline">
          <BookOpen size={16} />
          Browse item stories & origins
        </Link>
        <Link to="/circles/cross-cultural-bridges" className="inline-flex items-center gap-2 text-sm font-medium text-highlight hover:underline">
          <Globe2 size={16} />
          Explore Cross-Cultural Practice Bridges
        </Link>
        <Link to="/academy" className="inline-flex items-center gap-2 text-sm font-medium text-highlight hover:underline">
          <GraduationCap size={16} />
          Learn the cultural context in the Academy
        </Link>
        {/* SHOP_BACKLOG.md MSP-005: vendor collaboration transparency */}
        <Link to="/marketplace/partnerships" className="inline-flex items-center gap-2 text-sm font-medium text-highlight hover:underline">
          <Users2 size={16} />
          See vendor partnerships
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-200" size={20} />
            <input
              type="text"
              placeholder="Search sacred items, herbs, tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/20 text-white placeholder-purple-100 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>
      </div>

      {/* Upcoming Sacred Calendar Event + Featured Items -- SHOP_BACKLOG.md MSP-008 */}
      {upcoming?.upcomingEvents && upcoming.upcomingEvents.length > 0 && (
        <div className="mb-6 bg-highlight/10 border border-highlight/30 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="bg-highlight/20 p-2 rounded-xl">
              <Calendar size={20} className="text-highlight" />
            </div>
            <div>
              <p className="text-xs font-bold text-highlight uppercase tracking-wider">Coming Up</p>
              <h3 className="font-bold text-foreground text-lg">
                {upcoming.upcomingEvents[0].title}
                {upcoming.upcomingEvents[0].yorubaName && (
                  <span className="text-muted-foreground font-normal text-sm ml-2">
                    ({upcoming.upcomingEvents[0].yorubaName})
                  </span>
                )}
              </h3>
              <p className="text-muted-foreground text-sm mt-0.5">
                {new Date(upcoming.upcomingEvents[0].date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                })}
                {' — '}
                {upcoming.upcomingEvents[0].description}
              </p>
            </div>
          </div>
          {/* COMMUNITY_BACKLOG.md FOR-013: RSVP + intention sharing */}
          <RitualParticipationPanel eventId={upcoming.upcomingEvents[0].id} />
          {upcoming.featuredProducts.length > 0 && (
            <div>
              {/* SHOP_BACKLOG.md MSP-008: only claim "for this event" once
                  items are actually approved for it, not just generically featured */}
              <p className="text-xs text-muted-foreground mb-2">
                {upcoming.featuredProductsEventTagged ? 'Prepared for this event' : 'Featured items'}
              </p>
              <div className="flex gap-3 overflow-x-auto pb-1">
              {upcoming.featuredProducts.slice(0, 6).map((product) => (
                <button
                  type="button"
                  key={product.id}
                  onClick={() => onSelectProduct?.(product.id)}
                  className="flex-shrink-0 w-40 bg-card border border-border rounded-xl p-3 text-left hover:border-highlight/50 transition-colors"
                >
                  <p className="font-semibold text-foreground text-xs truncate">{product.name}</p>
                  <p className="text-highlight font-bold text-sm mt-1">₦{product.price.toLocaleString()}</p>
                </button>
              ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ritual Kits & Bundles -- SHOP_BACKLOG.md MSP-002 */}
      {bundles.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Sparkles size={18} className="text-primary" />
            </div>
            <h3 className="font-bold text-foreground">Ritual Kits & Bundles</h3>
            <span className="text-xs text-muted-foreground">Curated across vendors, elder-approved</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {bundles.map((bundle) => {
              const vendorCount = new Set(bundle.items.map((item) => item.product.vendorId)).size;
              return (
                <div
                  key={bundle.id}
                  className="flex-shrink-0 w-72 bg-card border border-border rounded-2xl p-4 shadow-sm"
                >
                  <Link to={`/marketplace/bundles/${bundle.id}`} className="font-bold text-foreground text-sm mb-1 hover:text-highlight block">
                    {bundle.name}
                  </Link>
                  {bundle.description && (
                    <p className="text-muted-foreground text-xs mb-3 line-clamp-2">{bundle.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mb-1">
                    {bundle.items.length} items from {vendorCount} {vendorCount === 1 ? 'vendor' : 'vendors'}
                  </p>
                  <Link to={`/marketplace/bundles/${bundle.id}`} className="text-xs text-highlight hover:underline mb-3 inline-block">
                    View kit details, guide & community →
                  </Link>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary text-lg">
                      ₦{bundle.totalPrice.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      disabled={!bundle.available}
                      onClick={() => handleAddBundleToCart(bundle)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        !bundle.available
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
                          : addedBundleId === bundle.id
                            ? 'bg-primary/20 text-primary'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                    >
                      {!bundle.available ? (
                        'Unavailable'
                      ) : addedBundleId === bundle.id ? (
                        <span className="flex items-center gap-1"><Check size={12} /> Added</span>
                      ) : (
                        'Add Kit to Cart'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SHOP_BACKLOG.md MSP-004: rule-based "because you bought" recommendations */}
      {recommendations?.becauseYouBought.map((group) => (
        <div key={group.category} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Package size={18} className="text-primary" />
            </div>
            <h3 className="font-bold text-foreground">Because you bought in {group.category}</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {group.products.map((product) => (
              <button
                type="button"
                key={product.id}
                onClick={() => onSelectProduct?.(product.id)}
                className="flex-shrink-0 w-40 bg-card border border-border rounded-xl p-3 text-left hover:border-highlight/50 transition-colors"
              >
                <p className="font-semibold text-foreground text-xs truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground truncate">{product.vendor.businessName}</p>
                <p className="text-highlight font-bold text-sm mt-1">₦{product.price.toLocaleString()}</p>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Category Tabs */}
      <div className="mb-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleCategoryChange('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
            selectedCategory === 'all'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-foreground border-border hover:border-primary/50 hover:bg-muted'
          }`}
        >
          📦 All Items
        </button>
        {MARKETPLACE_CATEGORIES.map((cat) => (
          <button
            type="button"
            key={cat.slug}
            onClick={() => handleCategoryChange(cat.slug)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              selectedCategory === cat.slug
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border hover:border-primary/50 hover:bg-muted'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Subcategory Chips (shown when a category is selected) */}
      {activeCategory && (
        <div className="mb-6 flex flex-wrap gap-2 pl-1">
          <button
            type="button"
            onClick={() => setSelectedSubcategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              selectedSubcategory === 'all'
                ? 'bg-secondary text-secondary-foreground border-secondary'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            All {activeCategory.label}
          </button>
          {activeCategory.subcategories.map((sub) => (
            <button
              type="button"
              key={sub.slug}
              onClick={() => setSelectedSubcategory(sub.slug)}
              title={sub.culturalNote}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                selectedSubcategory === sub.slug
                  ? 'bg-secondary text-secondary-foreground border-secondary'
                  : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {/* Authenticity Tier Filter -- SHOP_BACKLOG.md MSP-001 */}
      <div className="mb-6 flex flex-wrap items-center gap-2 pl-1">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">Authenticity:</span>
        {VERIFIED_TIER_OPTIONS.map((tier) => (
          <button
            type="button"
            key={tier.value}
            onClick={() => setSelectedTier(tier.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              selectedTier === tier.value
                ? 'bg-highlight text-white border-highlight'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {tier.label}
          </button>
        ))}
        {/* VENDOR_BACKLOG.md VND-017 */}
        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border cursor-pointer select-none ml-1">
          <input
            type="checkbox"
            checked={elderEndorsedOnly}
            onChange={(e) => setElderEndorsedOnly(e.target.checked)}
            className="accent-highlight"
          />
          <Award size={12} className="text-highlight" />
          Elder Endorsed only
        </label>
      </div>

      {/* Results Count + Cart */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-muted-foreground font-medium">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'} found
          {activeCategory && <span className="ml-1">in <strong>{activeCategory.label}</strong></span>}
        </p>
        <div className="flex items-center gap-2">
          {/* VENDOR_BACKLOG.md VND-010: nowhere in the app let a customer see
              their own past orders or request a return -- this is the entry
              point into the new my-orders-view.tsx. */}
          <button
            type="button"
            onClick={() => onSelectProduct?.('my-orders')}
            className="flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-xl font-bold hover:bg-muted transition-colors"
          >
            My Orders
          </button>
          <button
            type="button"
            onClick={() => onSelectProduct?.('cart')}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl font-bold hover:bg-primary/20 transition-colors"
          >
            <ShoppingCart size={18} />
            Cart ({totalItems})
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => onSelectProduct?.(product.id)}
              className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
            >
              {/* Product Image */}
              <div className="relative h-48 overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/5 flex items-center justify-center">
                    <Package size={48} className="text-primary/30" />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getCategoryColor(product.category)}`}>
                    {getCategoryIcon(product.category)} {getCategoryBySlug(product.category)?.label ?? product.category}
                  </span>
                  {product.requiresInitiation && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 flex items-center gap-1">
                      <Lock size={10} /> Initiated Only
                    </span>
                  )}
                  {/* VENDOR_BACKLOG.md VND-017 */}
                  {product.vendor.culturalCertificationTier === 'ELDER_ENDORSED' && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-highlight/20 text-highlight flex items-center gap-1">
                      <Award size={10} /> Elder Endorsed
                    </span>
                  )}
                  {product.vendor.culturalCertificationTier === 'COMMUNITY_VERIFIED' && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary flex items-center gap-1">
                      <ShieldCheck size={10} /> Community Verified
                    </span>
                  )}
                  {/* VENDOR_BACKLOG.md VND-018 */}
                  {product.regionOfOrigin && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                      📍 {product.regionOfOrigin}
                    </span>
                  )}
                  {/* VENDOR_BACKLOG.md VND-008 */}
                  {product.status === 'DRAFT' && product.showComingSoon && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                      Coming Soon
                    </span>
                  )}
                  {product.isPreOrder && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      Pre-Order
                    </span>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1">
                    {product.yorubaName ? `${product.yorubaName} (${product.name})` : product.name}
                  </h3>
                  <span className="font-bold text-primary whitespace-nowrap ml-2 text-sm">
                    {product.currency === 'NGN' ? '₦' : '$'}{product.price.toLocaleString()}
                  </span>
                </div>

                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {product.description}
                </p>

                {/* Vendor Info */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-t border-border/50 pt-3">
                  <div className="bg-muted p-1.5 rounded-lg">
                    <Store size={12} className="text-muted-foreground" />
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {product.vendor.businessName}
                    {product.vendor.user.verified && <span className="text-primary ml-1">✓</span>}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star size={11} className="text-amber-500 fill-current" />
                    <span>{(product._count.reviews || 0) > 0 ? 'Rated' : 'New'}</span>
                  </div>
                  <div>Sold: {product._count.orders}</div>
                  <div>{product.stock != null ? `Stock: ${product.stock}` : '∞'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-muted/30 rounded-2xl border border-border">
          <Package size={64} className="mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">No Items Found</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            {searchQuery
              ? `No items matching "${searchQuery}". Try a different search term.`
              : 'No items in this category yet. Check back soon or explore other categories.'}
          </p>
          <button
            type="button"
            onClick={() => { setSearchQuery(''); handleCategoryChange('all'); }}
            className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
          >
            Browse All Items
          </button>
        </div>
      )}
    </div>
  );
};

export default MarketplaceView;
