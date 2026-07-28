import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, Clock, Truck, CheckCircle, RotateCcw, X, Loader2, AlertTriangle, Crown } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  currency?: string;
  createdAt: string;
  vendor?: { businessName?: string; user?: { name?: string } };
  items: Array<{ product?: { name: string } | null; quantity: number }>;
  devotedFreeDelivery?: boolean;
}

interface ReturnRequest {
  id: string;
  orderId: string;
  status: string;
  reasonCategory: string;
  reason: string;
  vendorResponse?: string | null;
  offeredRefundAmount?: number | null;
  returnAddress?: string | null;
}

const REASON_OPTIONS = [
  { value: 'NOT_AS_DESCRIBED', label: 'Not as described' },
  { value: 'DAMAGED_DEFECTIVE', label: 'Damaged or defective' },
  { value: 'WRONG_ITEM', label: 'Wrong item received' },
  { value: 'QUALITY_ISSUE', label: 'Quality issue' },
  { value: 'CHANGED_MIND', label: 'Changed my mind' },
  { value: 'OTHER', label: 'Other' },
];

const RETURNABLE_STATUSES = ['PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'];

const statusBadge = (status: string) => {
  const config: Record<string, { cls: string; icon: React.ReactNode }> = {
    PENDING: { cls: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400', icon: <Clock size={12} /> },
    PAID: { cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', icon: <Package size={12} /> },
    SHIPPED: { cls: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400', icon: <Truck size={12} /> },
    DELIVERED: { cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', icon: <CheckCircle size={12} /> },
    COMPLETED: { cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', icon: <CheckCircle size={12} /> },
    CANCELLED: { cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', icon: <X size={12} /> },
    REFUNDED: { cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', icon: <RotateCcw size={12} /> },
  };
  const c = config[status] ?? { cls: 'bg-muted text-foreground', icon: null };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${c.cls}`}>
      {c.icon} {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
};

// VENDOR_BACKLOG.md VND-010: this page did not exist at all before this item
// -- there was no way for a customer to see their own past orders anywhere
// in the app, let alone request a return on one.
const MyOrdersView: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [returnModalOrder, setReturnModalOrder] = useState<Order | null>(null);
  const [reasonCategory, setReasonCategory] = useState('NOT_AS_DESCRIBED');
  const [reasonText, setReasonText] = useState('');
  const [escalateFor, setEscalateFor] = useState<ReturnRequest | null>(null);
  const [escalateText, setEscalateText] = useState('');

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['my-orders'],
    queryFn: async () => (await api.get('/marketplace/orders')).data ?? [],
  });

  const { data: returnRequests = [] } = useQuery<ReturnRequest[]>({
    queryKey: ['my-return-requests'],
    queryFn: async () => (await api.get('/marketplace/returns/my')).data ?? [],
  });

  const returnByOrderId = new Map(returnRequests.map((r) => [r.orderId, r]));

  const createReturnMutation = useMutation({
    mutationFn: async () => {
      if (!returnModalOrder) return;
      return api.post(`/marketplace/orders/${returnModalOrder.id}/return`, {
        reasonCategory,
        reason: reasonText,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-return-requests'] });
      toast.success('Return requested');
      setReturnModalOrder(null);
      setReasonText('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to request a return'),
  });

  // VENDOR_BACKLOG.md VND-003
  const invoiceMutation = useMutation({
    mutationFn: async (orderId: string) => (await api.get(`/marketplace/orders/${orderId}/invoice`, { responseType: 'blob' })).data as Blob,
    onSuccess: (blob, orderId) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${orderId.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to generate invoice'),
  });

  const confirmReturnMutation = useMutation({
    mutationFn: async (returnRequestId: string) => api.post(`/marketplace/returns/${returnRequestId}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-return-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      toast.success('Return confirmed -- your refund has been processed');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to confirm return'),
  });

  const escalateMutation = useMutation({
    mutationFn: async () => {
      if (!escalateFor) return;
      return api.post(`/marketplace/returns/${escalateFor.id}/escalate`, { description: escalateText });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-return-requests'] });
      toast.success('Escalated to admin for review');
      setEscalateFor(null);
      setEscalateText('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to escalate'),
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <button onClick={() => navigate('/marketplace')} className="text-sm font-bold text-muted-foreground hover:text-foreground mb-1">
            ← Marketplace
          </button>
          <h1 className="text-3xl font-bold brand-font text-foreground">My Orders</h1>
          <p className="text-muted-foreground">Track your purchases and request returns</p>
        </div>
        {/* VENDOR_BACKLOG.md VND-024 */}
        <button
          type="button"
          onClick={() => navigate('/my-downloads')}
          className="px-4 py-2 border border-border rounded-xl text-sm font-bold hover:bg-muted transition-colors"
        >
          My Downloads
        </button>
      </div>

      {ordersLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No orders yet</h3>
          <p className="text-muted-foreground">Your marketplace purchases will show up here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const returnRequest = returnByOrderId.get(order.id);
            return (
              <div key={order.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-bold text-foreground">#{order.id.slice(0, 8).toUpperCase()}</h3>
                      {statusBadge(order.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.vendor?.businessName ?? order.vendor?.user?.name ?? 'Vendor'} · {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-bold text-foreground text-lg">₦{Number(order.totalAmount ?? 0).toLocaleString()}</p>
                </div>

                <p className="text-sm text-muted-foreground">
                  {(order.items ?? []).map((i) => i.product?.name).filter(Boolean).join(', ')}
                </p>

                {order.devotedFreeDelivery && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-full px-2.5 py-1">
                    <Crown size={11} /> Free delivery — Devoted benefit
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => invoiceMutation.mutate(order.id)}
                    disabled={invoiceMutation.isPending}
                    className="px-3 py-1.5 border border-border rounded-lg text-xs font-bold hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    Download Invoice
                  </button>
                  {!returnRequest && RETURNABLE_STATUSES.includes(order.status) && (
                    <button
                      type="button"
                      onClick={() => setReturnModalOrder(order)}
                      className="px-3 py-1.5 border border-border rounded-lg text-xs font-bold hover:bg-muted transition-colors"
                    >
                      Request Return
                    </button>
                  )}
                </div>

                {returnRequest && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                    <p className="font-bold text-foreground">Return status: {returnRequest.status.replace(/_/g, ' ')}</p>
                    {returnRequest.status === 'REJECTED' && returnRequest.vendorResponse && (
                      <p className="text-muted-foreground">Vendor said: {returnRequest.vendorResponse}</p>
                    )}
                    {returnRequest.status === 'PARTIAL_REFUND_OFFERED' && (
                      <p className="text-muted-foreground">
                        Vendor offered a partial refund of ₦{Number(returnRequest.offeredRefundAmount ?? 0).toLocaleString()}
                      </p>
                    )}
                    {returnRequest.status === 'ACCEPTED' && returnRequest.returnAddress && (
                      <p className="text-muted-foreground">Send the item to: {returnRequest.returnAddress}</p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      {['ACCEPTED', 'PARTIAL_REFUND_OFFERED'].includes(returnRequest.status) && (
                        <button
                          type="button"
                          onClick={() => confirmReturnMutation.mutate(returnRequest.id)}
                          disabled={confirmReturnMutation.isPending}
                          className="px-3 py-1.5 bg-highlight text-foreground rounded-lg text-xs font-bold hover:bg-secondary transition-colors disabled:opacity-50"
                        >
                          {confirmReturnMutation.isPending ? 'Confirming...' : 'Confirm Return Sent'}
                        </button>
                      )}
                      {['REQUESTED', 'REJECTED', 'ACCEPTED', 'PARTIAL_REFUND_OFFERED'].includes(returnRequest.status) && (
                        <button
                          type="button"
                          onClick={() => setEscalateFor(returnRequest)}
                          className="px-3 py-1.5 border border-border rounded-lg text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1"
                        >
                          <AlertTriangle size={12} /> Escalate to Admin
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Request Return Modal */}
      {returnModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-lg">Request a Return</h3>
              <button onClick={() => setReturnModalOrder(null)} className="p-1.5 hover:bg-muted rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Reason</label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-foreground text-sm"
              >
                {REASON_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Details</label>
              <textarea
                rows={3}
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="Tell the vendor what happened (at least 10 characters)"
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-foreground text-sm resize-none"
              />
            </div>
            <button
              type="button"
              onClick={() => createReturnMutation.mutate()}
              disabled={createReturnMutation.isPending || reasonText.trim().length < 10}
              className="w-full py-2.5 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createReturnMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
              Submit Return Request
            </button>
          </div>
        </div>
      )}

      {/* Escalate Modal */}
      {escalateFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-lg">Escalate to Admin</h3>
              <button onClick={() => setEscalateFor(null)} className="p-1.5 hover:bg-muted rounded-lg">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              An admin will review this return and make a final decision.
            </p>
            <textarea
              rows={4}
              value={escalateText}
              onChange={(e) => setEscalateText(e.target.value)}
              placeholder="Explain why you and the vendor couldn't agree (at least 20 characters)"
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-foreground text-sm resize-none"
            />
            <button
              type="button"
              onClick={() => escalateMutation.mutate()}
              disabled={escalateMutation.isPending || escalateText.trim().length < 20}
              className="w-full py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {escalateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
              Escalate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrdersView;
