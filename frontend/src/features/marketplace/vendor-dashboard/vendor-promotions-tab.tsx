import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Plus, X, Loader2, Pause, Play, StopCircle } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';

interface Promotion {
  id: string;
  type: string;
  name: string;
  code: string | null;
  discountType: string;
  value: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  totalDiscountGiven: number;
}

interface VendorPromotionsTabProps {
  vendorId: string;
  activeTab: string;
}

const TYPE_OPTIONS = [
  { value: 'DISCOUNT_CODE', label: 'Discount Code' },
  { value: 'FLASH_SALE', label: 'Flash Sale' },
  { value: 'VOLUME_DISCOUNT', label: 'Volume Discount (Buy 2+)' },
  { value: 'BUNDLE_DEAL', label: 'Bundle Deal (Buy A + B)' },
  { value: 'WELCOME_DISCOUNT', label: 'Welcome Discount (first-time buyers)' },
];

const TYPE_LABEL: Record<string, string> = Object.fromEntries(TYPE_OPTIONS.map((t) => [t.value, t.label]));

// VENDOR_BACKLOG.md VND-020
const VendorPromotionsTab: React.FC<VendorPromotionsTabProps> = ({ vendorId, activeTab }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const isActive = activeTab === 'promotions';
  const [statusFilter, setStatusFilter] = useState<'active' | 'expired' | 'all'>('active');
  const [showForm, setShowForm] = useState(false);

  const [type, setType] = useState('DISCOUNT_CODE');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [value, setValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [productId, setProductId] = useState('');
  const [bundleProductId, setBundleProductId] = useState('');
  const [minQuantity, setMinQuantity] = useState('2');

  const { data: promotions = [], isLoading } = useQuery<Promotion[]>({
    queryKey: ['vendor-promotions', vendorId, statusFilter],
    queryFn: async () => (await api.get(`/marketplace/vendors/${vendorId}/promotions`, { params: { status: statusFilter } })).data,
    enabled: !!vendorId && isActive,
  });

  const { data: products = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ['vendor-own-products-for-promo', vendorId],
    queryFn: async () => (await api.get('/marketplace/products', { params: { vendorId } })).data,
    enabled: !!vendorId && isActive && showForm,
  });

  const resetForm = () => {
    setType('DISCOUNT_CODE'); setName(''); setCode(''); setDiscountType('PERCENTAGE');
    setValue(''); setMaxUses(''); setExpiresAt(''); setProductId(''); setBundleProductId(''); setMinQuantity('2');
  };

  const createMutation = useMutation({
    mutationFn: async () => api.post(`/marketplace/vendors/${vendorId}/promotions`, {
      type,
      name,
      code: type === 'DISCOUNT_CODE' ? code : undefined,
      discountType,
      value: Number(value),
      maxUses: maxUses ? Number(maxUses) : undefined,
      expiresAt: expiresAt || undefined,
      productId: ['FLASH_SALE', 'VOLUME_DISCOUNT', 'BUNDLE_DEAL'].includes(type) ? productId || undefined : undefined,
      bundleProductId: type === 'BUNDLE_DEAL' ? bundleProductId || undefined : undefined,
      minQuantity: type === 'VOLUME_DISCOUNT' ? Number(minQuantity) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-promotions', vendorId] });
      toast.success('Promotion created');
      setShowForm(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create promotion'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive: next }: { id: string; isActive: boolean }) =>
      api.patch(`/marketplace/promotions/${id}`, { isActive: next }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-promotions', vendorId] });
      toast.success('Promotion updated');
    },
    onError: () => toast.error('Failed to update promotion'),
  });

  const endMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/marketplace/promotions/${id}/end`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-promotions', vendorId] });
      toast.success('Promotion ended');
    },
    onError: () => toast.error('Failed to end promotion'),
  });

  if (!isActive) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Promotions</h2>
          <p className="text-muted-foreground">Run discount codes, flash sales, and more without admin involvement</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-highlight text-foreground rounded-xl text-sm font-bold hover:bg-secondary transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> New Promotion
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground">New Promotion</h3>
            <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-muted rounded-lg"><X size={16} /></button>
          </div>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-foreground text-sm">
            {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input type="text" placeholder="Promotion name (internal, e.g. Isese Day Sale)" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-foreground text-sm" />

          {type === 'DISCOUNT_CODE' && (
            <input type="text" placeholder="Code (e.g. ISESE10)" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-foreground text-sm" />
          )}

          {['FLASH_SALE', 'VOLUME_DISCOUNT', 'BUNDLE_DEAL'].includes(type) && (
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-foreground text-sm">
              <option value="">{type === 'VOLUME_DISCOUNT' ? 'All products (optional)' : 'Select product...'}</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          {type === 'BUNDLE_DEAL' && (
            <select value={bundleProductId} onChange={(e) => setBundleProductId(e.target.value)} className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-foreground text-sm">
              <option value="">Select second product...</option>
              {products.filter((p) => p.id !== productId).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          {type === 'VOLUME_DISCOUNT' && (
            <input type="number" min={2} placeholder="Minimum quantity" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-foreground text-sm" />
          )}

          <div className="flex gap-2">
            <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className="flex-1 px-3 py-2 bg-muted/50 border border-border rounded-lg text-foreground text-sm">
              <option value="PERCENTAGE">% off</option>
              <option value="FIXED_AMOUNT">₦ off</option>
            </select>
            <input type="number" min={0} placeholder="Value" value={value} onChange={(e) => setValue(e.target.value)} className="flex-1 px-3 py-2 bg-muted/50 border border-border rounded-lg text-foreground text-sm" />
          </div>
          <div className="flex gap-2">
            <input type="number" min={1} placeholder="Max uses (optional)" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="flex-1 px-3 py-2 bg-muted/50 border border-border rounded-lg text-foreground text-sm" />
            <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="flex-1 px-3 py-2 bg-muted/50 border border-border rounded-lg text-foreground text-sm" />
          </div>

          <button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !name || !value || (type === 'DISCOUNT_CODE' && !code)}
            className="w-full py-2.5 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            Create Promotion
          </button>
        </div>
      )}

      <div className="flex gap-2">
        {(['active', 'expired', 'all'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border capitalize ${statusFilter === s ? 'bg-highlight text-foreground border-highlight' : 'border-border text-muted-foreground hover:bg-muted'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      ) : promotions.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <Tag className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No promotions {statusFilter === 'all' ? 'yet' : `${statusFilter}`}</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {promotions.map((p) => (
            <div key={p.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="font-bold text-foreground">
                  {p.name} {p.code && <span className="ml-1 px-1.5 py-0.5 bg-muted rounded text-xs font-mono">{p.code}</span>}
                </p>
                <p className="text-sm text-muted-foreground">
                  {TYPE_LABEL[p.type]} · {p.discountType === 'PERCENTAGE' ? `${p.value}% off` : `₦${p.value.toLocaleString()} off`} ·
                  {' '}{p.usedCount}{p.maxUses ? `/${p.maxUses}` : ''} uses · ₦{p.totalDiscountGiven.toLocaleString()} given
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleActiveMutation.mutate({ id: p.id, isActive: !p.isActive })}
                  disabled={toggleActiveMutation.isPending}
                  className="px-3 py-1.5 border border-border rounded-lg text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1"
                >
                  {p.isActive ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Resume</>}
                </button>
                {p.isActive && (
                  <button
                    type="button"
                    onClick={() => endMutation.mutate(p.id)}
                    disabled={endMutation.isPending}
                    className="px-3 py-1.5 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-1"
                  >
                    <StopCircle size={12} /> End
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorPromotionsTab;
