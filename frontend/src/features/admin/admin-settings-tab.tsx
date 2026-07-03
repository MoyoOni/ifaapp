import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Loader2, AlertCircle, Save, RefreshCw, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { useToast } from '@/shared/components/toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlatformSettings {
  id: string;
  consultationCommissionPct: number;
  marketplaceCommissionPct: number;
  minPayoutThresholdNgn: number;
  maxPayoutWithoutApprovalNgn: number;
  updatedAt: string;
  updatedBy: string | null;
}

// ─── Setting Field ────────────────────────────────────────────────────────────

const SettingField: React.FC<{
  label: string;
  description: string;
  value: string;
  suffix: string;
  onChange: (v: string) => void;
  dirty: boolean;
}> = ({ label, description, value, suffix, onChange, dirty }) => (
  <div className={`bg-card border rounded-xl p-5 transition-colors ${dirty ? 'border-highlight/50' : 'border-border'}`}>
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground text-sm">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-28 text-sm h-9 text-right"
          min={0}
          step={suffix === '%' ? 0.5 : 1000}
        />
        <span className="text-sm text-muted-foreground w-6">{suffix}</span>
      </div>
    </div>
    {dirty && (
      <p className="text-xs text-highlight mt-2 font-medium">Unsaved change</p>
    )}
  </div>
);

// ─── Main Tab ─────────────────────────────────────────────────────────────────

const AdminSettingsTab: React.FC = () => {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();

  const { data: settings, isLoading, isError } = useQuery<PlatformSettings>({
    queryKey: ['admin', 'platform-settings'],
    queryFn: () => api.get('/admin/platform-settings').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const [consultPct, setConsultPct] = useState('');
  const [marketplacePct, setMarketplacePct] = useState('');
  const [minPayout, setMinPayout] = useState('');
  const [maxPayout, setMaxPayout] = useState('');

  useEffect(() => {
    if (settings) {
      setConsultPct(settings.consultationCommissionPct.toString());
      setMarketplacePct(settings.marketplaceCommissionPct.toString());
      setMinPayout(settings.minPayoutThresholdNgn.toString());
      setMaxPayout(settings.maxPayoutWithoutApprovalNgn.toString());
    }
  }, [settings]);

  const isDirty = settings
    ? consultPct !== settings.consultationCommissionPct.toString()
      || marketplacePct !== settings.marketplaceCommissionPct.toString()
      || minPayout !== settings.minPayoutThresholdNgn.toString()
      || maxPayout !== settings.maxPayoutWithoutApprovalNgn.toString()
    : false;

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: () =>
      api.patch('/admin/platform-settings', {
        consultationCommissionPct: parseFloat(consultPct),
        marketplaceCommissionPct: parseFloat(marketplacePct),
        minPayoutThresholdNgn: parseFloat(minPayout),
        maxPayoutWithoutApprovalNgn: parseFloat(maxPayout),
      }),
    onSuccess: () => {
      success('Platform settings saved');
      qc.invalidateQueries({ queryKey: ['admin', 'platform-settings'] });
    },
    onError: (err: any) => toastError(err?.response?.data?.message ?? 'Save failed'),
  });

  const reset = () => {
    if (settings) {
      setConsultPct(settings.consultationCommissionPct.toString());
      setMarketplacePct(settings.marketplaceCommissionPct.toString());
      setMinPayout(settings.minPayoutThresholdNgn.toString());
      setMaxPayout(settings.maxPayoutWithoutApprovalNgn.toString());
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
        <Loader2 size={28} className="mx-auto mb-3 animate-spin opacity-50" />
        Loading settings…
      </div>
    );
  }

  if (isError || !settings) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <AlertCircle size={28} className="mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground text-sm">Could not load platform settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Settings size={18} className="text-muted-foreground" />
            Platform Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Commission rates and payout thresholds — changes apply to new transactions immediately
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {isDirty && (
            <Button variant="outline" size="sm" onClick={reset} disabled={saving}>
              <RefreshCw size={14} className="mr-1.5" />
              Reset
            </Button>
          )}
          <Button
            size="sm"
            disabled={!isDirty || saving}
            onClick={() => save()}
            className="bg-highlight hover:bg-highlight/90 text-white"
          >
            {saving
              ? <Loader2 size={14} className="mr-1.5 animate-spin" />
              : <Save size={14} className="mr-1.5" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Last updated */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle size={12} />
        Last saved {new Date(settings.updatedAt).toLocaleString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })}
      </div>

      {/* Commission */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Commission Rates</p>
        <div className="space-y-3">
          <SettingField
            label="Consultation commission"
            description="Platform cut on every completed consultation payout to a Babaláwo"
            value={consultPct}
            suffix="%"
            onChange={setConsultPct}
            dirty={consultPct !== settings.consultationCommissionPct.toString()}
          />
          <SettingField
            label="Marketplace commission"
            description="Platform cut on every marketplace order payout to a vendor"
            value={marketplacePct}
            suffix="%"
            onChange={setMarketplacePct}
            dirty={marketplacePct !== settings.marketplaceCommissionPct.toString()}
          />
        </div>
      </div>

      {/* Payout thresholds */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Payout Thresholds</p>
        <div className="space-y-3">
          <SettingField
            label="Minimum payout threshold"
            description="Practitioners and vendors must reach this balance before a payout can be requested"
            value={minPayout}
            suffix="₦"
            onChange={setMinPayout}
            dirty={minPayout !== settings.minPayoutThresholdNgn.toString()}
          />
          <SettingField
            label="Max payout without FINANCE approval"
            description="Single payout requests above this amount are held for a FINANCE admin to approve"
            value={maxPayout}
            suffix="₦"
            onChange={setMaxPayout}
            dirty={maxPayout !== settings.maxPayoutWithoutApprovalNgn.toString()}
          />
        </div>
      </div>

      {/* Info callout */}
      <div className="bg-card border border-border rounded-xl p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground text-sm">How these settings are applied</p>
        <p>Commission percentages are deducted at payout time, not at transaction time. A Babaláwo who earns ₦10,000 for a consultation will receive ₦{(10000 * (1 - parseFloat(consultPct || '15') / 100)).toLocaleString('en-NG')} after the {consultPct || '15'}% platform fee.</p>
        <p>Payout threshold changes take effect on the next payout request — existing pending payouts are not affected.</p>
      </div>
    </div>
  );
};

export default AdminSettingsTab;
