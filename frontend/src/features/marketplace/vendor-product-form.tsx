import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, X, ImagePlus, Lock, Plus, Trash2 } from 'lucide-react';
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
  // VENDOR_BACKLOG.md VND-024
  type: 'PHYSICAL' | 'DIGITAL';
  stock: string;
  provenance: string;
  usageProtocol: string;
  requiresInitiation: boolean;
  images: string[];
  // VENDOR_BACKLOG.md VND-018
  yorubaName: string;
  yorubaDescription: string;
  pronunciationGuide: string;
  traditionalUseContext: string;
  regionOfOrigin: string;
  // VENDOR_BACKLOG.md VND-023
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  // VENDOR_BACKLOG.md VND-008
  saveAsDraft: boolean;
  scheduledAt: string;
  showComingSoon: boolean;
  isPreOrder: boolean;
  expectedDeliveryDate: string;
  // VENDOR_BACKLOG.md VND-005
  lowStockThreshold: string;
  isMadeToOrder: boolean;
  madeToOrderProcessingTime: string;
  // VENDOR_BACKLOG.md VND-025
  wholesaleEnabled: boolean;
  wholesaleMinQuantity: string;
  wholesalePrice: string;
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
  // VENDOR_BACKLOG.md VND-024
  type?: 'PHYSICAL' | 'DIGITAL';
  stock?: number;
  provenance?: string;
  usageProtocol?: string;
  requiresInitiation?: boolean;
  images?: string[];
  yorubaName?: string;
  yorubaDescription?: string;
  pronunciationGuide?: string;
  traditionalUseContext?: string;
  regionOfOrigin?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  status?: string;
  scheduledAt?: string;
  showComingSoon?: boolean;
  isPreOrder?: boolean;
  expectedDeliveryDate?: string;
  lowStockThreshold?: number;
  isMadeToOrder?: boolean;
  madeToOrderProcessingTime?: string;
  // VENDOR_BACKLOG.md VND-025
  wholesaleEnabled?: boolean;
  wholesaleMinQuantity?: number;
  wholesalePrice?: number;
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
  type: 'PHYSICAL',
  stock: '',
  provenance: '',
  usageProtocol: '',
  requiresInitiation: false,
  images: [],
  yorubaName: '',
  yorubaDescription: '',
  pronunciationGuide: '',
  traditionalUseContext: '',
  regionOfOrigin: '',
  seoTitle: '',
  seoDescription: '',
  tags: [],
  saveAsDraft: false,
  scheduledAt: '',
  showComingSoon: false,
  isPreOrder: false,
  expectedDeliveryDate: '',
  lowStockThreshold: '5',
  isMadeToOrder: false,
  wholesaleEnabled: false,
  wholesaleMinQuantity: '10',
  wholesalePrice: '',
  madeToOrderProcessingTime: '',
};

const toDateInputValue = (iso?: string) => (iso ? iso.slice(0, 10) : '');

// VENDOR_BACKLOG.md VND-007: variants attach to a product that already
// exists (they're their own API resource, not part of the product create/
// update payload), so this is only shown once editing an existing product.
interface Variant {
  id: string;
  attributes: Record<string, string>;
  sku?: string | null;
  priceOverride?: number | null;
  stock?: number | null;
}

const ProductVariantsEditor: React.FC<{ productId: string }> = ({ productId }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [attributeInputs, setAttributeInputs] = useState<Array<{ name: string; value: string }>>([{ name: '', value: '' }]);
  const [sku, setSku] = useState('');
  const [priceOverride, setPriceOverride] = useState('');
  const [stock, setStock] = useState('');

  const { data: variants = [], isLoading } = useQuery<Variant[]>({
    queryKey: ['product-variants', productId],
    queryFn: async () => (await api.get(`/marketplace/products/${productId}/variants`)).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const attributes: Record<string, string> = {};
      attributeInputs.forEach((a) => { if (a.name.trim() && a.value.trim()) attributes[a.name.trim()] = a.value.trim(); });
      return api.post(`/marketplace/products/${productId}/variants`, {
        attributes,
        sku: sku || undefined,
        priceOverride: priceOverride ? Number(priceOverride) : undefined,
        stock: stock ? Number(stock) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      setAttributeInputs([{ name: '', value: '' }]);
      setSku('');
      setPriceOverride('');
      setStock('');
      toast.success('Variant added');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to add variant'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (variantId: string) => api.delete(`/marketplace/variants/${variantId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      toast.success('Variant removed');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to remove variant (it may have order history)'),
  });

  return (
    <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border">
      <p className="text-sm font-bold text-foreground">Variants</p>
      <p className="text-xs text-muted-foreground">e.g. Colour, Size, Quantity -- up to 3 attribute types across all variants</p>

      {isLoading ? (
        <Loader2 size={16} className="animate-spin text-muted-foreground" />
      ) : (
        variants.length > 0 && (
          <div className="space-y-2">
            {variants.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-2 p-2 bg-background rounded-lg border border-border text-sm">
                <div>
                  <span className="font-medium text-foreground">{Object.values(v.attributes).join(' / ')}</span>
                  {v.sku && <span className="text-muted-foreground ml-2">SKU: {v.sku}</span>}
                  {v.priceOverride != null && <span className="text-muted-foreground ml-2">₦{v.priceOverride.toLocaleString()}</span>}
                  {v.stock != null && <span className="text-muted-foreground ml-2">Stock: {v.stock}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(v.id)}
                  disabled={deleteMutation.isPending}
                  className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                  aria-label="Remove variant"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )
      )}

      <div className="space-y-2 pt-2 border-t border-border">
        {attributeInputs.map((attr, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              placeholder="Attribute (e.g. Colour)"
              value={attr.name}
              onChange={(e) => setAttributeInputs((prev) => prev.map((a, idx) => idx === i ? { ...a, name: e.target.value } : a))}
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
            />
            <input
              type="text"
              placeholder="Value (e.g. Yellow)"
              value={attr.value}
              onChange={(e) => setAttributeInputs((prev) => prev.map((a, idx) => idx === i ? { ...a, value: e.target.value } : a))}
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
            />
          </div>
        ))}
        {attributeInputs.length < 3 && (
          <button
            type="button"
            onClick={() => setAttributeInputs((prev) => [...prev, { name: '', value: '' }])}
            className="text-xs font-bold text-highlight hover:underline flex items-center gap-1"
          >
            <Plus size={12} /> Add another attribute
          </button>
        )}
        <div className="flex gap-2">
          <input type="text" placeholder="SKU (optional)" value={sku} onChange={(e) => setSku(e.target.value)} className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm" />
          <input type="number" min={0} placeholder="Price override (optional)" value={priceOverride} onChange={(e) => setPriceOverride(e.target.value)} className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm" />
          <input type="number" min={0} placeholder="Stock (optional)" value={stock} onChange={(e) => setStock(e.target.value)} className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm" />
        </div>
        <button
          type="button"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending || !attributeInputs.some((a) => a.name.trim() && a.value.trim())}
          className="px-3 py-1.5 bg-highlight text-foreground rounded-lg text-xs font-bold hover:bg-secondary transition-colors disabled:opacity-50"
        >
          {createMutation.isPending ? 'Adding...' : 'Add Variant'}
        </button>
      </div>
    </div>
  );
};

// VENDOR_BACKLOG.md VND-024: attaches after the product exists, same
// "attach on an existing resource" pattern as ProductVariantsEditor above.
const ProductDigitalFileEditor: React.FC<{ productId: string }> = ({ productId }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [externalUrl, setExternalUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: product } = useQuery<{ digitalFileName?: string | null; digitalFileUrl?: string | null; digitalFileSizeBytes?: number | null }>({
    queryKey: ['product-digital-file', productId],
    queryFn: async () => (await api.get(`/marketplace/products/${productId}`)).data,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) return;
      const formData = new FormData();
      formData.append('file', selectedFile);
      return api.post(`/marketplace/products/${productId}/digital-file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-digital-file', productId] });
      setSelectedFile(null);
      toast.success('File uploaded');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to upload file'),
  });

  const setUrlMutation = useMutation({
    mutationFn: async () => api.patch(`/marketplace/products/${productId}/digital-file-url`, { url: externalUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-digital-file', productId] });
      toast.success('Download link saved');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save link'),
  });

  return (
    <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border">
      <p className="text-sm font-bold text-foreground">Digital File</p>
      {product?.digitalFileName && (
        <p className="text-xs text-muted-foreground">Currently: {product.digitalFileName} ({Math.round((product.digitalFileSizeBytes ?? 0) / 1024 / 1024)}MB)</p>
      )}
      {product?.digitalFileUrl && <p className="text-xs text-muted-foreground truncate">Currently linked to: {product.digitalFileUrl}</p>}

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Upload a file (PDF, MP3, MP4, ZIP — up to 500MB)</label>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".pdf,.mp3,.mp4,.zip,application/pdf,audio/mpeg,video/mp4,application/zip"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            className="flex-1 text-sm text-foreground"
          />
          <button
            type="button"
            onClick={() => uploadMutation.mutate()}
            disabled={!selectedFile || uploadMutation.isPending}
            className="px-3 py-1.5 bg-highlight text-foreground rounded-lg text-xs font-bold hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>

      <div className="space-y-1.5 pt-2 border-t border-border">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Or link to an externally hosted file (Google Drive, Dropbox)</label>
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://drive.google.com/..."
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
          />
          <button
            type="button"
            onClick={() => setUrlMutation.mutate()}
            disabled={!externalUrl.trim() || setUrlMutation.isPending}
            className="px-3 py-1.5 border border-border rounded-lg text-xs font-bold hover:bg-muted transition-colors disabled:opacity-50"
          >
            {setUrlMutation.isPending ? 'Saving...' : 'Save Link'}
          </button>
        </div>
      </div>
    </div>
  );
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
          type: initialData.type ?? 'PHYSICAL',
          stock: initialData.stock != null ? String(initialData.stock) : '',
          provenance: initialData.provenance ?? '',
          usageProtocol: initialData.usageProtocol ?? '',
          requiresInitiation: initialData.requiresInitiation ?? false,
          images: initialData.images ?? [],
          yorubaName: initialData.yorubaName ?? '',
          yorubaDescription: initialData.yorubaDescription ?? '',
          pronunciationGuide: initialData.pronunciationGuide ?? '',
          traditionalUseContext: initialData.traditionalUseContext ?? '',
          regionOfOrigin: initialData.regionOfOrigin ?? '',
          seoTitle: initialData.seoTitle ?? '',
          seoDescription: initialData.seoDescription ?? '',
          tags: initialData.tags ?? [],
          saveAsDraft: initialData.status === 'DRAFT',
          scheduledAt: toDateInputValue(initialData.scheduledAt),
          showComingSoon: initialData.showComingSoon ?? false,
          isPreOrder: initialData.isPreOrder ?? false,
          expectedDeliveryDate: toDateInputValue(initialData.expectedDeliveryDate),
          lowStockThreshold: initialData.lowStockThreshold != null ? String(initialData.lowStockThreshold) : '5',
          isMadeToOrder: initialData.isMadeToOrder ?? false,
          madeToOrderProcessingTime: initialData.madeToOrderProcessingTime ?? '',
          wholesaleEnabled: initialData.wholesaleEnabled ?? false,
          wholesaleMinQuantity: initialData.wholesaleMinQuantity != null ? String(initialData.wholesaleMinQuantity) : '10',
          wholesalePrice: initialData.wholesalePrice != null ? String(initialData.wholesalePrice) : '',
        }
      : INITIAL_FORM,
  );
  const [imageUrl, setImageUrl] = useState('');
  const [tagInput, setTagInput] = useState('');
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

  // VENDOR_BACKLOG.md VND-023
  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && form.tags.length < 10 && !form.tags.includes(tag)) {
      setForm(f => ({ ...f, tags: [...f.tags, tag] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
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
      // VENDOR_BACKLOG.md VND-024
      type: data.type,
    };
    if (data.subcategory) payload.subcategory = data.subcategory;
    if (data.longDescription) payload.longDescription = data.longDescription;
    // VENDOR_BACKLOG.md VND-024: a digital good has no physical stock to
    // track -- always send null rather than whatever's left in the stock
    // field (matches how "Made to Order" below already clears it).
    if (data.type === 'DIGITAL') payload.stock = null;
    // VENDOR_BACKLOG.md VND-005: "Made to Order" is the existing null-stock
    // ("infinite") behavior everywhere stock is checked -- explicitly clear
    // stock rather than sending whatever was left in the stock field.
    else if (data.isMadeToOrder) payload.stock = null;
    else if (data.stock) payload.stock = parseInt(data.stock, 10);
    if (data.provenance) payload.provenance = data.provenance;
    if (data.usageProtocol) payload.usageProtocol = data.usageProtocol;
    if (data.yorubaName) payload.yorubaName = data.yorubaName;
    if (data.yorubaDescription) payload.yorubaDescription = data.yorubaDescription;
    if (data.pronunciationGuide) payload.pronunciationGuide = data.pronunciationGuide;
    if (data.traditionalUseContext) payload.traditionalUseContext = data.traditionalUseContext;
    if (data.regionOfOrigin) payload.regionOfOrigin = data.regionOfOrigin;
    if (data.seoTitle) payload.seoTitle = data.seoTitle;
    if (data.seoDescription) payload.seoDescription = data.seoDescription;
    if (data.tags.length > 0) payload.tags = data.tags;

    // VENDOR_BACKLOG.md VND-008: this form only ever offers a DRAFT/not-draft
    // toggle -- it doesn't know about ARCHIVED/SUSPENDED. On create there's
    // nothing to preserve, but on edit only send `status` when the vendor
    // actually touched the toggle, so saving a description edit on an
    // already-ARCHIVED (or admin-SUSPENDED) product doesn't silently flip it
    // back to ACTIVE underneath them.
    const initialWasDraft = initialData?.status === 'DRAFT';
    if (!isEditMode || data.saveAsDraft !== initialWasDraft) {
      payload.status = data.saveAsDraft ? 'DRAFT' : 'ACTIVE';
    }
    if (data.scheduledAt) payload.scheduledAt = new Date(data.scheduledAt).toISOString();
    payload.showComingSoon = data.showComingSoon;
    payload.isPreOrder = data.isPreOrder;
    if (data.expectedDeliveryDate) payload.expectedDeliveryDate = new Date(data.expectedDeliveryDate).toISOString();

    // VENDOR_BACKLOG.md VND-005
    if (data.lowStockThreshold) payload.lowStockThreshold = parseInt(data.lowStockThreshold, 10);
    payload.isMadeToOrder = data.isMadeToOrder;
    if (data.isMadeToOrder && data.madeToOrderProcessingTime) {
      payload.madeToOrderProcessingTime = data.madeToOrderProcessingTime;
    }

    // VENDOR_BACKLOG.md VND-025
    payload.wholesaleEnabled = data.wholesaleEnabled;
    if (data.wholesaleEnabled) {
      if (data.wholesaleMinQuantity) payload.wholesaleMinQuantity = parseInt(data.wholesaleMinQuantity, 10);
      if (data.wholesalePrice) payload.wholesalePrice = parseFloat(data.wholesalePrice);
    }
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

          {/* VENDOR_BACKLOG.md VND-024: no UI previously let a vendor create a
              DIGITAL product at all -- every listing silently defaulted to
              PHYSICAL server-side, regardless of what the vendor intended. */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground uppercase tracking-wide">Product Type *</label>
            <div className="flex gap-2">
              {(['PHYSICAL', 'DIGITAL'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`flex-1 p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                    form.type === t
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  {t === 'PHYSICAL' ? 'Physical (ships to customer)' : 'Digital (instant download)'}
                </button>
              ))}
            </div>
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
          <div className={form.type === 'DIGITAL' ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-3 gap-4'}>
            <div className={form.type === 'DIGITAL' ? 'space-y-1.5' : 'col-span-2 space-y-1.5'}>
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
            {/* VENDOR_BACKLOG.md VND-024: a digital good has no physical stock */}
            {form.type === 'PHYSICAL' && (
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground uppercase tracking-wide">Stock</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  placeholder="∞"
                  disabled={form.isMadeToOrder}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:opacity-50"
                />
              </div>
            )}
          </div>

          {/* VENDOR_BACKLOG.md VND-005: inventory settings -- physical goods only */}
          {form.type === 'PHYSICAL' && (
            <div className="space-y-4 pt-4 border-t border-border">
              <p className="text-sm font-bold text-foreground uppercase tracking-wide">Inventory</p>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground uppercase tracking-wide">
                  Low Stock Alert Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.lowStockThreshold}
                  onChange={e => setForm(f => ({ ...f, lowStockThreshold: e.target.value }))}
                  disabled={form.isMadeToOrder}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground">Flagged as "Low Stock" in your inventory view once stock drops below this</p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.isMadeToOrder}
                  onChange={e => setForm(f => ({ ...f, isMadeToOrder: e.target.checked }))}
                  className="w-4 h-4 rounded accent-primary"
                />
                <div>
                  <div className="font-medium text-foreground">Made to Order</div>
                  <p className="text-xs text-muted-foreground">Infinite stock — no unit count is tracked for this item</p>
                </div>
              </label>
              {form.isMadeToOrder && (
                <div className="pl-7 space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Processing Time</label>
                  <input
                    type="text"
                    value={form.madeToOrderProcessingTime}
                    onChange={e => setForm(f => ({ ...f, madeToOrderProcessingTime: e.target.value }))}
                    placeholder="e.g. 7-10 business days"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* VENDOR_BACKLOG.md VND-024: digital file, only once the product exists */}
          {form.type === 'DIGITAL' && initialData?.id && <ProductDigitalFileEditor productId={initialData.id} />}
          {form.type === 'DIGITAL' && !initialData?.id && (
            <p className="text-xs text-muted-foreground bg-muted/40 rounded-xl p-3">
              Save this product first, then come back to edit it to upload the file or link customers will download after purchase.
            </p>
          )}

          {/* VENDOR_BACKLOG.md VND-025: wholesale mode */}
          <div className="space-y-3 pt-4 border-t border-border">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.wholesaleEnabled}
                onChange={e => setForm(f => ({ ...f, wholesaleEnabled: e.target.checked }))}
                className="w-4 h-4 rounded accent-primary"
              />
              <div>
                <div className="font-medium text-foreground">Enable Wholesale Pricing</div>
                <p className="text-xs text-muted-foreground">Only verified Babalawo and admin accounts see or can use this price</p>
              </div>
            </label>
            {form.wholesaleEnabled && (
              <div className="grid grid-cols-2 gap-4 pl-7">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Minimum Quantity</label>
                  <input
                    type="number"
                    min={2}
                    value={form.wholesaleMinQuantity}
                    onChange={e => setForm(f => ({ ...f, wholesaleMinQuantity: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Wholesale Price (per unit)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.wholesalePrice}
                    onChange={e => setForm(f => ({ ...f, wholesalePrice: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                  />
                </div>
              </div>
            )}
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

          {/* VENDOR_BACKLOG.md VND-018: Yoruba language listing details */}
          <div className="space-y-4 pt-4 border-t border-border">
            <p className="text-sm font-bold text-foreground uppercase tracking-wide">
              Yoruba Language Details <span className="text-muted-foreground font-normal normal-case">(Optional)</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Yoruba Name</label>
                <input
                  type="text"
                  value={form.yorubaName}
                  onChange={e => setForm(f => ({ ...f, yorubaName: e.target.value }))}
                  placeholder="e.g. Ide"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Pronunciation Guide</label>
                <input
                  type="text"
                  value={form.pronunciationGuide}
                  onChange={e => setForm(f => ({ ...f, pronunciationGuide: e.target.value }))}
                  placeholder="e.g. ee-DEH"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Yoruba Description</label>
              <textarea
                rows={2}
                value={form.yorubaDescription}
                onChange={e => setForm(f => ({ ...f, yorubaDescription: e.target.value }))}
                placeholder="Describe this item in Yoruba"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Traditional Use Context</label>
              <textarea
                rows={2}
                value={form.traditionalUseContext}
                onChange={e => setForm(f => ({ ...f, traditionalUseContext: e.target.value }))}
                placeholder="How is this item traditionally used, distinct from a commercial description"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Region of Origin</label>
              <input
                type="text"
                value={form.regionOfOrigin}
                onChange={e => setForm(f => ({ ...f, regionOfOrigin: e.target.value }))}
                placeholder="e.g. Ọṣun State, Ogun State, Eko, Diaspora-made"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* VENDOR_BACKLOG.md VND-023: SEO & discovery */}
          <div className="space-y-4 pt-4 border-t border-border">
            <p className="text-sm font-bold text-foreground uppercase tracking-wide">
              SEO & Discovery <span className="text-muted-foreground font-normal normal-case">(Optional)</span>
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Tags <span className="normal-case font-normal">({form.tags.length}/10)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="e.g. beads, divination, ifa"
                  disabled={form.tags.length >= 10}
                  className="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={form.tags.length >= 10}
                  className="px-4 py-2.5 bg-muted border border-border rounded-xl text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
                >
                  Add
                </button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {form.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-muted rounded-full text-xs font-bold text-foreground">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-red-500">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">SEO Title</label>
              <input
                type="text"
                value={form.seoTitle}
                onChange={e => setForm(f => ({ ...f, seoTitle: e.target.value }))}
                placeholder="Shown when this product link is shared externally"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">SEO Description</label>
              <textarea
                rows={2}
                value={form.seoDescription}
                onChange={e => setForm(f => ({ ...f, seoDescription: e.target.value }))}
                placeholder="A short summary for search engines and link previews"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
              />
            </div>
          </div>

          {/* VENDOR_BACKLOG.md VND-008: draft, scheduling, and pre-order */}
          <div className="space-y-4 pt-4 border-t border-border">
            <p className="text-sm font-bold text-foreground uppercase tracking-wide">
              Publishing
            </p>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.saveAsDraft}
                onChange={e => setForm(f => ({ ...f, saveAsDraft: e.target.checked }))}
                className="w-4 h-4 rounded accent-primary"
              />
              <div>
                <div className="font-medium text-foreground">Save as Draft</div>
                <p className="text-xs text-muted-foreground">Not visible to customers until you publish it</p>
              </div>
            </label>

            {form.saveAsDraft && (
              <div className="pl-7 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Goes Live On <span className="normal-case font-normal">(optional — auto-publishes at this date/time)</span>
                  </label>
                  <input
                    type="date"
                    value={form.scheduledAt}
                    onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                {form.scheduledAt && (
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.showComingSoon}
                      onChange={e => setForm(f => ({ ...f, showComingSoon: e.target.checked }))}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    <div>
                      <div className="font-medium text-foreground">Show as "Coming Soon" until then</div>
                      <p className="text-xs text-muted-foreground">Customers can see it in the marketplace, but can't buy it yet</p>
                    </div>
                  </label>
                )}
              </div>
            )}

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.isPreOrder}
                onChange={e => setForm(f => ({ ...f, isPreOrder: e.target.checked }))}
                className="w-4 h-4 rounded accent-primary"
              />
              <div>
                <div className="font-medium text-foreground">Enable Pre-Order</div>
                <p className="text-xs text-muted-foreground">Stock above is treated as pre-order slots; customers are notified when it's ready to ship</p>
              </div>
            </label>
            {form.isPreOrder && (
              <div className="pl-7 space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Expected Delivery Date</label>
                <input
                  type="date"
                  value={form.expectedDeliveryDate}
                  onChange={e => setForm(f => ({ ...f, expectedDeliveryDate: e.target.value }))}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            )}
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

          {/* VENDOR_BACKLOG.md VND-007: variants attach to an existing product */}
          {initialData?.id && <ProductVariantsEditor productId={initialData.id} />}

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
