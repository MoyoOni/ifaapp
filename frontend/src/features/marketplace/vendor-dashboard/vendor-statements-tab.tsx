import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileDown, Receipt, Calculator, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';

interface TaxSummary {
  year: number;
  totalGrossSales: number;
  totalCommission: number;
  commissionNote: string;
  totalRefunds: number;
  netRevenue: number;
  vatRegistered: boolean;
  vatNumber: string | null;
}

interface VendorStatementsTabProps {
  vendorId: string;
  activeTab: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// VENDOR_BACKLOG.md VND-003
const VendorStatementsTab: React.FC<VendorStatementsTabProps> = ({ vendorId, activeTab }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const isActive = activeTab === 'statements';
  const now = new Date();
  const [statementYear, setStatementYear] = useState(now.getFullYear());
  const [statementMonth, setStatementMonth] = useState(now.getMonth() + 1);
  const [taxYear, setTaxYear] = useState(now.getFullYear());
  const [vatRegistered, setVatRegistered] = useState(false);
  const [vatNumber, setVatNumber] = useState('');

  const { data: taxSummary, isLoading: taxLoading } = useQuery<TaxSummary>({
    queryKey: ['vendor-tax-summary', vendorId, taxYear],
    queryFn: async () => (await api.get(`/marketplace/vendors/${vendorId}/tax-summary/${taxYear}`)).data,
    enabled: !!vendorId && isActive,
  });

  useEffect(() => {
    if (taxSummary) {
      setVatRegistered(taxSummary.vatRegistered);
      setVatNumber(taxSummary.vatNumber ?? '');
    }
  }, [taxSummary]);

  const statementMutation = useMutation({
    mutationFn: async () => {
      const res = await api.get(`/marketplace/vendors/${vendorId}/statements/${statementYear}/${statementMonth}`, {
        responseType: 'blob',
      });
      return res.data as Blob;
    },
    onSuccess: (blob) => downloadBlob(blob, `statement-${statementYear}-${statementMonth}.pdf`),
    onError: () => toast.error('Failed to generate statement'),
  });

  const csvMutation = useMutation({
    mutationFn: async () => {
      const res = await api.get(`/marketplace/vendors/${vendorId}/tax-summary/${taxYear}/csv`, { responseType: 'blob' });
      return res.data as Blob;
    },
    onSuccess: (blob) => downloadBlob(blob, `tax-summary-${taxYear}.csv`),
    onError: () => toast.error('Failed to generate CSV'),
  });

  const vatMutation = useMutation({
    mutationFn: async () => api.patch(`/marketplace/vendors/${vendorId}`, { vatRegistered, vatNumber: vatNumber || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-tax-summary', vendorId, taxYear] });
      toast.success('VAT details saved');
    },
    onError: () => toast.error('Failed to save VAT details'),
  });

  if (!isActive) return null;

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Financial Statements</h2>
        <p className="text-muted-foreground">Monthly statements, per-order invoices, and annual tax summaries</p>
      </div>

      {/* Monthly Statement */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Receipt size={16} /> Monthly Statement</h3>
        <div className="flex flex-wrap gap-2 items-center">
          <select value={statementMonth} onChange={(e) => setStatementMonth(Number(e.target.value))} className="px-3 py-2 bg-muted/50 border border-border rounded-lg text-foreground text-sm">
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select value={statementYear} onChange={(e) => setStatementYear(Number(e.target.value))} className="px-3 py-2 bg-muted/50 border border-border rounded-lg text-foreground text-sm">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            type="button"
            onClick={() => statementMutation.mutate()}
            disabled={statementMutation.isPending}
            className="px-4 py-2 bg-highlight text-foreground rounded-lg text-sm font-bold hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {statementMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
            Download PDF
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Includes all orders, refunds, and net earnings for the selected month.</p>
      </div>

      {/* Tax Summary */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Calculator size={16} /> Annual Tax Summary</h3>
        <select value={taxYear} onChange={(e) => setTaxYear(Number(e.target.value))} className="px-3 py-2 bg-muted/50 border border-border rounded-lg text-foreground text-sm">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>

        {taxLoading ? (
          <Loader2 size={18} className="animate-spin text-muted-foreground" />
        ) : taxSummary ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total gross sales</span><span className="font-bold text-foreground">₦{taxSummary.totalGrossSales.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total refunds</span><span className="font-bold text-foreground">₦{taxSummary.totalRefunds.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Net revenue</span><span className="font-bold text-foreground">₦{taxSummary.netRevenue.toLocaleString()}</span></div>
            <p className="text-xs text-muted-foreground pt-1">{taxSummary.commissionNote}</p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => csvMutation.mutate()}
          disabled={csvMutation.isPending}
          className="px-4 py-2 border border-border rounded-lg text-sm font-bold hover:bg-muted transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {csvMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
          Export CSV
        </button>

        <div className="pt-3 border-t border-border space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-foreground">
            <input type="checkbox" checked={vatRegistered} onChange={(e) => setVatRegistered(e.target.checked)} />
            VAT registered
          </label>
          {vatRegistered && (
            <input
              type="text"
              placeholder="VAT number"
              value={vatNumber}
              onChange={(e) => setVatNumber(e.target.value)}
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-foreground text-sm"
            />
          )}
          <button
            type="button"
            onClick={() => vatMutation.mutate()}
            disabled={vatMutation.isPending}
            className="px-3 py-1.5 bg-highlight text-foreground rounded-lg text-xs font-bold hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {vatMutation.isPending ? 'Saving...' : 'Save VAT Details'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorStatementsTab;
