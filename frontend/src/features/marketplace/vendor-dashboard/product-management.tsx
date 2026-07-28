// Whole-app audit note: this dashboard tab and the standalone
// vendor-product-list-view.tsx (/vendor/products) both list+manage the same
// vendor products against the same endpoints. Not consolidated -- both are
// live, reachable UIs (tab inside the main dashboard vs. a dedicated page);
// left as-is rather than removing either without confirming which callers
// depend on which.
import React, { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Edit, Trash2, ArrowRight, Loader2, Clock, CalendarClock, Download, Upload, CheckSquare, Square, History, X, Check } from 'lucide-react';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/components/toast';
import VendorProductForm from '../vendor-product-form';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  stock: number | null;
  status: string;
  images: string[];
  createdAt: string;
  // VENDOR_BACKLOG.md VND-008
  scheduledAt?: string | null;
  showComingSoon?: boolean;
  isPreOrder?: boolean;
  expectedDeliveryDate?: string | null;
  // VENDOR_BACKLOG.md VND-005
  lowStockThreshold: number;
  isMadeToOrder: boolean;
  totalSold: number;
  stockLevel: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'MADE_TO_ORDER';
}

interface StockLogEntry {
  id: string;
  previousStock: number | null;
  newStock: number | null;
  source: string;
  changedBy: string | null;
  createdAt: string;
}

interface ProductManagementProps {
  vendorId: string;
  activeTab: string;
}

const STOCK_LEVEL_CONFIG: Record<Product['stockLevel'], { label: string; cls: string }> = {
  IN_STOCK: { label: '🟢 In Stock', cls: 'text-green-600' },
  LOW_STOCK: { label: '🟡 Low Stock', cls: 'text-amber-600' },
  OUT_OF_STOCK: { label: '🔴 Out of Stock', cls: 'text-red-600' },
  MADE_TO_ORDER: { label: 'Made to Order', cls: 'text-indigo-600' },
};

const SOURCE_LABELS: Record<string, string> = {
  VENDOR_EDIT: 'Manual edit',
  BULK_RESTOCK: 'Bulk restock',
  ORDER_SALE: 'Sale',
  CSV_IMPORT: 'CSV import',
};

const statusBadge = (product: Product) => {
  if (product.status === 'DRAFT' && product.showComingSoon && product.scheduledAt) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <CalendarClock className="w-3 h-3" /> Coming Soon
      </Badge>
    );
  }
  if (product.status === 'DRAFT') {
    return <Badge variant="secondary">Draft</Badge>;
  }
  if (product.isPreOrder) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="w-3 h-3" /> Pre-Order
      </Badge>
    );
  }
  return <Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}>{product.status}</Badge>;
};

// VENDOR_BACKLOG.md VND-005: stock history for one product, fetched on demand
const StockHistoryModal: React.FC<{ productId: string; productName: string; onClose: () => void }> = ({ productId, productName, onClose }) => {
  const { data: entries = [], isLoading } = useQuery<StockLogEntry[]>({
    queryKey: ['product-stock-history', productId],
    queryFn: async () => (await api.get(`/marketplace/products/${productId}/stock-history`)).data,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h3 className="font-bold text-foreground">Stock History — {productName}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stock changes recorded yet.</p>
          ) : (
            entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="font-semibold text-foreground">{e.previousStock ?? '∞'} → {e.newStock ?? '∞'}</p>
                  <p className="text-xs text-muted-foreground">{SOURCE_LABELS[e.source] ?? e.source}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(e.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// VENDOR_BACKLOG.md VND-008: previously this GET/DELETE hit routes that
// didn't exist (`/vendors/:id/products`, `/products/:id`) -- the vendor
// dashboard's Inventory tab silently 404'd forever. Fixed to the real
// `/marketplace/...` endpoints, and Edit now actually opens the product
// (it used to just navigate to the generic /vendor/products list with no
// product id attached, so it always opened the *create* form instead).
const ProductManagement: React.FC<ProductManagementProps> = ({ vendorId, activeTab }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [priceMode, setPriceMode] = useState<'PERCENT' | 'FIXED_AMOUNT' | 'SET_PRICE'>('PERCENT');
  const [priceValue, setPriceValue] = useState('');
  const [bulkCategory, setBulkCategory] = useState('');
  const [restockMode, setRestockMode] = useState<'ADD' | 'SET'>('ADD');
  const [restockValue, setRestockValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // VENDOR_BACKLOG.md VND-005: inline stock edit state
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockDraft, setStockDraft] = useState('');

  // VENDOR_BACKLOG.md VND-005: sort/filter
  const [sortBy, setSortBy] = useState<'stock' | 'sales' | 'price' | 'date'>('date');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const { data: productsData = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['vendor-inventory', vendorId],
    queryFn: async () => {
      const response = await api.get(`/marketplace/vendors/${vendorId}/inventory`);
      return response.data;
    },
    enabled: !!vendorId && activeTab === 'inventory',
  });

  const categories = useMemo(
    () => [...new Set(productsData.map((p) => p.category))].sort(),
    [productsData]
  );

  const visibleProducts = useMemo(() => {
    let list = [...productsData];
    if (filterCategory) list = list.filter((p) => p.category === filterCategory);
    if (filterStatus) list = list.filter((p) => p.status === filterStatus);
    if (lowStockOnly) list = list.filter((p) => p.stockLevel === 'LOW_STOCK' || p.stockLevel === 'OUT_OF_STOCK');
    list.sort((a, b) => {
      if (sortBy === 'stock') return (a.stock ?? Infinity) - (b.stock ?? Infinity);
      if (sortBy === 'sales') return b.totalSold - a.totalSold;
      if (sortBy === 'price') return b.price - a.price;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [productsData, filterCategory, filterStatus, lowStockOnly, sortBy]);

  const invalidateInventory = () => queryClient.invalidateQueries({ queryKey: ['vendor-inventory', vendorId] });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await api.delete(`/marketplace/products/${productId}`);
      return response.data;
    },
    onSuccess: (data) => {
      invalidateInventory();
      toast.success(data?.archived ? 'Product had order history, so it was archived instead' : 'Product deleted');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete product');
    },
  });

  const invalidateAndClear = () => {
    invalidateInventory();
    setSelectedIds(new Set());
  };

  // VENDOR_BACKLOG.md VND-005: inline stock edit
  const stockEditMutation = useMutation({
    mutationFn: async ({ productId, stock }: { productId: string; stock: number }) =>
      api.patch(`/marketplace/products/${productId}`, { stock }),
    onSuccess: () => { setEditingStockId(null); invalidateInventory(); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update stock'),
  });

  // VENDOR_BACKLOG.md VND-006: bulk actions
  const bulkStatusMutation = useMutation({
    mutationFn: async (status: string) =>
      api.patch(`/marketplace/vendors/${vendorId}/products/bulk`, { productIds: [...selectedIds], status }),
    onSuccess: () => { toast.success('Status updated'); invalidateAndClear(); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Bulk status update failed'),
  });

  const bulkCategoryMutation = useMutation({
    mutationFn: async () =>
      api.patch(`/marketplace/vendors/${vendorId}/products/bulk`, { productIds: [...selectedIds], category: bulkCategory }),
    onSuccess: () => { toast.success('Category updated'); setBulkCategory(''); invalidateAndClear(); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Bulk category update failed'),
  });

  const bulkPriceMutation = useMutation({
    mutationFn: async () =>
      api.patch(`/marketplace/vendors/${vendorId}/products/bulk`, {
        productIds: [...selectedIds],
        priceAdjustment: { mode: priceMode, value: parseFloat(priceValue) },
      }),
    onSuccess: () => { toast.success('Prices updated'); setPriceValue(''); invalidateAndClear(); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Bulk price update failed'),
  });

  // VENDOR_BACKLOG.md VND-005: "Bulk restock: select multiple products, add quantity"
  const bulkRestockMutation = useMutation({
    mutationFn: async () =>
      api.patch(`/marketplace/vendors/${vendorId}/products/bulk`, {
        productIds: [...selectedIds],
        stockAdjustment: { mode: restockMode, value: parseFloat(restockValue) },
      }),
    onSuccess: (res) => {
      const skipped = res.data?.stockSkippedMadeToOrder ?? 0;
      toast.success(`Stock updated${skipped ? ` (${skipped} made-to-order product(s) skipped)` : ''}`);
      setRestockValue('');
      invalidateAndClear();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Bulk restock failed'),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async () =>
      api.post(`/marketplace/vendors/${vendorId}/products/bulk-delete`, { productIds: [...selectedIds] }),
    onSuccess: (res) => {
      const { deleted, archivedInstead } = res.data;
      toast.success(`${deleted} deleted${archivedInstead ? `, ${archivedInstead} archived (had order history)` : ''}`);
      invalidateAndClear();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Bulk delete failed'),
  });

  const exportMutation = useMutation({
    mutationFn: async () => api.get(`/marketplace/vendors/${vendorId}/products/export`, { responseType: 'blob' }),
    onSuccess: (res) => {
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `products-${vendorId}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    },
    onError: () => toast.error('Failed to export products'),
  });

  const importMutation = useMutation({
    mutationFn: async (csv: string) => api.post(`/marketplace/vendors/${vendorId}/products/import`, { csv }),
    onSuccess: (res) => {
      const { created, updated, errors } = res.data;
      toast.success(`Imported: ${created} created, ${updated} updated${errors.length ? `, ${errors.length} row(s) had errors` : ''}`);
      invalidateInventory();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to import CSV'),
  });

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importMutation.mutate(String(reader.result));
    reader.readAsText(file);
    e.target.value = '';
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === visibleProducts.length ? new Set() : new Set(visibleProducts.map((p) => p.id))
    );
  };

  if (activeTab !== 'inventory' && activeTab !== 'products') return null;

  return (
    <div className="space-y-6">
      {editingProduct && (
        <VendorProductForm
          initialData={editingProduct as any}
          onClose={() => setEditingProduct(null)}
          onSuccess={invalidateInventory}
        />
      )}
      {historyProduct && (
        <StockHistoryModal
          productId={historyProduct.id}
          productName={historyProduct.name}
          onClose={() => setHistoryProduct(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Inventory Management</h2>
          <p className="text-muted-foreground">See and manage all your stock in one place</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile} />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importMutation.isPending}>
            {importMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Import CSV
          </Button>
          <Button variant="outline" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending || productsData.length === 0}>
            {exportMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export CSV
          </Button>
          <Button onClick={() => navigate('/vendor/products')} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* VENDOR_BACKLOG.md VND-005: sort/filter controls */}
      {productsData.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm bg-background border border-border rounded-lg px-2 py-1.5 text-foreground"
          >
            <option value="date">Sort: Date added</option>
            <option value="stock">Sort: Stock level</option>
            <option value="sales">Sort: Total sold</option>
            <option value="price">Sort: Price</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-sm bg-background border border-border rounded-lg px-2 py-1.5 text-foreground"
          >
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm bg-background border border-border rounded-lg px-2 py-1.5 text-foreground"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <label className="flex items-center gap-1.5 text-sm text-foreground">
            <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
            Low/out of stock only
          </label>
        </div>
      )}

      {/* VENDOR_BACKLOG.md VND-006: bulk actions bar */}
      {visibleProducts.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 bg-muted/40 border border-border rounded-xl p-3">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 text-sm font-bold text-foreground"
          >
            {selectedIds.size === visibleProducts.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
          </button>

          {selectedIds.size > 0 && (
            <>
              <div className="flex items-center gap-1.5">
                <select
                  onChange={(e) => e.target.value && bulkStatusMutation.mutate(e.target.value)}
                  disabled={bulkStatusMutation.isPending}
                  defaultValue=""
                  className="text-sm bg-background border border-border rounded-lg px-2 py-1.5 text-foreground"
                >
                  <option value="" disabled>Set status…</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  placeholder="New category"
                  className="text-sm bg-background border border-border rounded-lg px-2 py-1.5 text-foreground w-32"
                />
                <Button size="sm" variant="outline" onClick={() => bulkCategoryMutation.mutate()} disabled={!bulkCategory || bulkCategoryMutation.isPending}>
                  Apply
                </Button>
              </div>

              <div className="flex items-center gap-1.5">
                <select
                  value={priceMode}
                  onChange={(e) => setPriceMode(e.target.value as any)}
                  className="text-sm bg-background border border-border rounded-lg px-2 py-1.5 text-foreground"
                >
                  <option value="PERCENT">% change</option>
                  <option value="FIXED_AMOUNT">± amount</option>
                  <option value="SET_PRICE">Set price</option>
                </select>
                <input
                  type="number"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  placeholder="Price"
                  className="text-sm bg-background border border-border rounded-lg px-2 py-1.5 text-foreground w-20"
                />
                <Button size="sm" variant="outline" onClick={() => bulkPriceMutation.mutate()} disabled={!priceValue || bulkPriceMutation.isPending}>
                  Apply
                </Button>
              </div>

              {/* VENDOR_BACKLOG.md VND-005: bulk restock */}
              <div className="flex items-center gap-1.5">
                <select
                  value={restockMode}
                  onChange={(e) => setRestockMode(e.target.value as any)}
                  className="text-sm bg-background border border-border rounded-lg px-2 py-1.5 text-foreground"
                >
                  <option value="ADD">Add stock</option>
                  <option value="SET">Set stock</option>
                </select>
                <input
                  type="number"
                  value={restockValue}
                  onChange={(e) => setRestockValue(e.target.value)}
                  placeholder="Qty"
                  className="text-sm bg-background border border-border rounded-lg px-2 py-1.5 text-foreground w-16"
                />
                <Button size="sm" variant="outline" onClick={() => bulkRestockMutation.mutate()} disabled={!restockValue || bulkRestockMutation.isPending}>
                  Apply
                </Button>
              </div>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => { if (confirm(`Delete ${selectedIds.size} product(s)? Any with order history will be archived instead.`)) bulkDeleteMutation.mutate(); }}
                disabled={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </Button>
            </>
          )}
        </div>
      )}

      {productsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading products...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleProducts.map((product) => (
            <div key={product.id} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow relative">
              <button
                type="button"
                onClick={() => toggleSelected(product.id)}
                className="absolute top-4 left-4"
                aria-label={`Select ${product.name}`}
              >
                {selectedIds.has(product.id) ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5 text-muted-foreground" />}
              </button>
              <div className="flex justify-between items-start mb-4 pl-8">
                <div>
                  <h3 className="font-bold text-foreground text-lg">{product.name}</h3>
                  <p className="text-muted-foreground text-sm">{product.category}</p>
                </div>
                {statusBadge(product)}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-foreground">
                  {product.currency} {product.price.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">{product.totalSold} sold</p>
              </div>

              {/* VENDOR_BACKLOG.md VND-005: stock level + inline edit */}
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs font-bold ${STOCK_LEVEL_CONFIG[product.stockLevel].cls}`}>
                  {STOCK_LEVEL_CONFIG[product.stockLevel].label}
                </span>
                {product.stockLevel !== 'MADE_TO_ORDER' && (
                  editingStockId === product.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        autoFocus
                        value={stockDraft}
                        onChange={(e) => setStockDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && stockEditMutation.mutate({ productId: product.id, stock: parseInt(stockDraft, 10) })}
                        className="w-16 text-sm bg-background border border-border rounded-lg px-2 py-1 text-foreground"
                      />
                      <button
                        onClick={() => stockEditMutation.mutate({ productId: product.id, stock: parseInt(stockDraft, 10) })}
                        className="text-primary"
                        aria-label="Save stock"
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingStockId(product.id); setStockDraft(String(product.stock ?? '')); }}
                      className="text-sm text-foreground underline decoration-dotted"
                    >
                      {product.stock} in stock
                    </button>
                  )
                )}
              </div>

              {product.status === 'DRAFT' && product.showComingSoon && product.scheduledAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  Goes live {new Date(product.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
              {product.isPreOrder && product.expectedDeliveryDate && (
                <p className="text-xs text-muted-foreground mt-2">
                  Expected delivery {new Date(product.expectedDeliveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}

              <div className="mt-6 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingProduct(product)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => setHistoryProduct(product)} aria-label="Stock history">
                  <History className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteProductMutation.mutate(product.id)}
                  disabled={deleteProductMutation.isPending}
                >
                  {deleteProductMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(`/marketplace/${product.id}`)}
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {productsData.length === 0 && !productsLoading && (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No products yet</h3>
          <p className="text-muted-foreground mb-4">Get started by adding your first product</p>
          <Button
            onClick={() => navigate('/vendor/products')}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
