import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, TrendingUp, X, Loader2, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';

interface ReturnRequest {
  id: string;
  orderId: string;
  status: string;
  reasonCategory: string;
  reason: string;
  photos: string[];
  offeredRefundAmount?: number | null;
  createdAt: string;
  order: { id: string; totalAmount: number; currency?: string; createdAt: string };
  customer: { id: string; name: string; email: string };
}

interface ReturnAnalytics {
  totalReturns: number;
  returnRateByProduct: Array<{ productId: string; productName: string; returnCount: number; totalOrders: number; returnRate: number }>;
  mostCommonReasons: Array<{ reasonCategory: string; count: number }>;
}

interface VendorReturnsTabProps {
  vendorId: string;
  activeTab: string;
}

const STATUS_OPTIONS = ['REQUESTED', 'ACCEPTED', 'REJECTED', 'PARTIAL_REFUND_OFFERED', 'REFUNDED', 'ESCALATED'];

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'REQUESTED': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
    case 'ACCEPTED': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
    case 'PARTIAL_REFUND_OFFERED': return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400';
    case 'REJECTED': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
    case 'ESCALATED': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
    case 'REFUNDED': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    default: return 'bg-muted text-foreground';
  }
};

// VENDOR_BACKLOG.md VND-010
const VendorReturnsTab: React.FC<VendorReturnsTabProps> = ({ vendorId, activeTab }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const isActive = activeTab === 'returns';
  const [statusFilter, setStatusFilter] = useState('');
  const [respondingTo, setRespondingTo] = useState<ReturnRequest | null>(null);
  const [decision, setDecision] = useState<'ACCEPT' | 'REJECT' | 'PARTIAL_REFUND'>('ACCEPT');
  const [vendorResponse, setVendorResponse] = useState('');
  const [returnAddress, setReturnAddress] = useState('');
  const [offeredRefundAmount, setOfferedRefundAmount] = useState('');

  const { data: returns = [], isLoading } = useQuery<ReturnRequest[]>({
    queryKey: ['vendor-returns', vendorId, statusFilter],
    queryFn: async () =>
      (await api.get(`/marketplace/vendors/${vendorId}/returns`, { params: { status: statusFilter || undefined } })).data,
    enabled: !!vendorId && isActive,
  });

  const { data: analytics } = useQuery<ReturnAnalytics>({
    queryKey: ['vendor-returns-analytics', vendorId],
    queryFn: async () => (await api.get(`/marketplace/vendors/${vendorId}/returns/analytics`)).data,
    enabled: !!vendorId && isActive,
  });

  const respondMutation = useMutation({
    mutationFn: async () => {
      if (!respondingTo) return;
      return api.patch(`/marketplace/returns/${respondingTo.id}/respond`, {
        decision,
        vendorResponse: vendorResponse || undefined,
        returnAddress: decision === 'ACCEPT' ? returnAddress || undefined : undefined,
        offeredRefundAmount: decision === 'PARTIAL_REFUND' ? Number(offeredRefundAmount) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-returns', vendorId] });
      toast.success('Response sent to customer');
      setRespondingTo(null);
      setVendorResponse('');
      setReturnAddress('');
      setOfferedRefundAmount('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to respond'),
  });

  const escalateMutation = useMutation({
    mutationFn: async (returnRequestId: string) =>
      api.post(`/marketplace/returns/${returnRequestId}/escalate`, {
        description: 'Vendor escalated this return request for admin review.',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-returns', vendorId] });
      toast.success('Escalated to admin');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to escalate'),
  });

  if (!isActive) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Returns & Disputes</h2>
        <p className="text-muted-foreground">Respond to return requests and track product return trends</p>
      </div>

      {analytics && analytics.totalReturns > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-muted-foreground" />
            <h3 className="font-bold text-foreground">Return Analytics</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Return rate by product</p>
              <div className="space-y-1">
                {analytics.returnRateByProduct.slice(0, 5).map((p) => (
                  <div key={p.productId} className="flex justify-between text-sm">
                    <span className="text-foreground truncate mr-2">{p.productName}</span>
                    <span className="text-muted-foreground">{(p.returnRate * 100).toFixed(0)}% ({p.returnCount}/{p.totalOrders})</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Most common reasons</p>
              <div className="space-y-1">
                {analytics.mostCommonReasons.map((r) => (
                  <div key={r.reasonCategory} className="flex justify-between text-sm">
                    <span className="text-foreground">{r.reasonCategory.replace(/_/g, ' ')}</span>
                    <span className="text-muted-foreground">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${statusFilter === '' ? 'bg-highlight text-foreground border-highlight' : 'border-border text-muted-foreground hover:bg-muted'}`}
        >
          All
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${statusFilter === s ? 'bg-highlight text-foreground border-highlight' : 'border-border text-muted-foreground hover:bg-muted'}`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : returns.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <RotateCcw className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No return requests</h3>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {returns.map((r) => (
            <div key={r.id} className="p-5 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-bold text-foreground">Order #{r.orderId.slice(0, 8).toUpperCase()}</p>
                  <p className="text-sm text-muted-foreground">{r.customer.name} · {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusBadgeClass(r.status)}`}>
                  {r.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-sm text-foreground"><span className="font-bold">{r.reasonCategory.replace(/_/g, ' ')}:</span> {r.reason}</p>
              {r.photos.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {r.photos.map((p, i) => (
                    <a key={i} href={p} target="_blank" rel="noreferrer" className="text-xs text-highlight hover:underline">
                      Photo {i + 1}
                    </a>
                  ))}
                </div>
              )}
              {r.status === 'REQUESTED' && (
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setRespondingTo(r); setDecision('ACCEPT'); }}
                    className="px-3 py-1.5 bg-highlight text-foreground rounded-lg text-xs font-bold hover:bg-secondary transition-colors"
                  >
                    Respond
                  </button>
                </div>
              )}
              {['REQUESTED', 'ACCEPTED', 'REJECTED', 'PARTIAL_REFUND_OFFERED'].includes(r.status) && (
                <button
                  type="button"
                  onClick={() => escalateMutation.mutate(r.id)}
                  disabled={escalateMutation.isPending}
                  className="px-3 py-1.5 border border-border rounded-lg text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <AlertTriangle size={12} /> Escalate to Admin
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {respondingTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-lg">Respond to Return Request</h3>
              <button onClick={() => setRespondingTo(null)} className="p-1.5 hover:bg-muted rounded-lg"><X size={18} /></button>
            </div>
            <div className="flex gap-2">
              {(['ACCEPT', 'REJECT', 'PARTIAL_REFUND'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDecision(d)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border ${decision === d ? 'bg-highlight text-foreground border-highlight' : 'border-border text-muted-foreground hover:bg-muted'}`}
                >
                  {d.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            {decision === 'ACCEPT' && (
              <input
                type="text"
                placeholder="Return address (required for physical products)"
                value={returnAddress}
                onChange={(e) => setReturnAddress(e.target.value)}
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-foreground text-sm"
              />
            )}
            {decision === 'PARTIAL_REFUND' && (
              <input
                type="number"
                min={0}
                placeholder="Offered refund amount (₦)"
                value={offeredRefundAmount}
                onChange={(e) => setOfferedRefundAmount(e.target.value)}
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-foreground text-sm"
              />
            )}
            <textarea
              rows={3}
              placeholder="Message to customer (optional)"
              value={vendorResponse}
              onChange={(e) => setVendorResponse(e.target.value)}
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-foreground text-sm resize-none"
            />
            <button
              type="button"
              onClick={() => respondMutation.mutate()}
              disabled={
                respondMutation.isPending ||
                (decision === 'PARTIAL_REFUND' && (!offeredRefundAmount || Number(offeredRefundAmount) <= 0))
              }
              className="w-full py-2.5 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {respondMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
              Send Response
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorReturnsTab;
