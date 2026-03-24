import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Truck, CheckCircle, Clock, Package, MapPin, ExternalLink, Loader2, RotateCcw } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';
import { useAuth } from '@/shared/hooks/use-auth';

interface VendorOrderDetailPanelProps {
  orderId: string;
  onClose: () => void;
}

const STATUS_FLOW: Record<string, { next: string; label: string; icon: React.ReactNode } | null> = {
  PAID: { next: 'SHIPPED', label: 'Mark as Shipped', icon: <Truck size={16} /> },
  SHIPPED: { next: 'DELIVERED', label: 'Mark as Delivered', icon: <CheckCircle size={16} /> },
  DELIVERED: null,
  PENDING: null,
  CANCELLED: null,
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'PENDING': return <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12} /> Pending</span>;
    case 'PAID': return <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold flex items-center gap-1"><Package size={12} /> Paid</span>;
    case 'SHIPPED': return <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-bold flex items-center gap-1"><Truck size={12} /> Shipped</span>;
    case 'DELIVERED': return <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12} /> Delivered</span>;
    case 'CANCELLED': return <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-bold">Cancelled</span>;
    default: return <span className="px-2 py-1 bg-muted text-foreground rounded-full text-xs font-bold">{status}</span>;
  }
};

const VendorOrderDetailPanel: React.FC<VendorOrderDetailPanelProps> = ({ orderId, onClose }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [showTrackingForm, setShowTrackingForm] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundReason, setRefundReason] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['vendor-order-detail', orderId],
    queryFn: async () => {
      const res = await api.get(`/marketplace/orders/${orderId}`);
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await api.patch(`/marketplace/orders/${orderId}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-order-detail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      toast.success('Order updated');
      setShowTrackingForm(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update order');
    },
  });

  const refundMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await api.post(`/marketplace/orders/${orderId}/refund`, {
        refundReason: reason || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-order-detail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      toast.success('Refund issued successfully');
      setShowRefundForm(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to issue refund');
    },
  });

  const nextAction = order ? STATUS_FLOW[order.status] : null;
  const canRefund = order && ['PAID', 'SHIPPED', 'DELIVERED'].includes(order.status);
  const isAdminOrVendor = user?.role === 'ADMIN' || user?.role === 'VENDOR';

  const handleAdvanceStatus = () => {
    if (!nextAction) return;
    if (nextAction.next === 'SHIPPED' && !order?.trackingNumber) {
      setShowTrackingForm(true);
      return;
    }
    updateMutation.mutate({ status: nextAction.next });
  };

  const handleShipWithTracking = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      status: 'SHIPPED',
      trackingNumber: trackingNumber.trim() || undefined,
      carrier: carrier.trim() || undefined,
      trackingUrl: trackingUrl.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Order #{orderId.slice(0, 8).toUpperCase()}
            </h2>
            {order && <div className="mt-1">{getStatusBadge(order.status)}</div>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-muted-foreground" />
          </div>
        ) : !order ? (
          <div className="p-12 text-center text-muted-foreground">Order not found.</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Customer Info */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Customer</p>
              <p className="font-bold text-foreground">{order.customer?.name ?? 'Customer'}</p>
              {order.customer?.email && <p className="text-sm text-muted-foreground">{order.customer.email}</p>}
              {order.shippingAddress && (
                <p className="text-sm text-muted-foreground flex items-start gap-1 mt-1">
                  <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                  {order.shippingAddress}
                </p>
              )}
            </div>

            {/* Order Items */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Items</p>
              <div className="space-y-3">
                {(order.items ?? []).map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                    <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {item.product?.images?.[0] ? (
                        <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Package size={18} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{item.product?.name ?? 'Product'}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-foreground">
                      ₦{Number(item.unitPrice ?? item.price ?? 0).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Total */}
            <div className="flex items-center justify-between py-3 border-t border-border">
              <span className="font-bold text-muted-foreground">Total</span>
              <span className="text-2xl font-bold text-highlight">
                ₦{Number(order.totalAmount ?? 0).toLocaleString()}
              </span>
            </div>

            {/* Tracking Info (if shipped) */}
            {order.trackingNumber && (
              <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 rounded-xl p-4 space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-400 mb-2">Tracking</p>
                <p className="font-bold text-foreground">{order.trackingNumber}</p>
                {order.carrier && <p className="text-sm text-muted-foreground">{order.carrier}</p>}
                {order.trackingUrl && (
                  <a href={order.trackingUrl} target="_blank" rel="noreferrer"
                    className="text-sm text-highlight hover:underline flex items-center gap-1 mt-1">
                    Track shipment <ExternalLink size={12} />
                  </a>
                )}
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Ordered</p>
                <p className="text-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              {order.paidAt && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Paid</p>
                  <p className="text-foreground">{new Date(order.paidAt).toLocaleDateString()}</p>
                </div>
              )}
              {order.shippedAt && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Shipped</p>
                  <p className="text-foreground">{new Date(order.shippedAt).toLocaleDateString()}</p>
                </div>
              )}
              {order.deliveredAt && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Delivered</p>
                  <p className="text-foreground">{new Date(order.deliveredAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {/* Tracking Form (shown when marking as shipped) */}
            {showTrackingForm && (
              <form onSubmit={handleShipWithTracking} className="bg-muted/50 rounded-xl p-4 space-y-3 border border-border">
                <p className="text-sm font-bold text-foreground">Add Tracking Info (optional)</p>
                <input
                  type="text"
                  placeholder="Tracking number"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm outline-none focus:border-highlight"
                />
                <input
                  type="text"
                  placeholder="Carrier (e.g. DHL, FedEx)"
                  value={carrier}
                  onChange={e => setCarrier(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm outline-none focus:border-highlight"
                />
                <input
                  type="url"
                  placeholder="Tracking URL (optional)"
                  value={trackingUrl}
                  onChange={e => setTrackingUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm outline-none focus:border-highlight"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowTrackingForm(false)}
                    className="flex-1 py-2 rounded-lg border border-border text-sm font-bold text-foreground hover:bg-muted transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={updateMutation.isPending}
                    className="flex-[2] py-2 rounded-lg bg-highlight text-foreground font-bold text-sm hover:bg-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                    {updateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
                    Confirm Shipped
                  </button>
                </div>
              </form>
            )}

            {/* Status Action Button */}
            {nextAction && !showTrackingForm && !showRefundForm && (
              <button
                type="button"
                onClick={handleAdvanceStatus}
                disabled={updateMutation.isPending}
                className="w-full py-3 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : nextAction.icon}
                {nextAction.label}
              </button>
            )}

            {/* Refund Form */}
            {showRefundForm && (
              <form
                onSubmit={e => { e.preventDefault(); refundMutation.mutate(refundReason); }}
                className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-4 space-y-3"
              >
                <p className="text-sm font-bold text-red-700 dark:text-red-400">Issue Refund</p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  This will mark the order as refunded and notify the customer. Full refund amount: ₦{Number(order?.totalAmount ?? 0).toLocaleString()}
                </p>
                <textarea
                  rows={2}
                  placeholder="Reason for refund (optional)"
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm outline-none focus:border-red-400 resize-none"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowRefundForm(false)}
                    className="flex-1 py-2 rounded-lg border border-border text-sm font-bold text-foreground hover:bg-muted transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={refundMutation.isPending}
                    className="flex-[2] py-2 rounded-lg bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                    {refundMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                    Confirm Refund
                  </button>
                </div>
              </form>
            )}

            {/* Refund Trigger Button */}
            {canRefund && isAdminOrVendor && !showRefundForm && !showTrackingForm && (
              <button
                type="button"
                onClick={() => setShowRefundForm(true)}
                className="w-full py-2.5 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} /> Issue Refund
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorOrderDetailPanel;
