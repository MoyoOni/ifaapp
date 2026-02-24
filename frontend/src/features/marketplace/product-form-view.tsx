import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, X, Loader2, Save, Info } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { ProductStatus, ProductType } from '@ile-ase/common';
import { DEMO_PRODUCTS, DEMO_USERS } from '@/demo';

interface Vendor {
  id: string;
  userId: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  type: ProductType;
  status: ProductStatus;
  stock?: number;
  images: string[];
  vendorId: string;
}

interface ProductFormViewProps {
  productId?: string; // If provided, edit mode; otherwise, create mode
  onSave?: () => void;
  onCancel?: () => void;
}

/**
 * Product Form View Component
 * Create or edit products for vendors
 * NOTE: Preserves cultural integrity - products must be culturally authentic
 */
const ProductFormView: React.FC<ProductFormViewProps> = ({ productId, onSave, onCancel }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEditMode = !!productId;

  // Fetch vendor profile
  const { data: vendor } = useQuery<Vendor>({
    queryKey: ['vendor-profile', user?.id],
    queryFn: async () => {
      try {
        const response = await api.get('/marketplace/vendors/me');
        return response.data;
      } catch (error) {
        if (!isDemoMode) throw error;

        logger.warn('Failed to fetch vendor profile, using demo data');
        const demoVendor = DEMO_USERS['demo-vendor-1'];
        return demoVendor
          ? {
              id: demoVendor.vendorId || demoVendor.id,
              userId: demoVendor.id,
            }
          : undefined;
      }
    },
    enabled: !!user,
  });

  // Fetch product if editing
  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: ['marketplace-product', productId],
    queryFn: async () => {
      try {
        const response = await api.get(`/marketplace/products/${productId}`);
        return response.data;
      } catch (error) {
        if (!isDemoMode) throw error;

        logger.warn('Failed to fetch product, using demo data');
        const demoProduct = DEMO_PRODUCTS[productId as keyof typeof DEMO_PRODUCTS];
        if (!demoProduct) {
          throw error;
        }
        return {
          id: demoProduct.id,
          name: demoProduct.name,
          description: demoProduct.description,
          price: demoProduct.price,
          currency: demoProduct.currency,
          category: demoProduct.category,
          type: ProductType.PHYSICAL,
          status: ProductStatus.ACTIVE,
          stock: demoProduct.stock,
          images: demoProduct.images,
          vendorId: demoProduct.vendorId,
        };
      }
    },
    enabled: isEditMode && !!productId,
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    currency: 'NGN',
    category: '',
    type: ProductType.PHYSICAL,
    status: ProductStatus.DRAFT,
    stock: undefined as number | undefined,
    images: [] as string[],
  });

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // Validate form fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Product name must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than zero';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Populate form when editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        currency: product.currency,
        category: product.category,
        type: product.type,
        status: product.status,
        stock: product.stock || undefined,
        images: product.images || [],
      });
      setImageUrls(product.images || []);
    }
  }, [product]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/marketplace/products', {
        ...data,
        images: imageUrls,
        vendorId: vendor?.id,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products', vendor?.id] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
      if (onSave) onSave();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.patch(`/marketplace/products/${productId}`, {
        ...data,
        images: imageUrls,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-product', productId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-products', vendor?.id] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
      if (onSave) onSave();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      images: imageUrls,
    };

    if (isEditMode) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleImageAdd = (url: string) => {
    if (url.trim() && !imageUrls.includes(url.trim())) {
      setImageUrls([...imageUrls, url.trim()]);
    }
  };

  const handleImageRemove = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  if (productLoading) {
    return (
      <div className="min-h-screen bg-background text-white p-4 sm:p-6 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background text-white p-4 sm:p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-muted mb-4">You need to be a verified vendor to create products.</p>
          {onCancel && (
            <button onClick={onCancel} className="px-6 py-3 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors">
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4">
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-highlight hover:opacity-80 transition-opacity"
              aria-label="Go back"
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
          )}
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold brand-font text-white">
              {isEditMode ? 'Edit Product' : 'Create New Product'}
            </h1>
            <p className="text-muted text-sm sm:text-base">
              {isEditMode ? 'Update your product information' : 'Add a new product to your marketplace'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Product Name */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label htmlFor="productName" className="block text-sm font-bold text-muted uppercase tracking-widest">
                  Product Name *
                </label>
                <div 
                  className="relative"
                  onMouseEnter={() => setShowTooltip('name')}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <Info size={14} className="text-muted cursor-help" aria-label="Information about product name" />
                  {showTooltip === 'name' && (
                    <div className="absolute z-10 left-0 ml-6 bg-background border border-white/20 rounded-lg p-2 text-xs text-muted w-48">
                      Enter a descriptive name for your product
                    </div>
                  )}
                </div>
              </div>
              <input
                id="productName"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Traditional Ifa Beads"
                className={`w-full bg-white/5 border ${errors.name ? 'border-red-500' : 'border border-white/10'} rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight`}
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label htmlFor="productDescription" className="block text-sm font-bold text-muted uppercase tracking-widest">
                  Description *
                </label>
                <div 
                  className="relative"
                  onMouseEnter={() => setShowTooltip('description')}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <Info size={14} className="text-muted cursor-help" aria-label="Information about product description" />
                  {showTooltip === 'description' && (
                    <div className="absolute z-10 left-0 ml-6 bg-background border border-white/20 rounded-lg p-2 text-xs text-muted w-48">
                      Describe your product, its cultural significance, materials, and usage
                    </div>
                  )}
                </div>
              </div>
              <textarea
                id="productDescription"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your product, its cultural significance, materials, and usage..."
                rows={6}
                className={`w-full bg-white/5 border ${errors.description ? 'border-red-500' : 'border border-white/10'} rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight resize-none`}
              />
              {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Price & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label htmlFor="productPrice" className="block text-sm font-bold text-muted uppercase tracking-widest">
                    Price *
                  </label>
                  <div 
                    className="relative"
                    onMouseEnter={() => setShowTooltip('price')}
                    onMouseLeave={() => setShowTooltip(null)}
                  >
                    <Info size={14} className="text-muted cursor-help" aria-label="Information about product price" />
                    {showTooltip === 'price' && (
                      <div className="absolute z-10 left-0 ml-6 bg-background border border-white/20 rounded-lg p-2 text-xs text-muted w-48">
                        Set a positive price for your product
                      </div>
                    )}
                  </div>
                </div>
                <input
                  id="productPrice"
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className={`w-full bg-white/5 border ${errors.price ? 'border-red-500' : 'border border-white/10'} rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight`}
                />
                {errors.price && <p className="text-red-400 text-sm mt-1">{errors.price}</p>}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label htmlFor="productCurrency" className="block text-sm font-bold text-muted uppercase tracking-widest">
                    Currency *
                  </label>
                  <div 
                    className="relative"
                    onMouseEnter={() => setShowTooltip('currency')}
                    onMouseLeave={() => setShowTooltip(null)}
                  >
                    <Info size={14} className="text-muted cursor-help" aria-label="Information about product currency" />
                    {showTooltip === 'currency' && (
                      <div className="absolute z-10 left-0 ml-6 bg-background border border-white/20 rounded-lg p-2 text-xs text-muted w-48">
                        Select the currency for your product
                      </div>
                    )}
                  </div>
                </div>
                <select
                  id="productCurrency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
                  aria-label="Select currency"
                >
                  <option value="NGN">NGN (₦)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

            {/* Category & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label htmlFor="productCategory" className="block text-sm font-bold text-muted uppercase tracking-widest">
                    Category *
                  </label>
                  <div 
                    className="relative"
                    onMouseEnter={() => setShowTooltip('category')}
                    onMouseLeave={() => setShowTooltip(null)}
                  >
                    <Info size={14} className="text-muted cursor-help" aria-label="Information about product category" />
                    {showTooltip === 'category' && (
                      <div className="absolute z-10 left-0 ml-6 bg-background border border-white/20 rounded-lg p-2 text-xs text-muted w-48">
                        Enter the category for your product
                      </div>
                    )}
                  </div>
                </div>
                <input
                  id="productCategory"
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Jewelry, Books, Herbs"
                  className={`w-full bg-white/5 border ${errors.category ? 'border-red-500' : 'border border-white/10'} rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight`}
                />
                {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category}</p>}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label htmlFor="productType" className="block text-sm font-bold text-muted uppercase tracking-widest">
                    Product Type *
                  </label>
                  <div 
                    className="relative"
                    onMouseEnter={() => setShowTooltip('type')}
                    onMouseLeave={() => setShowTooltip(null)}
                  >
                    <Info size={14} className="text-muted cursor-help" aria-label="Information about product type" />
                    {showTooltip === 'type' && (
                      <div className="absolute z-10 left-0 ml-6 bg-background border border-white/20 rounded-lg p-2 text-xs text-muted w-48">
                        Choose the type of product you're selling
                      </div>
                    )}
                  </div>
                </div>
                <select
                  id="productType"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ProductType })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
                  aria-label="Select product type"
                >
                  <option value={ProductType.PHYSICAL}>Physical Product</option>
                  <option value={ProductType.DIGITAL}>Digital Product</option>
                  <option value={ProductType.SERVICE}>Service</option>
                </select>
              </div>
            </div>

            {/* Stock (only for physical products) */}
            {formData.type === ProductType.PHYSICAL && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label htmlFor="productStock" className="block text-sm font-bold text-muted uppercase tracking-widest">
                    Stock Quantity (Optional)
                  </label>
                  <div 
                    className="relative"
                    onMouseEnter={() => setShowTooltip('stock')}
                    onMouseLeave={() => setShowTooltip(null)}
                  >
                    <Info size={14} className="text-muted cursor-help" aria-label="Information about product stock" />
                    {showTooltip === 'stock' && (
                      <div className="absolute z-10 left-0 ml-6 bg-background border border-white/20 rounded-lg p-2 text-xs text-muted w-48">
                        Set the quantity available for this product
                      </div>
                    )}
                  </div>
                </div>
                <input
                  id="productStock"
                  type="number"
                  min="0"
                  value={formData.stock ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stock: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    })
                  }
                  placeholder="Leave empty for unlimited stock"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight"
                />
              </div>
            )}

            {/* Status */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label htmlFor="productStatus" className="block text-sm font-bold text-muted uppercase tracking-widest">
                  Status *
                </label>
                <div 
                  className="relative"
                  onMouseEnter={() => setShowTooltip('status')}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <Info size={14} className="text-muted cursor-help" aria-label="Information about product status" />
                  {showTooltip === 'status' && (
                    <div className="absolute z-10 left-0 ml-6 bg-background border border-white/20 rounded-lg p-2 text-xs text-muted w-48">
                        Set the availability status of your product
                      </div>
                    )}
                  </div>
                </div>
                <select
                  id="productStatus"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
                  aria-label="Select product status"
                >
                  <option value={ProductStatus.DRAFT}>Draft</option>
                  <option value={ProductStatus.ACTIVE}>Active</option>
                  <option value={ProductStatus.OUT_OF_STOCK}>Out of Stock</option>
                  <option value={ProductStatus.ARCHIVED}>Archived</option>
                </select>
                <p className="text-xs text-muted mt-1">
                  Draft: Not published | Active: Live and available | Out of Stock: Published but no inventory | Archived: Hidden from marketplace
                </p>
              </div>
            </div>

            {/* Images */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label htmlFor="imageInput" className="block text-sm font-bold text-muted uppercase tracking-widest">
                  Product Images
                </label>
                <div 
                  className="relative"
                  onMouseEnter={() => setShowTooltip('images')}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <Info size={14} className="text-muted cursor-help" aria-label="Information about product images" />
                  {showTooltip === 'images' && (
                    <div className="absolute z-10 left-0 ml-6 bg-background border border-white/20 rounded-lg p-2 text-xs text-muted w-48">
                      Add image URLs for your product (first image will be the main image)
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                {/* Image URL Input */}
                <div className="flex gap-2">
                  <input
                    id="imageInput"
                    type="url"
                    placeholder="Add image URL"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.currentTarget as HTMLInputElement;
                        handleImageAdd(input.value);
                        input.value = '';
                      }
                    }}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight"
                    aria-label="Enter image URL"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                      if (input) {
                        handleImageAdd(input.value);
                        input.value = '';
                      }
                    }}
                    className="px-4 py-3 bg-highlight/20 text-highlight rounded-xl hover:bg-highlight/30 transition-colors"
                    aria-label="Add image"
                  >
                    <Upload size={20} aria-hidden="true" />
                  </button>
                </div>

                {/* Image Preview Grid */}
                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Product ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-white/10"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleImageRemove(index)}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={`Remove image ${index + 1}`}
                        >
                          <X size={14} className="text-white" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted mt-1">
                Add product images by entering image URLs. First image will be used as the main product image.
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-6 py-3 border border-white/20 text-white rounded-xl font-bold hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <>
                  <Loader2 size={20} className="animate-spin" aria-hidden="true" />
                  <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  <Save size={20} aria-hidden="true" />
                  <span>{isEditMode ? 'Update Product' : 'Create Product'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormView;