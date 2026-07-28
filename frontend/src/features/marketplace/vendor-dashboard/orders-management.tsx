// Whole-app audit note: this dashboard tab and the standalone
// vendor-order-list-view.tsx (/vendor/orders) both list+manage the same
// vendor orders against the same endpoints. Not consolidated -- both are
// live, reachable UIs (tab inside the main dashboard vs. a dedicated page);
// left as-is rather than removing either without confirming which callers
// depend on which.
import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Filter, Search, ShoppingBag, Truck, CheckCircle, Clock, Loader2, FileDown, CheckSquare, Square, RotateCcw, Repeat } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/components/toast';
import VendorOrderDetailPanel from '../vendor-order-detail-panel';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  currency?: string;
  createdAt: string;
  trackingNumber?: string | null;
  customer?: { id: string; name: string; email: string } | null;
  // VENDOR_BACKLOG.md VND-009
  isReturningCustomer?: boolean;
  items: Array<{
    product: { name: string } | null;
    quantity: number;
  }>;
}

interface OrdersManagementProps {
  vendorId: string;
  activeTab: string;
}

const STATUS_OPTIONS = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED'];

const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (status) {
    case 'DELIVERED':
    case 'COMPLETED':
      return 'default';
    case 'SHIPPED':
      return 'outline';
    case 'CANCELLED':
    case 'REFUNDED':
      return 'destructive';
    default:
      return 'secondary';
  }
};

// VENDOR_BACKLOG.md VND-009: this whole tab used to be a hardcoded `const
// ordersData: Order[] = []` stub -- the comment above it claimed "Fetching
// real orders from backend API" but nothing was ever fetched, so the
// vendor dashboard's primary Orders tab silently showed "No orders yet"
// for every vendor regardless of real order volume. Now wired to the real
// GET /marketplace/vendors/:vendorId/orders endpoint (filter/search/sort +
// returning-customer flag), plus bulk status update and packing-slip PDF
// export, matching the pattern established in product-management.tsx.
const OrdersManagement: React.FC<OrdersManagementProps> = ({ vendorId, activeTab }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const isActive = activeTab === 'orders';

  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: ordersData = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['vendor-orders-management', vendorId, search, statusFilter, sortBy],
    queryFn: async () => {
      const response = await api.get(`/marketplace/vendors/${vendorId}/orders`, {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          sortBy,
        },
      });
      return response.data;
    },
    enabled: !!vendorId && isActive,
  });

  const bulkShipMutation = useMutation({
    mutationFn: async () => {
      const response = await api.patch(`/marketplace/vendors/${vendorId}/orders/bulk`, {
        orderIds: Array.from(selectedIds),
        status: 'SHIPPED',
      });
      return response.data;
    },
    onSuccess: (result: { updated: number; errors: Array<{ orderId: string; error: string }> }) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders-management', vendorId] });
      if (result.errors.length > 0) {
        toast.error(`Updated ${result.updated} order(s); ${result.errors.length} failed`);
      } else {
        toast.success(`Marked ${result.updated} order(s) as shipped`);
      }
      setSelectedIds(new Set());
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to bulk-update orders');
    },
  });

  const packingSlipsMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(
        `/marketplace/vendors/${vendorId}/orders/packing-slips`,
        { orderIds: Array.from(selectedIds) },
        { responseType: 'blob' }
      );
      return response.data as Blob;
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'packing-slips.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Packing slips downloaded');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to generate packing slips');
    },
  });

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => (prev.size === ordersData.length ? new Set() : new Set(ordersData.map((o) => o.id))));
  };

  const statusBadge = (status: string) => {
    const icon =
      status === 'SHIPPED' ? <Truck size={12} /> :
      status === 'DELIVERED' || status === 'COMPLETED' ? <CheckCircle size={12} /> :
      status === 'CANCELLED' || status === 'REFUNDED' ? <RotateCcw size={12} /> :
      <Clock size={12} />;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${
        status === 'DELIVERED' || status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
        status === 'SHIPPED' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' :
        status === 'CANCELLED' || status === 'REFUNDED' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
      }`}>
        {icon} {status.charAt(0) + status.slice(1).toLowerCase()}
      </span>
    );
  };

  const shippableSelectedCount = useMemo(
    () => ordersData.filter((o) => selectedIds.has(o.id) && (o.status === 'PAID')).length,
    [ordersData, selectedIds]
  );

  if (!isActive) return null;

  return (
    <div className="space-y-6">
      {detailOrderId && (
        <VendorOrderDetailPanel orderId={detailOrderId} onClose={() => setDetailOrderId(null)} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Orders Management</h2>
          <p className="text-muted-foreground">Manage and fulfill customer orders</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card p-4 rounded-xl border border-border flex flex-col gap-4 shadow-sm">
        <div className="flex gap-4 md:items-center flex-col md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID, customer, or product..."
              className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border text-foreground rounded-lg focus:outline-none focus:border-highlight"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)}>
            <Filter size={16} className="mr-2" /> Filter
          </Button>
        </div>
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-border">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-muted/50 border border-border text-foreground rounded-lg text-sm"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'status')}
              className="px-3 py-2 bg-muted/50 border border-border text-foreground rounded-lg text-sm"
            >
              <option value="date">Sort: Newest first</option>
              <option value="amount">Sort: Highest amount</option>
              <option value="status">Sort: Status</option>
            </select>
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-highlight/10 border border-highlight/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm font-bold text-foreground">{selectedIds.size} order(s) selected</p>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              disabled={packingSlipsMutation.isPending}
              onClick={() => packingSlipsMutation.mutate()}
            >
              {packingSlipsMutation.isPending ? <Loader2 size={14} className="mr-2 animate-spin" /> : <FileDown size={14} className="mr-2" />}
              Download Packing Slips
            </Button>
            <Button
              size="sm"
              disabled={bulkShipMutation.isPending || shippableSelectedCount === 0}
              onClick={() => bulkShipMutation.mutate()}
              title={shippableSelectedCount === 0 ? 'Only paid orders can be marked as shipped' : undefined}
            >
              {bulkShipMutation.isPending ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Truck size={14} className="mr-2" />}
              Mark {shippableSelectedCount || ''} as Shipped
            </Button>
          </div>
        </div>
      )}

      {ordersLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading orders...</span>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <button type="button" onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground">
              {selectedIds.size === ordersData.length && ordersData.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
            </button>
            <p className="text-sm text-muted-foreground">
              {ordersData.length} {ordersData.length === 1 ? 'order' : 'orders'}
            </p>
          </div>

          <div className="divide-y divide-border">
            {ordersData.map((order) => (
              <div key={order.id} className="p-6 hover:bg-accent/50 transition-colors flex gap-4">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleSelected(order.id); }}
                  className="text-muted-foreground hover:text-foreground flex-shrink-0 mt-1"
                >
                  {selectedIds.has(order.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
                <div className="flex-1 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer" onClick={() => setDetailOrderId(order.id)}>
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-bold text-foreground text-lg">#{order.id.slice(0, 8).toUpperCase()}</h3>
                      {statusBadge(order.status)}
                      {order.isReturningCustomer && (
                        <span className="px-2 py-1 bg-highlight/10 text-highlight rounded-full text-xs font-bold flex items-center gap-1">
                          <Repeat size={12} /> Returning Customer
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Customer</p>
                        <p className="font-medium">{order.customer?.name ?? 'Customer'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-medium">₦{Number(order.totalAmount ?? 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Items</p>
                        <p className="font-medium">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={(e) => { e.stopPropagation(); setDetailOrderId(order.id); }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {ordersData.length === 0 && !ordersLoading && (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No orders yet</h3>
          <p className="text-muted-foreground">Orders will appear here when customers purchase your products</p>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;
