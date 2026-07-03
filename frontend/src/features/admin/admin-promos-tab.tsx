import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

const fmt = new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' });

const PROMO_TYPES = [
  { value: 'PCT_SUBSCRIPTION', label: '% off Devoted subscription' },
  { value: 'FIXED_CONSULTATION', label: '₦ off consultation' },
  { value: 'FREE_TRIAL_DAYS', label: 'Free trial days' },
  { value: 'REFERRAL_CREDIT', label: 'Referral credit (₦)' },
];

interface PromoCode {
  id: string;
  code: string;
  type: string;
  value: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  eligibleRoles: string[];
  isActive: boolean;
  createdAt: string;
  creator: { id: string; name: string };
  _count: { redemptions: number };
}

function CreateModal({ onClose, onCreate, isPending }: {
  onClose: () => void;
  onCreate: (d: { code: string; type: string; value: number; maxUses?: number; expiresAt?: string; eligibleRoles: string[] }) => void;
  isPending: boolean;
}) {
  const [code, setCode] = useState('');
  const [type, setType] = useState('PCT_SUBSCRIPTION');
  const [value, setValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
        <h3 className="font-semibold text-lg flex items-center gap-2"><Tag className="w-5 h-5" /> Create Promo Code</h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Code</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ISESE2026"
              className="w-full border border-border rounded px-3 py-2 text-sm bg-card text-foreground font-mono uppercase" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              className="w-full border border-border rounded px-3 py-2 text-sm bg-card text-foreground">
              {PROMO_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {type === 'PCT_SUBSCRIPTION' ? 'Discount %' : type === 'FREE_TRIAL_DAYS' ? 'Days' : 'Amount (₦)'}
            </label>
            <input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)}
              placeholder={type === 'PCT_SUBSCRIPTION' ? '20' : '2000'}
              className="w-full border border-border rounded px-3 py-2 text-sm bg-card text-foreground" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Max uses (blank = unlimited)</label>
            <input type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)}
              placeholder="100"
              className="w-full border border-border rounded px-3 py-2 text-sm bg-card text-foreground" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Expiry date (optional)</label>
          <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full border border-border rounded px-3 py-2 text-sm bg-card text-foreground" />
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded hover:bg-highlight">Cancel</button>
          <button
            type="button"
            onClick={() => onCreate({
              code, type, value: parseFloat(value),
              maxUses: maxUses ? parseInt(maxUses) : undefined,
              expiresAt: expiresAt || undefined,
              eligibleRoles: [],
            })}
            disabled={isPending || !code.trim() || !value}
            className="px-4 py-2 text-sm bg-foreground text-background rounded hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? 'Creating…' : 'Create Code'}
          </button>
        </div>
      </div>
    </div>
  );
}

function typeLabel(type: string, value: number): string {
  switch (type) {
    case 'PCT_SUBSCRIPTION': return `${value}% off subscription`;
    case 'FIXED_CONSULTATION': return `₦${value.toLocaleString()} off consultation`;
    case 'FREE_TRIAL_DAYS': return `${value} free trial days`;
    case 'REFERRAL_CREDIT': return `₦${value.toLocaleString()} referral credit`;
    default: return `${value}`;
  }
}

export function AdminPromosTab() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const { data: promos = [], isLoading } = useQuery<PromoCode[]>({
    queryKey: ['admin', 'promos', showInactive],
    queryFn: () => api.get('/admin/promos', { params: { includeInactive: showInactive } }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: { code: string; type: string; value: number; maxUses?: number; expiresAt?: string; eligibleRoles: string[] }) =>
      api.post('/admin/promos', d).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'promos'] }); setShowCreate(false); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/promos/${id}`, { isActive }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'promos'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/promos/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'promos'] }),
  });

  return (
    <div className="space-y-6">
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={(d) => createMutation.mutate(d)}
          isPending={createMutation.isPending}
        />
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Tag className="w-5 h-5" /> Promo Codes</h2>
          <p className="text-sm text-muted-foreground mt-1">Create and manage discount codes for subscriptions and consultations.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowInactive((v) => !v)}
            className={`px-3 py-2 text-sm border rounded ${showInactive ? 'border-foreground bg-highlight' : 'border-border text-muted-foreground'}`}
          >
            {showInactive ? 'Showing all' : 'Active only'}
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-foreground text-background rounded hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> New Code
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-center text-sm text-muted-foreground py-12">Loading…</p>
      ) : !promos.length ? (
        <div className="border border-border rounded-lg px-4 py-12 text-center">
          <Tag className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="font-medium">No promo codes</p>
          <p className="text-sm text-muted-foreground">Create your first discount code above.</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          {promos.map((p) => (
            <div key={p.id} className={`flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 ${!p.isActive ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-sm">{p.code}</span>
                  {p.expiresAt && new Date(p.expiresAt) < new Date() && (
                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Expired</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {typeLabel(p.type, p.value)}
                  {' · '}{p._count.redemptions} redeemed{p.maxUses ? ` / ${p.maxUses} max` : ''}
                  {p.expiresAt && ` · expires ${fmt.format(new Date(p.expiresAt))}`}
                  {' · by '}{p.creator.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleMutation.mutate({ id: p.id, isActive: !p.isActive })}
                disabled={toggleMutation.isPending}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={p.isActive ? 'Deactivate' : 'Activate'}
              >
                {p.isActive ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(p.id)}
                disabled={deleteMutation.isPending}
                className="text-muted-foreground hover:text-red-600 transition-colors"
                aria-label="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
