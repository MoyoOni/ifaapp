import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, X, ImagePlus, Lock } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';
import { MARKETPLACE_CATEGORIES, getCategoryBySlug } from './marketplace-categories';

interface ProductFormData {
  name: string;
  category: string;
  subcategory: string;
  description: string;
  longDescription: string;
  price: string;
  currency: string;
  stock: string;
  provenance: string;
  usageProtocol: string;
  requiresInitiation: boolean;
  images: string[];
}

interface InitialProductData {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  description: string;
  longDescription?: string;
  price: number;
  currency: string;
  stock?: number;
  provenance?: string;
  usageProtocol?: string;
  requiresInitiation?: boolean;
  images?: string[];
}

interface VendorProductFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: InitialProductData;
}

const INITIAL_FORM: ProductFormData = {
  name: '',
  category: '',
  subcategory: '',
  description: '',
  longDescription: '',
  price: '',
  currency: 'NGN',
  stock: '',
  provenance: '',
  usageProtocol: '',
  requiresInitiation: false,
  images: [],
};

const VendorProductForm: React.FC<VendorProductFormProps> = ({ onClose, onSuccess, initialData }) => {
  const isEditMode = !!initialData;
  const [form, setForm] = useState<ProductFormData>(
    initialData
      ? {
          name: initialData.name,
          category: initialData.category,
          subcategory: initialData.subcategory ?? '',
          description: initialData.description,
          longDescription: initialData.longDescription ?? '',
          price: String(initialData.price),
          currency: initialData.currency,
          stock: initialData.stock != null ? String(initialData.stock) : '',
          provenance: initialData.provenance ?? '',
          usageProtocol: initialData.usageProtocol ?? '',
          requiresInitiation: initialData.requiresInitiation ?? false,
          images: initialData.images ?? [],
        }
      : INITIAL_FORM,
  );
  const [imageUrl, setImageUrl] = useState('');
  const queryClient = useQueryClient();
  const toast = useToast();

  const activeCategory = getCategoryBySlug(form.category);
  const activeSubcategory = activeCategory?.subcategories.find(s => s.slug === form.subcategory);

  const handleCategoryChange = (slug: string) => {
    setForm(f => ({ ...f, category: slug, subcategory: '' }));
  };

  const addImage = () => {
    if (imageUrl.trim() && !form.images.includes(imageUrl.trim())) {
      setForm(f => ({ ...f, images: [...f.images, imageUrl.trim()] }));
      setImageUrl('');
    }
  };

  const removeImage = (url: string) => {
    setForm(f => ({ ...f, images: f.images.filter(i => i !== url) }));
  };

  const buildPayload = (data: ProductFormData): Record<string, unknown> => {
    const payload: Record<string, unknown> = {
      name: data.name,
      category: data.category,
      description: data.description,
      price: parseFloat(data.price),
      currency: data.currency,
      images: data.images.length > 0 ? data.images : ['https://placehold.co/400x400/png'],
      requiresInitiation: data.requiresInitiation,
    };
    if (data.subcategory) payload.subcategory = data.subcategory;
    if (data.longDescription) payload.longDescription = data.longDescription;
    if (data.stock) payload.stock = parseInt(data.stock, 10);
    if (data.provenance) payload.provenance = data.provenance;
    if (data.usageProtocol) payload.usageProtocol = data.usageProtocol;
    return payload;
  };

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await api.post('/marketplace/products', buildPayload(data));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
      toast.success('Product listed successfully');
      onSuccess?.();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create product');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await api.patch(`/marketplace/products/${initialData!.id}`, buildPayload(data));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
      toast.success('Product updated successfully');
      onSuccess?.();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update product');
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) { toast.error('Please select a category'); return; }
    if (isEditMode) {
      updateMutation.mutate(form);
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h2 className="text-xl font-bold text-foreground">{isEditMode ? 'Edit Product' : 'Add New Product'}</h2>
            <p className="text-sm text-muted-foreground">{isEditMode ? 'Update your listing in the Oja Ìlú Àṣẹ marketplace' : 'List your item in the Oja Ìlú Àṣẹ marketplace'}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground uppercase tracking-wide">Product Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Handcrafted Opon Ifá Divination Tray"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground uppercase tracking-wide">Category *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MARKETPLACE_CATEGORIES.map(cat => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => handleCategoryChange(cat.slug)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    form.category === cat.slug
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-background hover:border-primary/40 hover:bg-muted/50'
                  }`}
                >
                  <div className="text-xl mb-1">{cat.icon}</div>
                  <div className="text-xs font-bold text-foreground leading-tight">{cat.label}</div>
                  {cat.requiresVerification && (
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">Verified vendor</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Subcategory (shown when category selected) */}
          {activeCategory && (
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-foreground uppercase tracking-wide">Subcategory</label>
              <select
                value={form.subcategory}
                onChange={e => setForm(f => ({ ...f, subcategory: e.target.value }))}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              >
                <option value="">Select subcategory (optional)</option>
                {activeCategory.subcategories.map(sub => (
                  <option key={sub.slug} value={sub.slug}>{sub.label}</option>
                ))}
              </select>
              {activeSubcategory?.culturalNote && (
                <p className="text-xs text-muted-foreground pl-1">{activeSubcategory.culturalNote}</p>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground uppercase tracking-wide">Description *</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Briefly describe this item and its spiritual significance"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
            />
          </div>

          {/* Price + Currency + Stock */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-bold text-foreground uppercase tracking-wide">Price *</label>
              <div className="flex gap-2">
                <select
                  value={form.currency}
                  onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                  className="px-3 py-3 bg-background border border-border rounded-xl text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="NGN">₦ NGN</option>
                  <option value="USD">$ USD</option>
                  <option value="GBP">£ GBP</option>
                </select>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="0.00"
                  className="flex-1 px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-foreground uppercase tracking-wide">Stock</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                placeholder="∞"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Provenance */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground uppercase tracking-wide">
              Provenance <span className="text-muted-foreground font-normal normal-case">(Optional)</span>
            </label>
            <input
              type="text"
              value={form.provenance}
              onChange={e => setForm(f => ({ ...f, provenance: e.target.value }))}
              placeholder="e.g. Handcrafted in Ile-Ife, Nigeria by initiated woodcarver"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          {/* Usage Protocol */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground uppercase tracking-wide">
              Usage Protocol <span className="text-muted-foreground font-normal normal-case">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={form.usageProtocol}
              onChange={e => setForm(f => ({ ...f, usageProtocol: e.target.value }))}
              placeholder="Cultural instructions or context for how this item is traditionally used"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
            />
          </div>

          {/* Requires Initiation */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={form.requiresInitiation}
              onChange={e => setForm(f => ({ ...f, requiresInitiation: e.target.checked }))}
              className="w-4 h-4 rounded accent-primary"
            />
            <div>
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Lock size={14} className="text-amber-600" />
                This item requires the buyer to be an initiated practitioner
              </div>
              <p className="text-xs text-muted-foreground">A badge will display on your listing</p>
            </div>
          </label>

          {/* Images */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground uppercase tracking-wide">Product Images</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImage())}
                placeholder="Paste image URL and press Enter"
                className="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              />
              <button
                type="button"
                onClick={addImage}
                className="px-4 py-2.5 bg-muted border border-border rounded-xl text-foreground hover:bg-muted/80 transition-colors"
              >
                <ImagePlus size={18} />
              </button>
            </div>
            {form.images.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {form.images.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-border" />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-border text-foreground font-bold hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !form.name || !form.category || !form.description || !form.price}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <><Loader2 size={18} className="animate-spin" /> {isEditMode ? 'Saving...' : 'Listing...'}</>
              ) : (
                isEditMode ? 'Save Changes' : 'List Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorProductForm;
