import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, ShoppingCart, Store, Tag, Star, Trash2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';

type SubTab = 'products' | 'orders' | 'vendor-health' | 'categories';

interface Product { id: string; title: string; price: number; status: string; isFeatured: boolean; vendor: { name: string }; _count: { reviews: number } }
interface Order { id: string; status: string; totalAmount: number; createdAt: string; customer: { name: string }; vendor: { name: string }; items: { quantity: number; product: { title: string } }[] }
interface VendorHealth { vendorId: string; vendorName: string; email: string; productCount: number; activeProducts: number; fulfillmentRate: number; inactive: boolean }
interface Category { category: string; _count: { id: number } }

function ProductsTab() {
  const { success, error } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ['admin', 'marketplace-products', page],
    queryFn: () => api.get(`/admin/marketplace/products?page=${page}&limit=20`).then(r => r.data),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/marketplace/products/${id}`, { data: { reason: 'Admin removal' } }),
    onSuccess: () => { success('Product removed'); qc.invalidateQueries({ queryKey: ['admin', 'marketplace-products'] }); },
    onError: () => error('Failed to remove product'),
  });
  const feature = useMutation({
    mutationFn: ({ id, featuredUntil }: { id: string; featuredUntil: string | null }) =>
      api.patch(`/admin/marketplace/products/${id}/feature`, { featuredUntil }),
    onSuccess: () => { success('Updated'); qc.invalidateQueries({ queryKey: ['admin', 'marketplace-products'] }); },
    onError: () => error('Failed to update'),
  });
  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Loading...</p>;
  return (
    <div className="space-y-3">
      {data?.products.map(p => (
        <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
            <p className="text-xs text-muted-foreground">{p.vendor.name} &middot; NGN {p.price.toLocaleString()} &middot; {p._count.reviews} reviews</p>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${p.status === 'ACTIVE' ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>{p.status}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={() => feature.mutate({ id: p.id, featuredUntil: p.isFeatured ? null : new Date(Date.now() + 30 * 86400000).toISOString() })} className={`p-1.5 rounded-lg ${p.isFeatured ? 'text-yellow-500 bg-yellow-500/10' : 'text-muted-foreground hover:bg-muted'}`} title={p.isFeatured ? 'Unfeature' : 'Feature 30d'}>
              <Star className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => remove.mutate(p.id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      <div className="flex justify-between items-center pt-2">
        <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-sm text-primary disabled:opacity-40">Previous</button>
        <span className="text-xs text-muted-foreground">{data?.total ?? 0} total</span>
        <button type="button" onClick={() => setPage(p => p + 1)} disabled={(page * 20) >= (data?.total ?? 0)} className="text-sm text-primary disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}

function OrdersTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery<{ orders: Order[]; total: number }>({
    queryKey: ['admin', 'marketplace-orders', page],
    queryFn: () => api.get(`/admin/marketplace/orders?page=${page}&limit=20`).then(r => r.data),
  });
  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Loading...</p>;
  return (
    <div className="space-y-3">
      {data?.orders.map(o => (
        <div key={o.id} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-foreground">{o.customer.name} to {o.vendor.name}</p>
              <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()} &middot; {o.items.length} items</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-foreground">NGN {o.totalAmount.toLocaleString()}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${o.status === 'DELIVERED' ? 'bg-green-500/10 text-green-600' : o.status === 'CANCELLED' ? 'bg-red-500/10 text-red-600' : 'bg-blue-500/10 text-blue-600'}`}>{o.status}</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">{o.items.map(i => `${i.product.title} x${i.quantity}`).join(', ')}</div>
        </div>
      ))}
      <div className="flex justify-between items-center pt-2">
        <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-sm text-primary disabled:opacity-40">Previous</button>
        <span className="text-xs text-muted-foreground">{data?.total ?? 0} total</span>
        <button type="button" onClick={() => setPage(p => p + 1)} disabled={(page * 20) >= (data?.total ?? 0)} className="text-sm text-primary disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}

function VendorHealthTab() {
  const { data, isLoading } = useQuery<VendorHealth[]>({
    queryKey: ['admin', 'vendor-health'],
    queryFn: () => api.get('/admin/marketplace/vendor-health').then(r => r.data),
  });
  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Loading...</p>;
  return (
    <div className="space-y-3">
      {data?.map(v => (
        <div key={v.vendorId} className={`bg-card border rounded-xl p-4 ${v.inactive ? 'border-yellow-500/40' : 'border-border'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{v.vendorName}</p>
              <p className="text-xs text-muted-foreground">{v.email}</p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="text-xs text-muted-foreground">{v.activeProducts}/{v.productCount} active</p>
              <p className="text-xs">Fulfillment: <span className={`font-semibold ${v.fulfillmentRate >= 80 ? 'text-green-600' : v.fulfillmentRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{v.fulfillmentRate.toFixed(0)}%</span></p>
              {v.inactive && <p className="text-xs text-yellow-500 flex items-center gap-1 justify-end"><AlertCircle className="w-3 h-3" />Inactive</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoriesTab() {
  const { data, isLoading } = useQuery<Category[]>({
    queryKey: ['admin', 'marketplace-categories'],
    queryFn: () => api.get('/admin/marketplace/categories').then(r => r.data),
  });
  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Loading...</p>;
  return (
    <div className="grid grid-cols-2 gap-3">
      {data?.map(c => (
        <div key={c.category} className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-medium text-foreground">{c.category || 'Uncategorised'}</p>
          <p className="text-2xl font-bold text-primary mt-1">{c._count.id}</p>
          <p className="text-xs text-muted-foreground">products</p>
        </div>
      ))}
    </div>
  );
}

const SUB_TABS = [
  { id: 'products' as SubTab, label: 'Products', Icon: Package },
  { id: 'orders' as SubTab, label: 'Orders', Icon: ShoppingCart },
  { id: 'vendor-health' as SubTab, label: 'Vendor Health', Icon: Store },
  { id: 'categories' as SubTab, label: 'Categories', Icon: Tag },
];

export default function AdminMarketplaceTab() {
  const [sub, setSub] = useState<SubTab>('products');
  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl flex-wrap w-fit">
        {SUB_TABS.map(({ id, label, Icon }) => (
          <button key={id} type="button" onClick={() => setSub(id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${sub === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>
      {sub === 'products' && <ProductsTab />}
      {sub === 'orders' && <OrdersTab />}
      {sub === 'vendor-health' && <VendorHealthTab />}
      {sub === 'categories' && <CategoriesTab />}
    </div>
  );
}
