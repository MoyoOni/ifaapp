import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RotateCcw, RefreshCw, AlertTriangle, CheckCircle, XCircle,
  ChevronDown, ChevronUp, ShoppingBag, Calendar,
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { useToast } from '@/shared/components/toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RefundRequest {
  id: string;
  requestedBy: string;
  orderId?: string;
  appointmentId?: string;
  amount?: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  adminNote?: string;
  approvedAmount?: number;
  processedAt?: string;
  createdAt: string;
  requester: { id: string; name: string; email: string; avatar?: string };
  processor?: { id: string; name: string };
}

type FilterStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: 'NGN',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);

const statusConfig: Record<string, { label: string; variant: 'destructive' | 'secondary' | 'outline'; icon: React.ElementType }> = {
  PENDING: { label: 'Pending', variant: 'secondary', icon: RefreshCw },
  APPROVED: { label: 'Approved', variant: 'outline', icon: CheckCircle },
  REJECTED: { label: 'Rejected', variant: 'destructive', icon: XCircle },
  CANCELLED: { label: 'Cancelled', variant: 'outline', icon: XCircle },
};

// ─── Row component ────────────────────────────────────────────────────────────

const RefundRow: React.FC<{
  req: RefundRequest;
  onProcess: (id: string, action: 'approve' | 'reject', amount?: number, note?: string) => void;
  processing: boolean;
}> = ({ req, onProcess, processing }) => {
  const [expanded, setExpanded] = useState(false);
  const [approveAmount, setApproveAmount] = useState(req.amount?.toString() ?? '');
  const [adminNote, setAdminNote] = useState('');
  const cfg = statusConfig[req.status] ?? statusConfig.PENDING;
  const StatusIcon = cfg.icon;

  return (
    <div className={`border rounded-xl overflow-hidden ${req.status === 'PENDING' ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-border bg-background'}`}>
      {/* Summary row */}
      <button
        type="button"
        className="w-full text-left p-4 flex items-start gap-4"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 overflow-hidden">
          {req.requester.avatar
            ? <img src={req.requester.avatar} alt="" className="w-full h-full object-cover" />
            : req.requester.name.charAt(0).toUpperCase()}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground text-sm">{req.requester.name}</span>
            <Badge variant={cfg.variant} className="text-xs flex items-center gap-1">
              <StatusIcon size={10} />
              {cfg.label}
            </Badge>
            {req.orderId && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <ShoppingBag size={10} /> Order
              </span>
            )}
            {req.appointmentId && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar size={10} /> Consultation
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{req.reason}</p>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
            <span>{req.amount != null ? fmt(req.amount) : 'Full refund'}</span>
            <span>·</span>
            <span>{new Date(req.createdAt).toLocaleDateString()}</span>
            {req.approvedAmount != null && (
              <>
                <span>·</span>
                <span className="text-green-600 font-medium">Approved: {fmt(req.approvedAmount)}</span>
              </>
            )}
          </div>
        </div>

        {/* Expand icon */}
        <div className="shrink-0 text-muted-foreground mt-1">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-4 bg-card">
          {/* Request info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Requester</p>
              <p className="font-medium text-foreground">{req.requester.name}</p>
              <p className="text-xs text-muted-foreground">{req.requester.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Reference</p>
              {req.orderId && <p className="font-mono text-xs text-foreground truncate">{req.orderId}</p>}
              {req.appointmentId && <p className="font-mono text-xs text-foreground truncate">{req.appointmentId}</p>}
              {!req.orderId && !req.appointmentId && <p className="text-muted-foreground text-xs">—</p>}
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Reason</p>
              <p className="text-foreground">{req.reason}</p>
            </div>
            {req.adminNote && (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Admin Note</p>
                <p className="text-foreground">{req.adminNote}</p>
              </div>
            )}
            {req.processor && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Processed by</p>
                <p className="text-foreground">{req.processor.name}</p>
              </div>
            )}
          </div>

          {/* Action panel — only for PENDING */}
          {req.status === 'PENDING' && (
            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Process Request</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Approved amount (₦)</label>
                  <Input
                    type="number"
                    value={approveAmount}
                    onChange={e => setApproveAmount(e.target.value)}
                    placeholder={req.amount != null ? req.amount.toString() : 'Full amount'}
                    className="text-sm h-8"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Note to client (optional)</label>
                  <Input
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                    placeholder="Reason or instructions…"
                    className="text-sm h-8"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={processing}
                  onClick={() => onProcess(
                    req.id, 'approve',
                    approveAmount ? parseFloat(approveAmount) : undefined,
                    adminNote || undefined,
                  )}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle size={14} className="mr-1.5" />
                  Approve Refund
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={processing}
                  onClick={() => onProcess(req.id, 'reject', undefined, adminNote || undefined)}
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <XCircle size={14} className="mr-1.5" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Tab ─────────────────────────────────────────────────────────────────

const AdminRefundsTab: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('PENDING');
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();

  const { data: requests = [], isLoading, refetch, isFetching } = useQuery<RefundRequest[]>({
    queryKey: ['admin', 'refund-requests', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const res = await api.get(`/admin/refund-requests${params}`);
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const { mutate: processRequest, isPending: processing } = useMutation({
    mutationFn: async ({ id, action, approvedAmount, adminNote }: {
      id: string; action: 'approve' | 'reject'; approvedAmount?: number; adminNote?: string;
    }) => {
      const res = await api.post(`/admin/refund-requests/${id}/process`, { action, approvedAmount, adminNote });
      return res.data;
    },
    onSuccess: (_, { action }) => {
      success(action === 'approve' ? 'Refund approved' : 'Refund request rejected');
      qc.invalidateQueries({ queryKey: ['admin', 'refund-requests'] });
    },
    onError: (err: any) => toastError(err?.response?.data?.message ?? 'Action failed'),
  });

  const counts = {
    ALL: requests.length,
    PENDING: requests.filter(r => r.status === 'PENDING').length,
    APPROVED: requests.filter(r => r.status === 'APPROVED').length,
    REJECTED: requests.filter(r => r.status === 'REJECTED').length,
  };

  // When viewing ALL, respect the current filter for display
  const visible = statusFilter === 'ALL' ? requests : requests;

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
        <RefreshCw size={28} className="mx-auto mb-3 animate-spin opacity-50" />
        Loading refund requests…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <RotateCcw size={18} className="text-muted-foreground" />
            Refund Management
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Review and process client refund requests</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw size={14} className={`mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['PENDING', 'ALL', 'APPROVED', 'REJECTED'] as FilterStatus[]).map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === f
                ? 'bg-highlight text-white'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            <span className={`ml-1.5 text-xs ${statusFilter === f ? 'opacity-80' : 'text-muted-foreground'}`}>
              {f === 'ALL'
                ? requests.length
                : requests.filter(r => r.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {/* Pending alert */}
      {counts.PENDING > 0 && statusFilter !== 'APPROVED' && statusFilter !== 'REJECTED' && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 flex items-center gap-2 text-sm">
          <AlertTriangle size={16} className="text-yellow-600 shrink-0" />
          <span className="text-foreground font-medium">{counts.PENDING} pending refund{counts.PENDING !== 1 ? 's' : ''} awaiting review</span>
        </div>
      )}

      {/* List */}
      {visible.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <RotateCcw size={32} className="mx-auto mb-3 opacity-20" />
          <p className="text-muted-foreground text-sm">No {statusFilter !== 'ALL' ? statusFilter.toLowerCase() : ''} refund requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(req => (
            <RefundRow
              key={req.id}
              req={req}
              processing={processing}
              onProcess={(id, action, approvedAmount, adminNote) =>
                processRequest({ id, action, approvedAmount, adminNote })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRefundsTab;
