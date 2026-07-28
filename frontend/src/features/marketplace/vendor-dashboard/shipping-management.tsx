import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, Plus, Trash2, Star, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useToast } from '@/shared/components/toast';

// VENDOR_BACKLOG.md VND-011: vendor-level shipping zone management. Zones
// are vendor-wide (not per-product) for this first pass -- see the schema
// comment on ShippingZone for the scoping rationale.
interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  rateType: 'FREE' | 'FLAT' | 'WEIGHT_BASED';
  flatRate: number;
  perKgRate: number;
  processingTime: string;
  combinedShippingDiscountPct: number;
  isDefault: boolean;
}

interface ShippingManagementProps {
  vendorId: string;
  activeTab: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

const emptyForm = {
  name: '',
  countries: '',
  rateType: 'FLAT' as ShippingZone['rateType'],
  flatRate: '',
  perKgRate: '',
  processingTime: '3-5 business days',
  combinedShippingDiscountPct: '',
  isDefault: false,
};

// VENDOR_BACKLOG.md VND-011: quick-apply templates for the most common zone
// shapes, so a vendor isn't stuck manually typing every country name. Only
// pre-fills name/countries/isDefault (geography, not a business decision) --
// rates are left for the vendor to set themselves, same as a from-scratch zone.
const ZONE_PRESETS: Array<{ label: string; name: string; countries: string[]; isDefault?: boolean }> = [
  { label: 'Nigeria Only', name: 'Nigeria', countries: ['Nigeria'] },
  {
    label: 'West Africa (ECOWAS)',
    name: 'West Africa',
    countries: [
      'Nigeria', 'Ghana', 'Benin', 'Togo', 'Senegal', "Côte d'Ivoire", 'Sierra Leone',
      'Liberia', 'Guinea', 'Gambia', 'Mali', 'Burkina Faso', 'Niger', 'Guinea-Bissau', 'Cape Verde',
    ],
  },
  { label: 'Rest of World', name: 'International', countries: ['Rest of World'], isDefault: true },
];

const ShippingManagement: React.FC<ShippingManagementProps> = ({ vendorId, activeTab }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: zones = [], isLoading } = useQuery<ShippingZone[]>({
    queryKey: ['vendor-shipping-zones', vendorId],
    queryFn: async () => (await api.get(`/marketplace/vendors/${vendorId}/shipping-zones`)).data,
    enabled: !!vendorId && activeTab === 'shipping',
  });

  const createZone = useMutation({
    mutationFn: async () => {
      const countries = form.countries.split(',').map((c) => c.trim()).filter(Boolean);
      await api.post(`/marketplace/vendors/${vendorId}/shipping-zones`, {
        name: form.name,
        countries,
        rateType: form.rateType,
        flatRate: form.rateType === 'FLAT' ? parseFloat(form.flatRate) || 0 : 0,
        perKgRate: form.rateType === 'WEIGHT_BASED' ? parseFloat(form.perKgRate) || 0 : 0,
        processingTime: form.processingTime,
        combinedShippingDiscountPct: parseFloat(form.combinedShippingDiscountPct) || 0,
        isDefault: form.isDefault,
      });
    },
    onSuccess: () => {
      success('Shipping zone created');
      setForm(emptyForm);
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['vendor-shipping-zones', vendorId] });
    },
    onError: (err: any) => {
      toastError(err?.response?.data?.message ?? 'Failed to create shipping zone');
    },
  });

  const deleteZone = useMutation({
    mutationFn: async (zoneId: string) => {
      await api.delete(`/marketplace/vendors/${vendorId}/shipping-zones/${zoneId}`);
    },
    onSuccess: () => {
      success('Shipping zone removed');
      qc.invalidateQueries({ queryKey: ['vendor-shipping-zones', vendorId] });
    },
    onError: () => toastError('Failed to remove shipping zone'),
  });

  if (activeTab !== 'shipping') return null;

  const rateLabel = (zone: ShippingZone) => {
    if (zone.rateType === 'FREE') return 'Free shipping';
    if (zone.rateType === 'FLAT') return `${fmt(zone.flatRate)} flat`;
    return `${fmt(zone.perKgRate)}/kg`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Shipping</h2>
          <p className="text-muted-foreground">Set up rates and processing times for where you ship</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} /> New Zone
        </button>
      </div>

      {!zones.some((z) => z.isDefault) && zones.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <p>No default zone set — orders shipping to a country not covered by any zone below will be quoted ₦0. Mark one zone as default to cover everywhere else.</p>
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck size={16} /> New Shipping Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createZone.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Quick-apply a template</label>
                <div className="flex flex-wrap gap-2">
                  {ZONE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          name: preset.name,
                          countries: preset.countries.join(', '),
                          isDefault: !!preset.isDefault,
                        }))
                      }
                      className="px-3 py-1.5 text-xs font-bold rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Fills in the name and countries below — rates are still yours to set.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Zone Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Nigeria, International"
                    required
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Countries (comma-separated)</label>
                  <input
                    type="text"
                    value={form.countries}
                    onChange={(e) => setForm({ ...form, countries: e.target.value })}
                    placeholder="Nigeria, Ghana"
                    required
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Rate Type</label>
                  <select
                    value={form.rateType}
                    onChange={(e) => setForm({ ...form, rateType: e.target.value as ShippingZone['rateType'] })}
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    <option value="FREE">Free</option>
                    <option value="FLAT">Flat rate</option>
                    <option value="WEIGHT_BASED">Weight-based</option>
                  </select>
                </div>
                {form.rateType === 'FLAT' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Flat Rate (₦)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.flatRate}
                      onChange={(e) => setForm({ ...form, flatRate: e.target.value })}
                      placeholder="1500"
                      className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                )}
                {form.rateType === 'WEIGHT_BASED' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Rate per kg (₦)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.perKgRate}
                      onChange={(e) => setForm({ ...form, perKgRate: e.target.value })}
                      placeholder="200"
                      className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Processing Time</label>
                  <input
                    type="text"
                    value={form.processingTime}
                    onChange={(e) => setForm({ ...form, processingTime: e.target.value })}
                    placeholder="3-5 business days"
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Combined Shipping Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.combinedShippingDiscountPct}
                    onChange={(e) => setForm({ ...form, combinedShippingDiscountPct: e.target.value })}
                    placeholder="0"
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                />
                Use as default zone (covers any country not listed above)
              </label>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={createZone.isPending}
                  className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {createZone.isPending ? 'Saving…' : 'Save Zone'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 bg-muted text-foreground font-semibold rounded-xl hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl" />)}
        </div>
      ) : zones.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
          <Truck className="mx-auto text-muted-foreground mb-3" size={32} />
          <p className="text-muted-foreground">No shipping zones configured yet — orders will use manual/free shipping until you add one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {zones.map((zone) => (
            <Card key={zone.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground">{zone.name}</p>
                    {zone.isDefault && (
                      <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        <Star size={10} /> Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {zone.countries.join(', ')} · {rateLabel(zone)} · {zone.processingTime}
                    {zone.combinedShippingDiscountPct > 0 && ` · ${zone.combinedShippingDiscountPct}% off for 2+ items`}
                  </p>
                </div>
                <button
                  onClick={() => deleteZone.mutate(zone.id)}
                  disabled={deleteZone.isPending}
                  className="p-2 text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50"
                  aria-label={`Delete ${zone.name} zone`}
                >
                  <Trash2 size={16} />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShippingManagement;
