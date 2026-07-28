import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Settings, Save, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';
import { Switch } from '@/shared/components/ui/switch';

interface PlatformSettings {
  consultationCommissionPct: number;
  marketplaceCommissionPct: number;
  minPayoutThresholdNgn: number;
  maxPayoutWithoutApprovalNgn: number;
  quizPassThreshold: number;
  // ILUASE_V1_BACKLOG.md 🔴 Critical fix: real field, replacing a fabricated
  // "placeholder calculation" in the revenue forecast. Nullable -- null
  // means an admin hasn't entered a real figure yet.
  platformCostNgn: number | null;
  // ADM-030: enforced by MaintenanceModeMiddleware (backend/src/middleware) --
  // blocks all non-admin/auth/health/metrics traffic with a 503 while on.
  maintenanceMode: boolean;
}

type SliderFieldDef = {
  type: 'slider';
  key: keyof PlatformSettings;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
};

type ToggleFieldDef = {
  type: 'toggle';
  key: keyof PlatformSettings;
  label: string;
  description: string;
};

const FIELDS: SliderFieldDef[] = [
  { type: 'slider', key: 'consultationCommissionPct', label: 'Consultation Commission', description: 'Platform fee on each consultation booking', min: 0, max: 50, step: 0.5, suffix: '%' },
  { type: 'slider', key: 'marketplaceCommissionPct', label: 'Marketplace Commission', description: 'Platform fee on each product sale', min: 0, max: 50, step: 0.5, suffix: '%' },
  { type: 'slider', key: 'minPayoutThresholdNgn', label: 'Minimum Payout', description: 'Practitioners must reach this balance before withdrawing', min: 0, max: 100000, step: 500, suffix: '₦' },
  { type: 'slider', key: 'maxPayoutWithoutApprovalNgn', label: 'Auto-Approve Payout Limit', description: 'Payouts above this require FINANCE admin approval', min: 0, max: 5000000, step: 10000, suffix: '₦' },
  { type: 'slider', key: 'quizPassThreshold', label: 'Cultural Quiz Pass Threshold', description: 'Correct answers needed to pass the orientation gate', min: 1, max: 10, step: 1, suffix: ' correct' },
  { type: 'slider', key: 'platformCostNgn', label: 'Monthly Operating Cost', description: 'Used for break-even projections in Revenue Forecasting. Leave at 0 until you have a real figure -- forecasting stays honestly "not tracked" until this is set above 0.', min: 0, max: 50000000, step: 50000, suffix: '₦' },
];

const TOGGLE_FIELDS: ToggleFieldDef[] = [
  { type: 'toggle', key: 'maintenanceMode', label: 'Maintenance Mode', description: 'Blocks all public traffic with a 503 while on. Admin dashboard, login, health checks, and metrics stay reachable so you can keep working and infra monitoring stays quiet.' },
];

export default function AdminPlatformSettingsTab() {
  const { success, error } = useToast();
  const [form, setForm] = useState<Partial<PlatformSettings>>({});
  const [dirty, setDirty] = useState(false);

  const { data, isLoading } = useQuery<PlatformSettings>({
    queryKey: ['admin', 'platform-settings'],
    queryFn: () => api.get('/admin/platform-settings').then(r => r.data),
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: () => api.patch('/admin/platform-settings', form),
    onSuccess: () => { success('Settings saved'); setDirty(false); },
    onError: () => error('Failed to save settings'),
  });

  const handleChange = (key: keyof PlatformSettings, value: number | boolean) => {
    setForm(f => ({ ...f, [key]: value }));
    setDirty(true);
  };

  if (isLoading) return <div className="text-sm text-muted-foreground p-4">Loading settings…</div>;

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-base font-semibold text-foreground">Platform Settings</h3>
          </div>
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={!dirty || save.isPending}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {save.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        {form.maintenanceMode && (
          <div className="flex items-start gap-2 mb-6 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>Maintenance mode is currently ON — the public platform is returning 503s to everyone except admins.</span>
          </div>
        )}

        <div className="space-y-8">
          {FIELDS.map(field => {
            const val = form[field.key] ?? 0;
            return (
              <div key={field.key}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <label htmlFor={field.key} className="text-sm font-medium text-foreground">{field.label}</label>
                    <p className="text-xs text-muted-foreground mt-0.5">{field.description}</p>
                  </div>
                  <span className="text-lg font-bold text-primary tabular-nums">
                    {field.suffix === '%' ? `${val}%` : field.suffix === '₦' ? `₦${Number(val).toLocaleString()}` : `${val}${field.suffix}`}
                  </span>
                </div>
                <input
                  id={field.key}
                  type="range"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={Number(val)}
                  onChange={e => handleChange(field.key, Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                  <span>{field.suffix === '₦' ? `₦${field.min.toLocaleString()}` : `${field.min}${field.suffix}`}</span>
                  <span>{field.suffix === '₦' ? `₦${field.max.toLocaleString()}` : `${field.max}${field.suffix}`}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4 mt-8 pt-6 border-t border-border">
          {TOGGLE_FIELDS.map(field => (
            <div key={field.key} className="flex items-center justify-between gap-4">
              <div>
                <label htmlFor={field.key} className="text-sm font-medium text-foreground">{field.label}</label>
                <p className="text-xs text-muted-foreground mt-0.5">{field.description}</p>
              </div>
              <Switch
                id={field.key}
                checked={!!form[field.key]}
                onCheckedChange={(checked) => handleChange(field.key, checked)}
              />
            </div>
          ))}
        </div>

        {dirty && (
          <p className="mt-4 text-xs text-yellow-500">You have unsaved changes.</p>
        )}
      </div>
    </div>
  );
}
