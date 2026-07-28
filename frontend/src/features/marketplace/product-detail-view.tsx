import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Package, Store, Star, Plus, Minus, Check, Lock, BookOpen, ShieldCheck, Flag, Users, Clock, Award } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { useCart } from '@/shared/contexts/cart-context';
import { useToast } from '@/shared/components/toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getCategoryBySlug, getSubcategoryLabel } from './marketplace-categories';
import { isDevModeActive } from '@/shared/utils/dev-mode';
import SocialShareButton from './social-share-button';

// COMMUNITY_BACKLOG.md FOR-024/FOR-026: same categories the admin oral-history
// form uses (admin-cultural-content-tab.tsx) -- one shared taxonomy, not a
// second one invented for the community-submission path.
const STORY_CATEGORIES = ['Divination', 'Ceremony', 'Proverbs', 'History', 'Elder Teaching', 'Myth & Legend', 'Ritual'];

// VENDOR_BACKLOG.md VND-007
interface Variant {
  id: string;
  attributes: Record<string, string>;
  sku?: string;
  priceOverride?: number | null;
  stock?: number | null;
}

interface Product {
  id: string;
  vendorId: string;
  name: string;
  category: string;
  subcategory?: string;
  requiresInitiation?: boolean;
  type: string;
  description: string;
  longDescription?: string;
  price: number;
  currency: string;
  stock?: number;
  images: string[];
  provenance?: string;
  usageProtocol?: string;
  // VENDOR_BACKLOG.md VND-018
  yorubaName?: string;
  yorubaDescription?: string;
  pronunciationGuide?: string;
  traditionalUseContext?: string;
  regionOfOrigin?: string;
  relatedStories?: Array<{
    id: string;
    title: string;
    category: string;
    babalawoName?: string;
    content: string;
    sourceUrl?: string;
  }>;
  verifiedTier: string;
  status: string;
  // VENDOR_BACKLOG.md VND-008
  showComingSoon?: boolean;
  isPreOrder?: boolean;
  expectedDeliveryDate?: string;
  // VENDOR_BACKLOG.md VND-005
  isMadeToOrder?: boolean;
  madeToOrderProcessingTime?: string;
  // SHOP_BACKLOG.md MSP-015
  endorsementCount?: number;
  communityEndorsed?: boolean;
  // VENDOR_BACKLOG.md VND-007
  variantAttributeNames?: string[];
  // VENDOR_BACKLOG.md VND-025
  wholesaleEnabled?: boolean;
  vendor: {
    id: string;
    businessName: string;
    // VENDOR_BACKLOG.md VND-026
    performanceTier?: 'NEW_VENDOR' | 'ESTABLISHED' | 'TRUSTED_VENDOR' | 'SACRED_ARTISAN';
    // VENDOR_BACKLOG.md VND-017
    culturalCertificationTier?: string;
    user: {
      id: string;
      name: string;
      yorubaName?: string;
      verified: boolean;
    };
  };
  reviews: Array<{
    id: string;
    rating: number;
    title?: string;
    content?: string;
    createdAt: string;
    // VENDOR_BACKLOG.md VND-022
    vendorResponse?: string;
    vendorRespondedAt?: string;
    customer: {
      id: string;
      name: string;
      yorubaName?: string;
      verified: boolean;
    };
  }>;
  _count: {
    orders: number;
    reviews: number;
  };
}

// SHOP_BACKLOG.md MSP-004
interface SimilarVendor {
  id: string;
  businessName: string;
  products: Array<{ id: string; name: string; price: number; currency: string; images: string[] }>;
}

interface ProductDetailViewProps {
  productId: string;
  onBack?: () => void;
}

/**
 * Product Detail View Component
 * Product details, reviews, and add to cart
 */
const ProductDetailView: React.FC<ProductDetailViewProps> = ({ productId, onBack }) => {
  const { isAuthenticated, user } = useAuth();
  const { addItem } = useCart();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  // VENDOR_BACKLOG.md VND-007
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // VENDOR_BACKLOG.md VND-018: description language toggle, only relevant
  // when the vendor has actually filled in a Yoruba description.
  const [descLang, setDescLang] = useState<'en' | 'yo'>('en');

  // COMMUNITY_BACKLOG.md FOR-024: community story submission
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [storyTitle, setStoryTitle] = useState('');
  const [storyCategory, setStoryCategory] = useState(STORY_CATEGORIES[0]);
  const [storyContent, setStoryContent] = useState('');
  const [storySubmitted, setStorySubmitted] = useState(false);

  // SHOP_BACKLOG.md MSP-015: endorsement + flagging
  const [hasEndorsed, setHasEndorsed] = useState(false);
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [flagSubmitted, setFlagSubmitted] = useState(false);

  // Fetch product
  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: ['marketplace-product', productId],
    queryFn: async () => {
      const response = await api.get(`/marketplace/products/${productId}`);
      return response.data;
    },
    enabled: !!productId && !isDevModeActive(),
  });

  // VENDOR_BACKLOG.md VND-007
  const { data: variants = [] } = useQuery<Variant[]>({
    queryKey: ['product-variants', productId],
    queryFn: async () => (await api.get(`/marketplace/products/${productId}/variants`)).data,
    enabled: !!productId && !isDevModeActive(),
  });
  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const effectivePrice = selectedVariant?.priceOverride ?? product?.price ?? 0;
  const effectiveStock = selectedVariant ? selectedVariant.stock : product?.stock;
  const variantLabel = (v: Variant) => Object.values(v.attributes).join(' / ');

  // SHOP_BACKLOG.md MSP-004: "vendor collaboration surfacing" -- other
  // vendors selling in this same category, not a personalized/ML match.
  const { data: similarVendors = [] } = useQuery<SimilarVendor[]>({
    queryKey: ['marketplace-similar-vendors', productId],
    queryFn: async () => {
      const response = await api.get(`/marketplace/products/${productId}/similar-vendors`);
      return response.data;
    },
    enabled: !!productId && !isDevModeActive(),
  });

  const endorseMutation = useMutation({
    mutationFn: async () => api.post(`/marketplace/products/${productId}/endorse`),
    onSuccess: () => {
      setHasEndorsed(true);
      success('Thank you for endorsing this item');
      queryClient.invalidateQueries({ queryKey: ['marketplace-product', productId] });
    },
    onError: () => toastError('Could not record your endorsement — please try again'),
  });

  const flagMutation = useMutation({
    mutationFn: async () => api.post(`/marketplace/products/${productId}/flag`, { reason: flagReason }),
    onSuccess: () => {
      setFlagSubmitted(true);
      setShowFlagForm(false);
      setFlagReason('');
      success('Thank you — an elder will review this listing');
    },
    onError: () => toastError('Could not submit your flag — please try again'),
  });

  const handleAddToCart = () => {
    if (product) {
      addItem({
        productId: product.id,
        name: product.name,
        price: effectivePrice,
        currency: product.currency,
        quantity,
        image: product.images?.[0],
        vendorId: product.vendorId,
        vendorName: product.vendor.businessName,
        stock: effectiveStock ?? undefined,
        // VENDOR_BACKLOG.md VND-007
        variantId: selectedVariant?.id,
        variantLabel: selectedVariant ? variantLabel(selectedVariant) : undefined,
      });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  // COMMUNITY_BACKLOG.md FOR-024/FOR-026: submits into the same
  // OralHistoryEntry table and admin review queue admins already use --
  // lands as a draft (publishedAt: null) until an elder/admin publishes it.
  const submitStoryMutation = useMutation({
    mutationFn: async () => {
      return api.post('/cultural/oral-histories/submit', {
        title: storyTitle,
        category: storyCategory,
        content: storyContent,
        relatedProductIds: [productId],
      });
    },
    onSuccess: () => {
      setStorySubmitted(true);
      setStoryTitle('');
      setStoryContent('');
      setShowStoryForm(false);
    },
  });

  const handleSubmitStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (storyTitle.trim() && storyContent.trim()) {
      submitStoryMutation.mutate();
    }
  };

  if (productLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <LoadingSpinner size="lg" variant="highlight" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-muted-foreground">Product not found.</p>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 text-highlight hover:text-highlight/80 transition-colors"
            >
              Back to Marketplace
            </button>
          )}
        </div>
      </div>
    );
  }

  const maxQuantity = (effectiveStock !== undefined && effectiveStock !== null) ? Math.min(effectiveStock, 10) : 10;
  const averageRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Marketplace
          </button>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative h-96 bg-muted/50 border border-border rounded-xl overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Package size={64} />
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden ${selectedImageIndex === index
                      ? 'border-highlight'
                      : 'border-border hover:border-muted-foreground'
                      }`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title and Vendor */}
            <div>
              {/* VENDOR_BACKLOG.md VND-018: Yoruba name shown first with
                  English in brackets, plus pronunciation, when the vendor
                  has provided one -- otherwise just the English name. */}
              {product.yorubaName ? (
                <h1 className="text-3xl font-bold brand-font text-foreground mb-1">
                  {product.yorubaName} <span className="text-muted-foreground font-normal text-2xl">({product.name})</span>
                </h1>
              ) : (
                <h1 className="text-3xl font-bold brand-font text-foreground mb-2">{product.name}</h1>
              )}
              {product.pronunciationGuide && (
                <p className="text-sm text-muted-foreground italic mb-2">Pronounced: {product.pronunciationGuide}</p>
              )}
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Store size={16} />
                <Link to={`/vendors/${product.vendor.user.id}`} className="hover:text-highlight hover:underline">
                  {product.vendor.businessName}
                </Link>
                {product.vendor.user.verified && (
                  <span className="text-xs bg-highlight/20 text-highlight px-2 py-1 rounded">
                    ✓ Verified Vendor
                  </span>
                )}
                {/* VENDOR_BACKLOG.md VND-026 */}
                {product.vendor.performanceTier && product.vendor.performanceTier !== 'NEW_VENDOR' && (
                  <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded">
                    {product.vendor.performanceTier === 'SACRED_ARTISAN' ? '🔮 Sacred Artisan' :
                     product.vendor.performanceTier === 'TRUSTED_VENDOR' ? '🌟 Trusted Vendor' : '⭐ Established'}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {(() => {
                  const cat = getCategoryBySlug(product.category);
                  return cat ? (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${cat.color}`}>
                      {cat.icon} {cat.label}
                    </span>
                  ) : null;
                })()}
                {product.subcategory && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground">
                    {getSubcategoryLabel(product.category, product.subcategory)}
                  </span>
                )}
                {product.requiresInitiation && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1">
                    <Lock size={10} /> Initiated Practitioners Only
                  </span>
                )}
                {product.verifiedTier === 'COUNCIL_APPROVED' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-highlight/20 text-highlight">
                    ✓ Council Approved
                  </span>
                )}
                {product.communityEndorsed && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary flex items-center gap-1">
                    <ShieldCheck size={12} /> Community Endorsed
                  </span>
                )}
                {/* VENDOR_BACKLOG.md VND-017 */}
                {product.vendor.culturalCertificationTier === 'ELDER_ENDORSED' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-highlight/20 text-highlight flex items-center gap-1">
                    <Award size={12} /> Elder Endorsed
                  </span>
                )}
                {product.vendor.culturalCertificationTier === 'COMMUNITY_VERIFIED' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary flex items-center gap-1">
                    <ShieldCheck size={12} /> Community Verified
                  </span>
                )}
                {product.regionOfOrigin && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                    📍 {product.regionOfOrigin}
                  </span>
                )}
                {/* VENDOR_BACKLOG.md VND-008 */}
                {product.status === 'DRAFT' && product.showComingSoon && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center gap-1">
                    <Clock size={12} /> Coming Soon
                  </span>
                )}
                {product.isPreOrder && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1">
                    <Clock size={12} /> Pre-Order
                  </span>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="text-4xl font-bold text-highlight">
              {product.currency === 'NGN' ? '₦' : '$'}
              {effectivePrice.toLocaleString()}
            </div>

            {/* VENDOR_BACKLOG.md VND-007: variant selector */}
            {variants.length > 0 && (
              <div>
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                  {product.variantAttributeNames?.join(' / ') || 'Options'}
                </label>
                <select
                  value={selectedVariantId ?? ''}
                  onChange={(e) => setSelectedVariantId(e.target.value || null)}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground"
                >
                  <option value="">Choose an option...</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id} disabled={v.stock !== null && v.stock !== undefined && v.stock <= 0}>
                      {variantLabel(v)}
                      {v.stock !== null && v.stock !== undefined && v.stock <= 0 ? ' (out of stock)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Rating */}
            {product.reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={i < Math.round(averageRating) ? 'fill-highlight text-highlight' : 'text-muted-foreground'}
                    />
                  ))}
                </div>
                <span className="text-muted-foreground">
                  {averageRating.toFixed(1)} ({product.reviews.length} review{product.reviews.length !== 1 ? 's' : ''})
                </span>
              </div>
            )}

            {/* Stock Status */}
            {product.isMadeToOrder ? (
              <div className="text-sm text-primary">
                ✓ Made to Order{product.madeToOrderProcessingTime ? ` · ${product.madeToOrderProcessingTime}` : ''}
              </div>
            ) : (
              (effectiveStock !== undefined && effectiveStock !== null) && (
                <div className="text-sm">
                  {effectiveStock > 0 ? (
                    <span className="text-primary">✓ {effectiveStock} in stock</span>
                  ) : (
                    <span className="text-red-400">Out of stock</span>
                  )}
                </div>
              )
            )}

            {/* Quantity Selector */}
            {product.type === 'PHYSICAL' && (effectiveStock !== undefined && effectiveStock !== null) && effectiveStock > 0 && (
              <div className="flex items-center gap-4">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  Quantity
                </label>
                <div className="flex items-center gap-2 border border-border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-muted transition-colors disabled:opacity-50"
                    aria-label="Decrease quantity"
                    title="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="px-4 py-2 min-w-[60px] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity}
                    className="p-2 hover:bg-muted transition-colors disabled:opacity-50"
                    aria-label="Increase quantity"
                    title="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* VENDOR_BACKLOG.md VND-008 */}
            {product.isPreOrder && product.expectedDeliveryDate && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Clock size={14} /> Expected delivery {new Date(product.expectedDeliveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}

            {/* Add to Cart */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={
                  (effectiveStock !== undefined && effectiveStock !== null && effectiveStock === 0) ||
                  product.type !== 'PHYSICAL' ||
                  product.status !== 'ACTIVE' ||
                  addedToCart ||
                  (variants.length > 0 && !selectedVariantId)
                }
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addedToCart ? (
                  <>
                    <Check size={20} />
                    Added to Cart!
                  </>
                ) : product.status !== 'ACTIVE' ? (
                  <>
                    <Clock size={20} />
                    Coming Soon
                  </>
                ) : (
                  <>
                    <ShoppingCart size={20} />
                    {product.isPreOrder ? 'Pre-Order Now' : 'Add to Cart'}
                  </>
                )}
              </button>
            </div>

            {/* VENDOR_BACKLOG.md VND-025: wholesale pricing is only ever
                shown to BABALAWO/ADMIN accounts -- the public product
                response never includes the price itself, just this flag. */}
            {product.wholesaleEnabled && (user?.role === 'BABALAWO' || user?.role === 'ADMIN') && (
              <Link
                to={`/bulk-order/${product.id}`}
                className="block p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm font-bold text-amber-800 dark:text-amber-300 text-center hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors"
              >
                Wholesale pricing available — Order in bulk
              </Link>
            )}

            {/* SHOP_BACKLOG.md MSP-015: community endorsement */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => endorseMutation.mutate()}
                disabled={hasEndorsed || endorseMutation.isPending}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:cursor-not-allowed ${
                  hasEndorsed
                    ? 'bg-primary/10 text-primary'
                    : 'border border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {hasEndorsed ? (
                  <>
                    <Check size={16} /> Endorsed{product.endorsementCount ? ` (${product.endorsementCount})` : ''}
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Endorse as Authentic{product.endorsementCount ? ` (${product.endorsementCount})` : ''}
                  </>
                )}
              </button>
            )}

            {/* VENDOR_BACKLOG.md VND-021: shareable link + social post generator */}
            <SocialShareButton
              card={{
                productName: product.name,
                price: effectivePrice,
                currency: product.currency,
                vendorName: product.vendor.businessName,
                imageUrl: product.images?.[0],
              }}
              shareUrl={`${window.location.origin}/marketplace/${product.id}`}
            />

            {/* Product Details */}
            <div className="bg-muted/50 border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Description</h3>
                {/* VENDOR_BACKLOG.md VND-018: "shown as a second tab alongside English" */}
                {product.yorubaDescription && (
                  <div className="flex gap-1 bg-background border border-border rounded-lg p-0.5">
                    <button
                      onClick={() => setDescLang('en')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${descLang === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setDescLang('yo')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${descLang === 'yo' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                    >
                      Yorùbá
                    </button>
                  </div>
                )}
              </div>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {descLang === 'yo' && product.yorubaDescription
                  ? product.yorubaDescription
                  : product.longDescription || product.description}
              </p>

              {product.traditionalUseContext && (
                <div className="bg-highlight/10 border border-highlight/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-highlight uppercase tracking-widest mb-2">
                    Traditional Use
                  </h4>
                  <p className="text-foreground/80 whitespace-pre-wrap">{product.traditionalUseContext}</p>
                </div>
              )}

              {product.provenance && (
                <div>
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    Provenance
                  </h4>
                  <p className="text-muted-foreground">{product.provenance}</p>
                </div>
              )}

              {product.usageProtocol && (
                <div>
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    Usage Protocol
                  </h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{product.usageProtocol}</p>
                  {/* SHOP_BACKLOG.md MSP-007: "connection to relevant Academy courses" --
                      kept as one honest general link rather than fake per-item course
                      matching, since Academy is deliberately single-course for now
                      (see MSP-016's notes). */}
                  <Link to="/academy" className="text-highlight text-xs font-medium hover:underline mt-2 inline-block">
                    Learn the cultural context in the Academy →
                  </Link>
                </div>
              )}

              {product.relatedStories && product.relatedStories.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    Related Story
                  </h4>
                  <div className="space-y-3">
                    {product.relatedStories.map((story) => (
                      <div key={story.id} className="bg-card border border-border rounded-lg p-4">
                        <p className="font-semibold text-foreground text-sm">{story.title}</p>
                        {story.babalawoName && (
                          <p className="text-xs text-muted-foreground mt-0.5">As told by {story.babalawoName}</p>
                        )}
                        <p className="text-muted-foreground text-sm mt-2 whitespace-pre-wrap">{story.content}</p>
                        {story.sourceUrl && (
                          <a
                            href={story.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-highlight text-xs font-medium hover:underline mt-2 inline-block"
                          >
                            Listen / view source →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* COMMUNITY_BACKLOG.md FOR-024: community story submission */}
              <div>
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
                  Share a Story
                </h4>
                {storySubmitted ? (
                  <p className="text-primary text-sm flex items-center gap-2">
                    <Check size={16} /> Thank you — your story was submitted for elder review.
                  </p>
                ) : !isAuthenticated ? (
                  <p className="text-muted-foreground text-sm">Log in to share a story about this item.</p>
                ) : !showStoryForm ? (
                  <button
                    type="button"
                    onClick={() => setShowStoryForm(true)}
                    className="flex items-center gap-2 text-sm font-medium text-highlight hover:underline"
                  >
                    <BookOpen size={16} /> Share a story about this item
                  </button>
                ) : (
                  <form onSubmit={handleSubmitStory} className="space-y-3">
                    <input
                      type="text"
                      value={storyTitle}
                      onChange={(e) => setStoryTitle(e.target.value)}
                      placeholder="Story title"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                    />
                    <select
                      value={storyCategory}
                      onChange={(e) => setStoryCategory(e.target.value)}
                      aria-label="Story category"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                    >
                      {STORY_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <textarea
                      value={storyContent}
                      onChange={(e) => setStoryContent(e.target.value)}
                      placeholder="What does this item mean to you or your practice?"
                      required
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={submitStoryMutation.isPending}
                        className="px-4 py-2 bg-highlight text-foreground rounded-lg font-bold text-sm hover:bg-secondary transition-colors disabled:opacity-50"
                      >
                        {submitStoryMutation.isPending ? 'Submitting…' : 'Submit for Review'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowStoryForm(false)}
                        className="px-4 py-2 text-muted-foreground text-sm hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    {submitStoryMutation.isError && (
                      <p className="text-red-400 text-xs">Could not submit your story. Please try again.</p>
                    )}
                  </form>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
                  Product Type
                </h4>
                <p className="text-muted-foreground capitalize">{product.type.toLowerCase()}</p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
                  Category
                </h4>
                <p className="text-muted-foreground">
                  {(() => {
                    const cat = getCategoryBySlug(product.category);
                    const catLabel = cat ? `${cat.icon} ${cat.label}` : product.category;
                    const subLabel = product.subcategory ? ` › ${getSubcategoryLabel(product.category, product.subcategory)}` : '';
                    return catLabel + subLabel;
                  })()}
                </p>
              </div>

              {/* SHOP_BACKLOG.md MSP-015/MSP-003: flagging with gentle education */}
              {isAuthenticated && (
                <div className="pt-2 border-t border-border">
                  {flagSubmitted ? (
                    <p className="text-muted-foreground text-xs flex items-center gap-1.5">
                      <Check size={12} /> Thank you — an elder will review this listing.
                    </p>
                  ) : !showFlagForm ? (
                    <button
                      type="button"
                      onClick={() => setShowFlagForm(true)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Flag size={12} /> Flag this listing for cultural review
                    </button>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (flagReason.trim()) flagMutation.mutate();
                      }}
                      className="space-y-2"
                    >
                      <p className="text-xs text-muted-foreground">
                        If something about this listing concerns you culturally, let an elder know — this isn't a
                        punishment, just a gentle check.
                      </p>
                      <textarea
                        value={flagReason}
                        onChange={(e) => setFlagReason(e.target.value)}
                        placeholder="What concerns you about this listing?"
                        required
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={!flagReason.trim() || flagMutation.isPending}
                          className="px-3 py-1.5 bg-muted text-foreground rounded-lg font-bold text-xs hover:bg-border transition-colors disabled:opacity-50"
                        >
                          {flagMutation.isPending ? 'Submitting…' : 'Submit'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowFlagForm(false)}
                          className="px-3 py-1.5 text-muted-foreground text-xs hover:text-foreground transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SHOP_BACKLOG.md MSP-004: vendor collaboration surfacing */}
        {similarVendors.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex items-center gap-2 mb-4">
              <Users size={20} className="text-primary" />
              <h2 className="text-xl font-bold text-foreground">More vendors in {product.category}</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {similarVendors.map((v) => {
                const sample = v.products[0];
                return (
                  <Link
                    key={v.id}
                    to={sample ? `/marketplace/${sample.id}` : '#'}
                    className="flex-shrink-0 w-40 bg-card border border-border rounded-xl p-3 hover:border-highlight/50 transition-colors"
                  >
                    <p className="font-semibold text-foreground text-xs truncate">{v.businessName}</p>
                    {sample && (
                      <>
                        <p className="text-xs text-muted-foreground truncate mt-1">{sample.name}</p>
                        <p className="text-highlight font-bold text-sm mt-1">
                          {sample.currency} {sample.price.toLocaleString()}
                        </p>
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        {product.reviews.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6">Reviews ({product.reviews.length})</h2>
            <div className="space-y-6">
              {product.reviews.map((review) => (
                <div key={review.id} className="bg-muted/50 border border-border rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-highlight/20 flex items-center justify-center text-highlight font-bold flex-shrink-0">
                      {(review.customer.yorubaName || review.customer.name)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold">{review.customer.yorubaName || review.customer.name}</span>
                        {review.customer.verified && (
                          <span className="text-xs bg-highlight/20 text-highlight px-2 py-1 rounded">
                            Verified
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={i < review.rating ? 'fill-highlight text-highlight' : 'text-muted-foreground'}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                      {review.title && <h4 className="font-bold">{review.title}</h4>}
                      {review.content && <p className="text-muted-foreground whitespace-pre-wrap">{review.content}</p>}
                      {/* VENDOR_BACKLOG.md VND-022: "response shown below the review in the marketplace" */}
                      {review.vendorResponse && (
                        <div className="mt-2 pl-4 border-l-2 border-highlight/40">
                          <p className="text-xs font-bold text-highlight uppercase tracking-widest mb-1">
                            Vendor Response
                          </p>
                          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{review.vendorResponse}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailView;
