import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, Package } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';

interface Product {
  id: string;
  name: string;
  images: string[];
  currency: string;
  vendorId: string;
  vendor: { businessName: string };
}

interface WholesalePricing {
  wholesaleMinQuantity: number;
  wholesalePrice: number;
}

// VENDOR_BACKLOG.md VND-025: "Bulk order form (different from standard
// checkout)." A single-product, single-vendor form -- a Babalawo ordering
// 20 sets of initiation beads for a community ceremony doesn't need the
// multi-vendor cart/checkout flow, just quantity + shipping address.
const BulkOrderView: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [quantity, setQuantity] = useState<number | ''>('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCountry, setShippingCountry] = useState('Nigeria');

  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: ['bulk-order-product', productId],
    queryFn: async () => (await api.get(`/marketplace/products/${productId}`)).data,
    enabled: !!productId,
  });

  const { data: wholesale, isLoading: wholesaleLoading, error: wholesaleError } = useQuery<WholesalePricing>({
    queryKey: ['wholesale-price', productId],
    queryFn: async () => (await api.get(`/marketplace/products/${productId}/wholesale-price`)).data,
    enabled: !!productId,
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!product || !quantity) return;
      return api.post('/marketplace/orders', {
        vendorId: product.vendorId,
        items: [{ productId: product.id, quantity }],
        shippingAddress,
        shippingCountry,
        notes: 'Wholesale bulk order',
      });
    },
    onSuccess: () => {
      toast.success('Bulk order placed');
      navigate('/my-orders');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to place bulk order'),
  });

  const minQty = wholesale?.wholesaleMinQuantity ?? 1;
  const total = wholesale && quantity ? wholesale.wholesalePrice * Number(quantity) : 0;

  if (productLoading || wholesaleLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (wholesaleError || !product || !wholesale) {
    return (
      <div className="text-center py-24">
        <h1 className="text-xl font-bold text-foreground mb-2">Wholesale pricing not available</h1>
        <p className="text-muted-foreground">This product doesn't offer wholesale pricing, or you don't have access to it.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-500 py-6">
      <div>
        <button onClick={() => navigate(`/marketplace/${product.id}`)} className="text-sm font-bold text-muted-foreground hover:text-foreground mb-1">
          ← Back to product
        </button>
        <h1 className="text-3xl font-bold brand-font text-foreground flex items-center gap-2">
          <Package size={28} /> Bulk Order
        </h1>
        <p className="text-muted-foreground">{product.name} · sold by {product.vendor.businessName}</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Wholesale price (per unit)</span>
          <span className="font-bold text-foreground">₦{wholesale.wholesalePrice.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Minimum quantity</span>
          <span className="font-bold text-foreground">{minQty} units</span>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground uppercase tracking-wide">Quantity</label>
          <input
            type="number"
            min={minQty}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
            placeholder={String(minQty)}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground"
          />
          {quantity !== '' && Number(quantity) < minQty && (
            <p className="text-xs font-bold text-red-500">Minimum order is {minQty} units to qualify for wholesale pricing</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground uppercase tracking-wide">Shipping Address</label>
          <textarea
            rows={2}
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground resize-none"
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="font-bold text-foreground">Total</span>
          <span className="text-2xl font-bold text-highlight">₦{total.toLocaleString()}</span>
        </div>

        <button
          type="button"
          onClick={() => submitMutation.mutate()}
          disabled={!quantity || Number(quantity) < minQty || !shippingAddress.trim() || submitMutation.isPending}
          className="w-full py-3 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
          Place Bulk Order
        </button>
      </div>
    </div>
  );
};

export default BulkOrderView;
