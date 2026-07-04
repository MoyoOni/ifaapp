import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ShoppingCart, Package, Store, Star, Lock } from 'lucide-react';
import { FeatureHeader } from '@/shared/components/feature-header';
import api from '@/lib/api';
import { useCart } from '@/shared/contexts/cart-context';
import { MARKETPLACE_CATEGORIES, getCategoryBySlug } from './marketplace-categories';
import { isDevModeActive } from '@/shared/utils/dev-mode';

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
  vendor: {
    id: string;
    businessName: string;
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

interface MarketplaceViewProps {
  onSelectProduct?: (productId: string) => void;
}

/**
 * Marketplace View Component
 * Vendor directory, product listings, and shopping
 * 8 cultural categories with subcategory filtering
 */
const MarketplaceView: React.FC<MarketplaceViewProps> = ({ onSelectProduct }) => {
  const { totalItems } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

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
    queryKey: ['marketplace-products', selectedCategory, selectedSubcategory, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedSubcategory !== 'all') params.append('subcategory', selectedSubcategory);
      if (debouncedSearch.length >= 3) params.append('search', debouncedSearch);
      const response = await api.get(`/marketplace/products?${params.toString()}`);
      return response.data || [];
    },
    enabled: !isDevModeActive(),
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

      {/* Results Count + Cart */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-muted-foreground font-medium">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'} found
          {activeCategory && <span className="ml-1">in <strong>{activeCategory.label}</strong></span>}
        </p>
        <button
          type="button"
          onClick={() => onSelectProduct?.('cart')}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl font-bold hover:bg-primary/20 transition-colors"
        >
          <ShoppingCart size={18} />
          Cart ({totalItems})
        </button>
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
                </div>
              </div>

              {/* Product Info */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1">
                    {product.name}
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
