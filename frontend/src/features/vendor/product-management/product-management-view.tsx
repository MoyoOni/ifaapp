import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Package,
  Plus,
  Search,
  Filter,
  ChevronDown,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Star,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import api from '@/lib/api';
import { isDemoMode } from '@/shared/config/demo-mode';
import { logger } from '@/shared/utils/logger';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  salesCount: number;
  revenue: number;
  rating?: number;
  reviewCount?: number;
}

const ProductManagementView: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch vendor products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['vendor-products', user?.id, searchQuery, statusFilter, categoryFilter],
    queryFn: async () => {
      try {
        const response = await api.get(`/vendors/${user?.id}/products`, {
          params: {
            search: searchQuery || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            category: categoryFilter !== 'all' ? categoryFilter : undefined,
          },
        });
        return response.data || [];
      } catch (error) {
        if (!isDemoMode) throw error;
        
        logger.warn('Using demo data for product management');
        
        // Generate demo products
        const categories = ['Ritual Items', 'Herbal Remedies', 'Sacred Tools', 'Clothing', 'Artifacts'];
        const demoProducts: Product[] = Array.from({ length: 12 }, (_, index) => ({
          id: `prod-${index + 1}`,
          name: `${categories[index % categories.length]} ${index + 1}`,
          description: `Authentic spiritual ${categories[index % categories.length].toLowerCase()} crafted with traditional methods`,
          price: Math.floor(Math.random() * 50000) + 5000,
          category: categories[index % categories.length],
          stock: Math.floor(Math.random() * 100) + 10,
          images: [`https://picsum.photos/300/300?random=${index}`],
          status: ['active', 'active', 'draft', 'archived'][index % 4] as any,
          createdAt: new Date(Date.now() - Math.random() * 31536000000).toISOString(),
          updatedAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          salesCount: Math.floor(Math.random() * 50),
          revenue: Math.floor(Math.random() * 200000),
          rating: Math.floor(Math.random() * 2) + 4,
          reviewCount: Math.floor(Math.random() * 30) + 5
        }));

        return demoProducts;
      }
    },
  });

  // Filter products
  const filteredProducts = products.filter(product => {
    // Search filter
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      if (!product.name.toLowerCase().includes(term) && 
          !product.description.toLowerCase().includes(term) &&
          !product.category.toLowerCase().includes(term)) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'all' && product.status !== statusFilter) {
      return false;
    }

    // Category filter
    if (categoryFilter !== 'all' && product.category !== categoryFilter) {
      return false;
    }

    return true;
  });

  // Calculate statistics
  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.status === 'active').length,
    draftProducts: products.filter(p => p.status === 'draft').length,
    totalRevenue: products.reduce((sum, product) => sum + product.revenue, 0),
    totalSales: products.reduce((sum, product) => sum + product.salesCount, 0)
  };

  // Mutations
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      await api.delete(`/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl p-8 text-white shadow-xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Product Workshop</h1>
            <p className="text-amber-100 text-lg">
              Create and manage your authentic spiritual products
            </p>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Total Products</p>
                <h3 className="text-3xl font-bold text-stone-900 mt-1">{stats.totalProducts}</h3>
              </div>
              <div className="bg-amber-100 p-3 rounded-xl text-amber-700">
                <Package size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Active</p>
                <h3 className="text-3xl font-bold text-stone-900 mt-1">{stats.activeProducts}</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-xl text-green-700">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Draft</p>
                <h3 className="text-3xl font-bold text-stone-900 mt-1">{stats.draftProducts}</h3>
              </div>
              <div className="bg-yellow-100 p-3 rounded-xl text-yellow-700">
                <Edit size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm font-bold uppercase tracking-wider">Total Revenue</p>
                <h3 className="text-3xl font-bold text-stone-900 mt-1">
                  ₦{stats.totalRevenue.toLocaleString()}
                </h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl text-purple-700">
                <DollarSign size={24} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 mb-8 border border-stone-200 shadow-sm"
        >
          {/* Search Bar and Add Button */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-stone-400" size={20} />
              <input
                type="text"
                placeholder="Search products by name, description, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <button className="px-6 py-3 bg-amber-600 text-white font-bold rounded-xl shadow-lg hover:bg-amber-700 transition-colors flex items-center gap-2 whitespace-nowrap">
              <Plus size={20} />
              Add New Product
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-amber-600 font-medium hover:text-amber-700 transition-colors"
          >
            <Filter size={18} />
            Filter Products
            <ChevronDown 
              size={16} 
              className={cn("transition-transform", showFilters && "rotate-180")} 
            />
          </button>

          {/* Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-stone-200"
            >
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="Ritual Items">Ritual Items</option>
                  <option value="Herbal Remedies">Herbal Remedies</option>
                  <option value="Sacred Tools">Sacred Tools</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Artifacts">Artifacts</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setCategoryFilter('all');
                  }}
                  className="w-full py-2 px-4 bg-stone-100 text-stone-700 font-medium rounded-lg hover:bg-stone-200 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-stone-600">
            Showing <span className="font-bold text-stone-900">{filteredProducts.length}</span> products
            {searchQuery && (
              <span> matching "<span className="text-amber-600">{searchQuery}</span>"</span>
            )}
          </p>
        </div>

        {/* Products Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          layout
        >
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-lg transition-all group"
            >
              {/* Product Image */}
              <div className="relative h-48 bg-stone-100">
                {product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={48} className="text-stone-400" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className={cn("inline-block px-2 py-1 text-xs font-medium rounded-full", getStatusColor(product.status))}>
                    {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6">
                <h3 className="font-bold text-lg text-stone-900 mb-2 line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-stone-600 text-sm mb-4 line-clamp-2">
                  {product.description}
                </p>

                {/* Price and Category */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-amber-600">
                      ₦{product.price.toLocaleString()}
                    </span>
                  </div>
                  <span className="px-2 py-1 bg-stone-100 text-stone-700 text-xs font-medium rounded-full">
                    {product.category}
                  </span>
                </div>

                {/* Stock and Sales */}
                <div className="flex items-center justify-between mb-4 text-sm text-stone-600">
                  <div className="flex items-center gap-1">
                    <Package size={16} />
                    <span>{product.stock} in stock</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShoppingCart size={16} />
                    <span>{product.salesCount} sold</span>
                  </div>
                </div>

                {/* Rating */}
                {product.rating && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-amber-500 fill-current" />
                      <span className="font-medium text-stone-900">{product.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-stone-500">({product.reviewCount} reviews)</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 py-2 px-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2">
                    <Edit size={16} />
                    Edit
                  </button>
                  <button className="p-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors">
                    <Eye size={18} />
                  </button>
                  <button 
                    onClick={() => deleteProductMutation.mutate(product.id)}
                    className="p-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-2xl border border-stone-200"
          >
            <Package size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-xl font-bold text-stone-900 mb-2">No Products Found</h3>
            <p className="text-stone-600 mb-6">
              Create your first authentic spiritual product
            </p>
            <button className="px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2 mx-auto">
              <Plus size={20} />
              Add New Product
            </button>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-white rounded-2xl p-6 border border-stone-200"
        >
          <h3 className="text-xl font-bold text-stone-900 mb-6">Workshop Tools</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors">
              <div className="p-3 bg-amber-200 rounded-lg">
                <Upload size={20} className="text-amber-700" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-stone-900">Bulk Upload</h4>
                <p className="text-sm text-stone-600">Import multiple products</p>
              </div>
            </button>
            
            <button className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
              <div className="p-3 bg-purple-200 rounded-lg">
                <TrendingUp size={20} className="text-purple-700" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-stone-900">Performance Analytics</h4>
                <p className="text-sm text-stone-600">Track product success</p>
              </div>
            </button>
            
            <button className="flex items-center gap-4 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
              <div className="p-3 bg-green-200 rounded-lg">
                <ImageIcon size={20} className="text-green-700" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-stone-900">Image Gallery</h4>
                <p className="text-sm text-stone-600">Manage product photos</p>
              </div>
            </button>
            
            <button className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
              <div className="p-3 bg-blue-200 rounded-lg">
                <Star size={20} className="text-blue-700" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-stone-900">Quality Control</h4>
                <p className="text-sm text-stone-600">Review product standards</p>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductManagementView;