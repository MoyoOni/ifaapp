import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ShoppingCart, Package, Store, Star } from 'lucide-react';
import api from '@/lib/api';
import { useCart } from '@/shared/contexts/cart-context';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { DEMO_PRODUCTS, DEMO_USERS } from '@/demo';
import { UserRole } from '@common';

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
  type: string;
  description: string;
  price: number;
  currency: string;
  stock?: number;
  images: string[];
  provenance?: string;
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
 * NOTE: Cultural goods - artifacts, books, spiritual services
 */
const MarketplaceView: React.FC<MarketplaceViewProps> = ({ onSelectProduct }) => {
  const { totalItems } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['marketplace-products', selectedCategory, searchQuery],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== 'all') {
          params.append('category', selectedCategory);
        }
        const response = await api.get(`/marketplace/products?${params.toString()}`);
        return response.data || [];
      } catch (e) {
        if (!isDemoMode) throw e;
        logger.error('Failed to fetch products, using demo data', e);
        return Object.values(DEMO_PRODUCTS).map((product) => {
          const vendorUser = DEMO_USERS[product.vendorId as keyof typeof DEMO_USERS];
          const mappedCategory = product.category?.toLowerCase().includes('tool') ? 'artifacts' : 'services';

          return {
            id: product.id,
            vendorId: product.vendorId,
            name: product.name,
            category: mappedCategory,
            type: 'PHYSICAL',
            description: product.description || 'Authentic spiritual item.',
            price: product.price,
            currency: product.currency,
            stock: product.stock,
            images: product.images || [],
            provenance: 'Osun State, Nigeria',
            verifiedTier: 'COUNCIL_APPROVED',
            status: product.status,
            vendor: {
              id: product.vendorId,
              businessName: vendorUser?.name || 'Sacred Vendor',
              user: {
                name: vendorUser?.name || 'Sacred Vendor',
                yorubaName: vendorUser?.yorubaName,
                verified: (vendorUser as any)?.verified ?? true,
              },
            },
            _count: {
              orders: 12,
              reviews: 4,
            },
          } as Product;
        }).filter((product) => {
          if (selectedCategory === 'all') return true;
          return product.category === selectedCategory;
        });
      }
    },
  });

  // Fetch vendors
  const { data: _vendors = [] } = useQuery<Vendor[]>({
    queryKey: ['marketplace-vendors'],
    queryFn: async () => {
      try {
        const response = await api.get('/marketplace/vendors?status=APPROVED');
        return response.data || [];
      } catch (e) {
        if (!isDemoMode) throw e;
        logger.error('Failed to fetch vendors, using demo data', e);
        return Object.values(DEMO_USERS)
          .filter((user) => user.role === UserRole.VENDOR)
          .map((user) => ({
            id: user.id,
            userId: user.id,
            businessName: user.name,
            status: 'APPROVED',
            user: {
              id: user.id,
              name: user.name,
              yorubaName: user.yorubaName,
              verified: (user as any).verified ?? true,
            },
          }));
      }
    },
  });

  const getCategoryBgColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'artifacts':
        return 'bg-amber-100 border-amber-200 text-amber-800';
      case 'tools':
        return 'bg-emerald-100 border-emerald-200 text-emerald-800';
      case 'texts':
        return 'bg-blue-100 border-blue-200 text-blue-800';
      case 'services':
        return 'bg-purple-100 border-purple-200 text-purple-800';
      case 'herbs':
        return 'bg-green-100 border-green-200 text-green-800';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  // Available categories for filtering
  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'artifacts', name: 'Sacred Artifacts' },
    { id: 'tools', name: 'Divination Tools' },
    { id: 'texts', name: 'Sacred Texts' },
    { id: 'services', name: 'Spiritual Services' },
    { id: 'herbs', name: 'Sacred Herbs' },
  ];

  // Filter products based on search query
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  if (productsLoading) {
    return (
      <div className="py-12 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
      <div className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold brand-font text-emerald-900 mb-3">Oja Ìlú Àṣẹ</h1>
        <p className="text-xl text-emerald-700 max-w-3xl mx-auto">
          Sacred Marketplace. Curated spiritual artifacts, verified botanical ingredients, and sacred texts for your journey. Accepted by the Council of Elders.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg mb-10">
        <div className="max-w-3xl mx-auto">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-200" size={20} />
            <input
              type="text"
              placeholder="Search sacred items, herbs, tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/20 text-white placeholder-emerald-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            />
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-white text-emerald-700'
                    : 'bg-white/30 text-white hover:bg-white/40'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-lg text-emerald-700 font-medium">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'} found
        </p>
        <button
          onClick={() => onSelectProduct?.('cart')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-xl font-bold hover:bg-emerald-200 transition-colors"
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
              className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
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
                  <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                    <Package size={48} className="text-emerald-300" />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${getCategoryBgColor(product.category)}`}>
                    {product.category}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-emerald-900 group-hover:text-emerald-700 transition-colors truncate">
                    {product.name}
                  </h3>
                  <span className="font-bold text-emerald-700 whitespace-nowrap ml-2">
                    {product.currency} {product.price.toLocaleString()}
                  </span>
                </div>

                <p className="text-emerald-600 text-sm mb-4 line-clamp-2 h-12 overflow-hidden">
                  {product.description}
                </p>

                {/* Vendor Info */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-emerald-100">
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <Store size={14} className="text-emerald-700" />
                  </div>
                  <div className="text-xs text-emerald-600 truncate">
                    {product.vendor.businessName}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-between text-xs text-emerald-600">
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-amber-500 fill-current" />
                    <span>{(product._count.reviews || 0) > 0 ? (product._count.reviews / 2).toFixed(1) : 'New'}</span>
                  </div>
                  <div>Sold: {product._count.orders}</div>
                  <div>In Stock: {product.stock || '∞'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-emerald-50 rounded-2xl border border-emerald-100">
          <Package size={64} className="mx-auto text-emerald-300 mb-4" />
          <h3 className="text-2xl font-bold text-emerald-800 mb-2">No Items Found</h3>
          <p className="text-emerald-600 max-w-md mx-auto mb-6">
            We couldn't find any items matching your search. Try adjusting your filters or search term.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default MarketplaceView;
